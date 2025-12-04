#!/usr/bin/env python3
"""
orkg-statistics.py

A unified script for calculating ORKG statistics for different templates.
Supports multiple templates (KG-EmpiRE, NLP4RE, etc.) via configuration.

Usage:
    python orkg-statistics.py --template empire
    python orkg-statistics.py --template nlp4re
    python orkg-statistics.py --template empire --reload_data
    python orkg-statistics.py --template nlp4re --limit 10

Features:
1. Send SPARQL query directly to ORKG to list papers for the specified template.
2. For each paper IRI, fetch its statements bundle via ORKG library (with caching).
3. Compute RPL metrics and output results to CSV.
4. Update Firebase with computed statistics.
5. Supports --reload_data to force re-fetching everything.
6. Calculates global distinct counts across all papers.
7. Handles paper deletions by removing them from CSV.
"""

import os
import json
import hashlib
import argparse
import time
import requests
import pandas as pd
from datetime import datetime, timezone
from orkg import ORKG

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

# Import Firebase integration
try:
    from firebase_integration import FirebaseManager
    FIREBASE_AVAILABLE = True
except ImportError:
    print("Firebase integration not available. Install firebase-admin to enable Firebase updates.")
    FIREBASE_AVAILABLE = False
except Exception as e:
    print(f"Firebase integration error: {e}")
    FIREBASE_AVAILABLE = False

# ──────────────────────────────────────────────────────────────────────────────
# Template Configurations
# ──────────────────────────────────────────────────────────────────────────────
TEMPLATE_CONFIGS = {
    "empire": {
        "name": "KG-EmpiRE",
        "cache_dir": "./orkg-cache",
        "output_csv": "./daily_results_incremental.csv",
        "firebase_template_id": "R186491",
        "firebase_statistic_id": "empire-statistics",
        "sparql_query": """
PREFIX r: <http://orkg.org/orkg/resource/>
PREFIX c: <http://orkg.org/orkg/class/>
PREFIX p: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?paper, ?doi
WHERE {
    ?paper p:P31 ?contri.
    OPTIONAL{?paper p:P26 ?doi.} 
    ?contri a c:C27001.
    ?contri p:P135046 ?venue.
    ?venue rdfs:label ?venue_name.
  FILTER ((?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string || ?venue_name = "International Working Conference on Requirements Engineering: Foundation for Software Quality"^^xsd:string))
}
"""
    },
    "nlp4re": {
        "name": "NLP4RE",
        "cache_dir": "./orkg-cache-nlp4re",
        "output_csv": "./nlp4re_results.csv",
        "firebase_template_id": "R1544125",
        "firebase_statistic_id": "nlp4re-statistics",
        "sparql_query": """
PREFIX r: <http://orkg.org/orkg/resource/>
PREFIX c: <http://orkg.org/orkg/class/>
PREFIX p: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?paper, ?doi
WHERE {
    ?paper p:P31 ?contri.
    OPTIONAL{?paper p:P26 ?doi.} 
    ?contri a c:C121001.
}
"""
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────
SPARQL_ENDPOINT = "https://www.orkg.org/triplestore"

# Initialize ORKG client
orkg = ORKG(host="https://www.orkg.org/")


class ORKGStatisticsProcessor:
    """Processor for calculating ORKG statistics for a specific template."""
    
    def __init__(self, template_key: str):
        if template_key not in TEMPLATE_CONFIGS:
            available = ", ".join(TEMPLATE_CONFIGS.keys())
            raise ValueError(f"Unknown template: {template_key}. Available: {available}")
        
        self.config = TEMPLATE_CONFIGS[template_key]
        self.template_key = template_key
        self.cache_dir = self.config["cache_dir"]
        
        # Ensure cache directory exists
        os.makedirs(self.cache_dir, exist_ok=True)
    
    # ──────────────────────────────────────────────────────────────────────────
    # Fetch paper IRIs via SPARQL HTTP request
    # ──────────────────────────────────────────────────────────────────────────
    def fetch_paper_list(self):
        headers = {"Accept": "application/sparql-results+json"}
        params = {"query": self.config["sparql_query"]}
        resp = requests.get(SPARQL_ENDPOINT, headers=headers, params=params)
        resp.raise_for_status()

        print("**" * 100)
        print(f"Response status: {resp.status_code}")
        print(f"Response headers: {dict(resp.headers)}")
        print(f"Response content type: {resp.headers.get('content-type', 'unknown')}")
        print(f"Response text (first 500 chars): {resp.text[:500]}")
        print("**" * 100)

        content_type = resp.headers.get("content-type", "").lower()
        if "json" not in content_type and resp.text.strip():
            print(f"WARNING: Expected JSON but got content-type: {content_type}")
            print(f"Full response text: {resp.text}")
            return []

        if not resp.text.strip():
            print("WARNING: Received empty response")
            return []

        try:
            data = resp.json()
            print(f"Successfully parsed JSON response: {data}")
            bindings = data.get("results", {}).get("bindings", [])
            papers = [b["paper"]["value"] for b in bindings if "paper" in b]
            resource_ids = [paper.split("/")[-1] for paper in papers]
            print(resource_ids)
            print("*" * 100)
            return resource_ids
        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse JSON response: {e}")
            print(f"Response text: {resp.text}")
            return []

    # ──────────────────────────────────────────────────────────────────────────
    # JSON cache helpers
    # ──────────────────────────────────────────────────────────────────────────
    def iri_to_filename(self, iri: str) -> str:
        h = hashlib.sha256(iri.encode("utf-8")).hexdigest()
        return os.path.join(self.cache_dir, f"{h}.json")

    def load_cached(self, iri: str):
        path = self.iri_to_filename(iri)
        if os.path.exists(path):
            return json.load(open(path, "r"))
        return None

    def save_cache(self, iri: str, statements):
        path = self.iri_to_filename(iri)
        with open(path, "w") as f:
            json.dump({
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "statements": statements,
            }, f)

    # ──────────────────────────────────────────────────────────────────────────
    # RPL metric calculation
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def analyze_paper(statements):
        """Analyze a single paper - returns counts and all individual IDs."""
        total = len(statements)
        res_ids, lit_ids, pred_ids = [], [], []

        for stmt in statements:
            s = stmt["subject"]
            if s["_class"] == "resource":
                res_ids.append(s["id"])
            else:
                lit_ids.append(s["id"])

            o = stmt["object"]
            if o["_class"] == "resource":
                res_ids.append(o["id"])
            else:
                lit_ids.append(o["id"])

            p = stmt["predicate"]["id"]
            pred_ids.append(p)

        return (total, len(res_ids), len(lit_ids), len(pred_ids), res_ids, lit_ids, pred_ids)

    # ──────────────────────────────────────────────────────────────────────────
    # Main processing loop
    # ──────────────────────────────────────────────────────────────────────────
    def process_papers(self, papers, reload_data=False):
        """Process all papers and return results with global distinct counts."""
        results = []
        all_res_ids = set()
        all_lit_ids = set()
        all_pred_ids = set()

        for i, paper in enumerate(papers, 1):
            paper_id = paper
            paper_title = paper
            print(f"[{i}/{len(papers)}] Processing: {paper_title}")

            # Try multiple cache key formats for backward compatibility
            cache_key_v2 = f"paper_v2_{paper_id}"
            cache_key_v1 = paper_id  # Old format used just the paper_id
            
            statements = None
            
            if not reload_data:
                # Try v2 cache key first, then fall back to v1
                cached_data = self.load_cached(cache_key_v2)
                if not cached_data:
                    cached_data = self.load_cached(cache_key_v1)
                
                if cached_data:
                    print(f"  Using cached data for {paper_id}")
                    # Handle both old and new cache formats
                    if isinstance(cached_data.get("statements"), dict) and "statements" in cached_data["statements"]:
                        # Old format: {"fetched_at": "...", "statements": {"statements": [...]}}
                        statements = cached_data["statements"]["statements"]
                    else:
                        # New format: {"statements": [...]}
                        statements = cached_data["statements"]
                else:
                    print(f"  Fetching fresh data for {paper_id}")
                    try:
                        bundle = orkg.statements.bundle(thing_id=paper_id)
                        statements = bundle.content["statements"]
                        self.save_cache(cache_key_v2, statements)
                    except Exception as e:
                        print(f"  Error fetching {paper_id}: {e}")
                        continue
            else:
                print(f"  Fetching fresh data for {paper_id}")
                try:
                    bundle = orkg.statements.bundle(thing_id=paper_id)
                    statements = bundle.content["statements"]
                    self.save_cache(cache_key_v2, statements)
                except Exception as e:
                    print(f"  Error fetching {paper_id}: {e}")
                    continue

            total, res_count, lit_count, pred_count, res_ids, lit_ids, pred_ids = self.analyze_paper(statements)

            all_res_ids.update(res_ids)
            all_lit_ids.update(lit_ids)
            all_pred_ids.update(pred_ids)

            results.append({
                "paper_id": paper_id,
                "paper_title": paper_title,
                "total_statements": total,
                "resource_count": res_count,
                "literal_count": lit_count,
                "predicate_count": pred_count,
                "resource_ids": json.dumps(res_ids),
                "literal_ids": json.dumps(lit_ids),
                "predicate_ids": json.dumps(pred_ids),
            })

        global_stats = {
            "total_statements": sum(r["total_statements"] for r in results),
            "total_resources": sum(r["resource_count"] for r in results),
            "total_literals": sum(r["literal_count"] for r in results),
            "total_predicates": sum(r["predicate_count"] for r in results),
            "global_distinct_resources": len(all_res_ids),
            "global_distinct_literals": len(all_lit_ids),
            "global_distinct_predicates": len(all_pred_ids),
        }

        return results, global_stats

    # ──────────────────────────────────────────────────────────────────────────
    # Global distinct count calculation (standalone function for flexibility)
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def calculate_global_distinct_counts(all_statements):
        """Calculate global distinct counts across all papers.

        Args:
            all_statements: Dictionary mapping paper_id to list of statements

        Returns:
            Tuple of (global_distinct_resources, global_distinct_literals, global_distinct_predicates)
        """
        all_res_ids = set()
        all_lit_ids = set()
        all_pred_ids = set()

        for paper_id, statements in all_statements.items():
            for stmt in statements:
                s = stmt.get("subject", {})
                if s.get("_class") == "resource":
                    all_res_ids.add(s.get("id"))
                else:
                    all_lit_ids.add(s.get("id"))

                o = stmt.get("object", {})
                if o.get("_class") == "resource":
                    all_res_ids.add(o.get("id"))
                else:
                    all_lit_ids.add(o.get("id"))

                p = stmt.get("predicate", {}).get("id")
                if p:
                    all_pred_ids.add(p)

        return len(all_res_ids), len(all_lit_ids), len(all_pred_ids)

    # ──────────────────────────────────────────────────────────────────────────
    # Fetch statements bundle with cache
    # ──────────────────────────────────────────────────────────────────────────
    def fetch_bundle(self, resource_id, reload_data=False):
        """Fetch statements bundle for a resource with caching."""
        if not reload_data:
            cached = self.load_cached(resource_id)
            if cached:
                return resource_id, cached["statements"]

        try:
            bundle = orkg.statements.bundle(thing_id=resource_id)
            stmts = bundle.content["statements"]
            self.save_cache(resource_id, stmts)
            return resource_id, stmts
        except Exception as e:
            print(f"Resource {resource_id} not found, skipping... ({e})")
            return resource_id, []

    # ──────────────────────────────────────────────────────────────────────────
    # Handle paper deletions - remove papers no longer in SPARQL results
    # ──────────────────────────────────────────────────────────────────────────
    def handle_paper_deletions(self, current_papers):
        """Remove papers from CSV that are no longer in SPARQL results."""
        results_file = self.config["output_csv"]
        
        if not os.path.exists(results_file):
            return

        current_papers_set = set(current_papers)
        temp_file = results_file + ".tmp"

        with open(results_file, "r") as infile, open(temp_file, "w") as outfile:
            for line in infile:
                if line.startswith("paper,") or line.startswith("paper_id,"):  # Keep header
                    outfile.write(line)
                else:
                    paper_id = line.split(",")[0].strip()
                    if paper_id in current_papers_set:
                        outfile.write(line)
                    else:
                        print(f"Removing deleted paper: {paper_id}")
                        # Also remove from cache
                        cache_file = self.iri_to_filename(paper_id)
                        if os.path.exists(cache_file):
                            os.remove(cache_file)
                            print(f"  - Removed cache file: {cache_file}")

        # Replace original file with cleaned version
        os.replace(temp_file, results_file)
        print(f"Cleaned CSV file - removed deleted papers")

    # ──────────────────────────────────────────────────────────────────────────
    # Save results to CSV
    # ──────────────────────────────────────────────────────────────────────────
    def save_results(self, results, global_stats):
        """Save results to CSV file."""
        df = pd.DataFrame(results)

        # Add global statistics as separate columns (matching original format)
        df["global_total_statements"] = global_stats["total_statements"]
        df["global_total_resources"] = global_stats["total_resources"]
        df["global_total_literals"] = global_stats["total_literals"]
        df["global_total_predicates"] = global_stats["total_predicates"]
        df["global_distinct_resources"] = global_stats["global_distinct_resources"]
        df["global_distinct_literals"] = global_stats["global_distinct_literals"]
        df["global_distinct_predicates"] = global_stats["global_distinct_predicates"]

        # Calculate reuse ratios (with division by zero protection)
        if global_stats["global_distinct_resources"] > 0:
            df["resource_reuse_ratio"] = (
                global_stats["total_resources"] / global_stats["global_distinct_resources"]
            )
        else:
            df["resource_reuse_ratio"] = 0

        if global_stats["global_distinct_literals"] > 0:
            df["literal_reuse_ratio"] = (
                global_stats["total_literals"] / global_stats["global_distinct_literals"]
            )
        else:
            df["literal_reuse_ratio"] = 0

        if global_stats["global_distinct_predicates"] > 0:
            df["predicate_reuse_ratio"] = (
                global_stats["total_predicates"] / global_stats["global_distinct_predicates"]
            )
        else:
            df["predicate_reuse_ratio"] = 0

        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        df["timestamp"] = timestamp

        csv_path = self.config["output_csv"]
        df.to_csv(csv_path, index=False)
        print(f"💾 Results saved to {csv_path}")
        
        return timestamp

    # ──────────────────────────────────────────────────────────────────────────
    # Update Firebase
    # ──────────────────────────────────────────────────────────────────────────
    def update_firebase(self, results, global_stats):
        """Update Firebase with statistics."""
        if not FIREBASE_AVAILABLE:
            print("\n⚠️  Firebase not available - skipping update")
            return False

        print("\n🔥 Updating Firebase...")
        try:
            possible_paths = [
                "./firebase-service-account.json",
                os.path.join(os.path.dirname(__file__), "firebase-service-account.json"),
                "firebase-service-account.json",
            ]

            service_account_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    service_account_path = path
                    break

            if not service_account_path:
                print("Service account file not found, trying environment variable...")

            firebase_manager = FirebaseManager(service_account_path)

            stats_for_firebase = global_stats.copy()
            stats_for_firebase["paperCount"] = len(results)

            success = firebase_manager.update_statistics(
                stats_for_firebase,
                template_id=self.config["firebase_template_id"],
                statistic_id=self.config["firebase_statistic_id"],
            )

            if success:
                print("✅ Firebase updated successfully")
            else:
                print("❌ Firebase update failed - check error messages above")
            return success
        except Exception as e:
            print(f"❌ Firebase update failed: {e}")
            return False

    # ──────────────────────────────────────────────────────────────────────────
    # Print summary
    # ──────────────────────────────────────────────────────────────────────────
    def print_summary(self, results, global_stats):
        """Print processing summary."""
        print(f"\n📈 Summary for {self.config['name']}:")
        print(f"  Papers processed: {len(results)}")
        print(f"  Total statements: {global_stats['total_statements']:,}")
        print(f"  Total resources: {global_stats['total_resources']:,}")
        print(f"  Total literals: {global_stats['total_literals']:,}")
        print(f"  Total predicates: {global_stats['total_predicates']:,}")
        print(f"  Global distinct resources: {global_stats['global_distinct_resources']:,}")
        print(f"  Global distinct literals: {global_stats['global_distinct_literals']:,}")
        print(f"  Global distinct predicates: {global_stats['global_distinct_predicates']:,}")

        # Reuse ratios
        for metric, total_key, distinct_key in [
            ("Resource", "total_resources", "global_distinct_resources"),
            ("Literal", "total_literals", "global_distinct_literals"),
            ("Predicate", "total_predicates", "global_distinct_predicates"),
        ]:
            ratio = global_stats[total_key] / global_stats[distinct_key] if global_stats[distinct_key] > 0 else 0
            print(f"  {metric} reuse ratio: {ratio:.2f}")


def main():
    parser = argparse.ArgumentParser(
        description="Calculate ORKG statistics for different templates",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Available templates:
{chr(10).join(f"  - {key}: {cfg['name']}" for key, cfg in TEMPLATE_CONFIGS.items())}

Examples:
  python orkg-statistics.py --template empire
  python orkg-statistics.py --template nlp4re --reload_data
  python orkg-statistics.py --template empire --limit 10 --no_firebase
"""
    )
    parser.add_argument(
        "--template", "-t",
        type=str,
        required=True,
        choices=list(TEMPLATE_CONFIGS.keys()),
        help="Template to process"
    )
    parser.add_argument("--limit", type=int, help="Limit number of papers to process")
    parser.add_argument("--reload_data", action="store_true", help="Force reload all data")
    parser.add_argument("--no_firebase", action="store_true", help="Skip Firebase update")
    args = parser.parse_args()

    # Initialize processor
    processor = ORKGStatisticsProcessor(args.template)
    config = processor.config

    print(f"🔍 Fetching {config['name']} papers from ORKG...")
    papers = processor.fetch_paper_list()

    # Handle paper deletions - remove papers no longer in SPARQL results
    processor.handle_paper_deletions(papers)

    if args.limit:
        papers = papers[:args.limit]
        print(f"📊 Processing limited set of {len(papers)} papers")

    print(f"📊 Processing {len(papers)} papers...")

    # Process papers
    results, global_stats = processor.process_papers(papers, reload_data=args.reload_data)

    # Save results
    timestamp = processor.save_results(results, global_stats)

    # Print summary
    processor.print_summary(results, global_stats)

    # Update Firebase
    if not args.no_firebase:
        processor.update_firebase(results, global_stats)
    else:
        print("\n⏭️  Skipping Firebase update (--no_firebase flag)")

    print(f"\n✅ Done! Timestamp: {timestamp}")


if __name__ == "__main__":
    main()
