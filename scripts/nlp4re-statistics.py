#!/usr/bin/env python3
"""
nlp4re-statistics.py

1. Send SPARQL query directly to ORKG to list all NLP4RE papers.
2. For each paper IRI, fetch its statements bundle via ORKG library (with caching).
3. Compute RPL metrics and output nlp4re_results.csv.
4. Update Firebase with computed statistics.
5. Supports --reload_data to force re-fetching everything.
6. Calculates global distinct counts across all papers.
7. Handles paper deletions by removing them from CSV.

!!! DEPRECATED: use orkg-statistics.py instead !!!
"""

import os
import json
import hashlib
import argparse
import requests
import pandas as pd
from datetime import datetime, timezone
from orkg import ORKG

# Import Firebase integration
try:
    from firebase_integration import FirebaseManager

    FIREBASE_AVAILABLE = True
except ImportError:
    print(
        "Firebase integration not available. Install firebase-admin to enable Firebase updates."
    )
    FIREBASE_AVAILABLE = False
except Exception as e:
    print(f"Firebase integration error: {e}")
    FIREBASE_AVAILABLE = False

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────
SPARQL_ENDPOINT = "https://www.orkg.org/triplestore"
CACHE_DIR = "./orkg-cache-nlp4re"
os.makedirs(CACHE_DIR, exist_ok=True)

# Initialize ORKG client
orkg = ORKG(host="https://www.orkg.org/")

# NLP4RE uses class C121001 (no venue filter)
SPARQL_QUERY = """
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


# ──────────────────────────────────────────────────────────────────────────────
# 1) Fetch paper IRIs via a simple SPARQL HTTP request
# ──────────────────────────────────────────────────────────────────────────────
def fetch_paper_list():
    headers = {
        "Accept": "application/sparql-results+json",
    }
    params = {"query": SPARQL_QUERY}
    resp = requests.get(SPARQL_ENDPOINT, headers=headers, params=params)
    resp.raise_for_status()

    print("**" * 100)
    print(f"Response status: {resp.status_code}")
    print(f"Response headers: {dict(resp.headers)}")
    print(f"Response content type: {resp.headers.get('content-type', 'unknown')}")
    print(f"Response text (first 500 chars): {resp.text[:500]}")
    print("**" * 100)

    # Check if response is actually JSON
    content_type = resp.headers.get("content-type", "").lower()
    if "json" not in content_type and resp.text.strip():
        print(f"WARNING: Expected JSON but got content-type: {content_type}")
        print(f"Full response text: {resp.text}")
        return []

    # Check if response is empty
    if not resp.text.strip():
        print("WARNING: Received empty response")
        return []

    try:
        data = resp.json()
        print(f"Successfully parsed JSON response: {data}")
        bindings = data.get("results", {}).get("bindings", [])
        papers = [b["paper"]["value"] for b in bindings if "paper" in b]
        # get the resource id from the paper iri
        resource_ids = [paper.split("/")[-1] for paper in papers]
        print(resource_ids)
        print("*" * 100)
        return resource_ids
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse JSON response: {e}")
        print(f"Response text: {resp.text}")
        return []


# ──────────────────────────────────────────────────────────────────────────────
# 2) JSON cache helpers
# ──────────────────────────────────────────────────────────────────────────────
def iri_to_filename(iri: str) -> str:
    h = hashlib.sha256(iri.encode("utf-8")).hexdigest()
    return os.path.join(CACHE_DIR, f"{h}.json")


def load_cached(iri: str):
    path = iri_to_filename(iri)
    if os.path.exists(path):
        return json.load(open(path, "r"))
    return None


def save_cache(iri: str, statements):
    path = iri_to_filename(iri)
    with open(path, "w") as f:
        json.dump(
            {
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "statements": statements,
            },
            f,
        )


# ──────────────────────────────────────────────────────────────────────────────
# 3) RPL metric calculation (per paper - store all IDs for global distinct calculation)
# ──────────────────────────────────────────────────────────────────────────────
def analyze_paper(statements):
    """Analyze a single paper - returns counts and all individual IDs for global distinct calculation."""
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

    return (
        total,
        len(res_ids),
        len(lit_ids),
        len(pred_ids),
        res_ids,  # All resource IDs for global distinct calculation
        lit_ids,  # All literal IDs for global distinct calculation
        pred_ids,  # All predicate IDs for global distinct calculation
    )


# ──────────────────────────────────────────────────────────────────────────────
# 4) Global distinct count calculation
# ──────────────────────────────────────────────────────────────────────────────
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


# ──────────────────────────────────────────────────────────────────────────────
# 5) Main processing loop
# ──────────────────────────────────────────────────────────────────────────────
def process_papers(papers, reload_data=False):
    """Process all papers and return results with global distinct counts."""
    results = []
    all_res_ids = set()
    all_lit_ids = set()
    all_pred_ids = set()

    for i, paper in enumerate(papers, 1):
        paper_id = paper
        paper_title = paper  # Could be replaced with actual title if available
        print(f"[{i}/{len(papers)}] Processing: {paper_title}")

        # Check cache first (unless reload_data is True)
        cache_key = (
            f"paper_v2_{paper_id}"  # Use v2 to avoid conflicts with old cache format
        )
        if not reload_data:
            cached_data = load_cached(cache_key)
            if cached_data:
                print(f"  Using cached data for {paper_id}")
                # Handle both old and new cache formats
                if (
                    isinstance(cached_data.get("statements"), dict)
                    and "statements" in cached_data["statements"]
                ):
                    # Old format: {"fetched_at": "...", "statements": {"statements": [...]}}
                    statements = cached_data["statements"]["statements"]
                else:
                    # New format: {"statements": [...]}
                    statements = cached_data["statements"]
            else:
                print(f"  Fetching fresh data for {paper_id}")
                try:
                    # Use ORKG library to fetch statements bundle
                    bundle = orkg.statements.bundle(thing_id=paper_id)
                    statements = bundle.content["statements"]
                    save_cache(
                        cache_key, statements
                    )  # Save statements directly, not wrapped
                except Exception as e:
                    print(f"  Error fetching {paper_id}: {e}")
                    continue
        else:
            print(f"  Fetching fresh data for {paper_id}")
            try:
                # Use ORKG library to fetch statements bundle
                bundle = orkg.statements.bundle(thing_id=paper_id)
                statements = bundle.content["statements"]
                save_cache(
                    cache_key, statements
                )  # Save statements directly, not wrapped
            except Exception as e:
                print(f"  Error fetching {paper_id}: {e}")
                continue

        # Analyze paper
        (
            total,
            res_count,
            lit_count,
            pred_count,
            res_ids,
            lit_ids,
            pred_ids,
        ) = analyze_paper(statements)

        # Add to global sets for distinct calculation
        all_res_ids.update(res_ids)
        all_lit_ids.update(lit_ids)
        all_pred_ids.update(pred_ids)

        # Store results with all IDs for CSV
        results.append(
            {
                "paper_id": paper_id,
                "paper_title": paper_title,
                "total_statements": total,
                "resource_count": res_count,
                "literal_count": lit_count,
                "predicate_count": pred_count,
                "resource_ids": json.dumps(res_ids),  # Store as JSON string
                "literal_ids": json.dumps(lit_ids),  # Store as JSON string
                "predicate_ids": json.dumps(pred_ids),  # Store as JSON string
            }
        )

    # Calculate global distinct counts
    global_distinct_resources = len(all_res_ids)
    global_distinct_literals = len(all_lit_ids)
    global_distinct_predicates = len(all_pred_ids)

    # Calculate total counts across all papers
    total_statements = sum(r["total_statements"] for r in results)
    total_resources = sum(r["resource_count"] for r in results)
    total_literals = sum(r["literal_count"] for r in results)
    total_predicates = sum(r["predicate_count"] for r in results)

    return results, {
        "total_statements": total_statements,
        "total_resources": total_resources,
        "total_literals": total_literals,
        "total_predicates": total_predicates,
        "global_distinct_resources": global_distinct_resources,
        "global_distinct_literals": global_distinct_literals,
        "global_distinct_predicates": global_distinct_predicates,
    }


# ──────────────────────────────────────────────────────────────────────────────
# 6) Main execution
# ──────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Calculate NLP4RE ORKG metrics")
    parser.add_argument("--limit", type=int, help="Limit number of papers to process")
    parser.add_argument(
        "--reload_data", action="store_true", help="Force reload all data"
    )
    parser.add_argument(
        "--no_firebase", action="store_true", help="Skip Firebase update"
    )
    args = parser.parse_args()

    print("🔍 Fetching NLP4RE papers from ORKG...")
    papers = fetch_paper_list()

    if args.limit:
        papers = papers[: args.limit]
        print(f"📊 Processing limited set of {len(papers)} papers")

    print(f"📊 Processing {len(papers)} papers...")

    # Process papers and get results with global distinct counts
    results, global_stats = process_papers(papers, reload_data=args.reload_data)

    # Create DataFrame with all data including stored IDs
    df = pd.DataFrame(results)

    # Add global statistics as separate columns
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
            df["global_total_resources"] / df["global_distinct_resources"]
        )
    else:
        df["resource_reuse_ratio"] = 0

    if global_stats["global_distinct_literals"] > 0:
        df["literal_reuse_ratio"] = (
            df["global_total_literals"] / df["global_distinct_literals"]
        )
    else:
        df["literal_reuse_ratio"] = 0

    if global_stats["global_distinct_predicates"] > 0:
        df["predicate_reuse_ratio"] = (
            df["global_total_predicates"] / df["global_distinct_predicates"]
        )
    else:
        df["predicate_reuse_ratio"] = 0

    # Save to CSV
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    df["timestamp"] = timestamp

    csv_path = "./nlp4re_results.csv"
    df.to_csv(csv_path, index=False)
    print(f"💾 Results saved to {csv_path}")

    # Print summary
    print("\n📈 Summary:")
    print(f"  Papers processed: {len(results)}")
    print(f"  Total statements: {global_stats['total_statements']:,}")
    print(f"  Total resources: {global_stats['total_resources']:,}")
    print(f"  Total literals: {global_stats['total_literals']:,}")
    print(f"  Total predicates: {global_stats['total_predicates']:,}")
    print(f"  Global distinct resources: {global_stats['global_distinct_resources']:,}")
    print(f"  Global distinct literals: {global_stats['global_distinct_literals']:,}")
    print(
        f"  Global distinct predicates: {global_stats['global_distinct_predicates']:,}"
    )

    # Calculate and print reuse ratios (with division by zero protection)
    resource_reuse = (
        global_stats["total_resources"] / global_stats["global_distinct_resources"]
        if global_stats["global_distinct_resources"] > 0
        else 0
    )
    literal_reuse = (
        global_stats["total_literals"] / global_stats["global_distinct_literals"]
        if global_stats["global_distinct_literals"] > 0
        else 0
    )
    predicate_reuse = (
        global_stats["total_predicates"] / global_stats["global_distinct_predicates"]
        if global_stats["global_distinct_predicates"] > 0
        else 0
    )

    print(f"  Resource reuse ratio: {resource_reuse:.2f}")
    print(f"  Literal reuse ratio: {literal_reuse:.2f}")
    print(f"  Predicate reuse ratio: {predicate_reuse:.2f}")

    # Update Firebase if available and not disabled
    if FIREBASE_AVAILABLE and not args.no_firebase:
        print("\n🔥 Updating Firebase...")
        try:
            # Try multiple possible locations for service account file
            possible_paths = [
                "./firebase-service-account.json",
                os.path.join(
                    os.path.dirname(__file__), "firebase-service-account.json"
                ),
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

            # Add paperCount to the stats (frontend expects this)
            stats_for_firebase = global_stats.copy()
            stats_for_firebase["paperCount"] = len(results)

            # Use new nested path structure: Templates/R1544125/Statistics/nlp4re-statistics
            success = firebase_manager.update_statistics(
                stats_for_firebase,
                template_id="R1544125",
                statistic_id="nlp4re-statistics",
            )

            if success:
                print("✅ Firebase updated successfully")
            else:
                print("❌ Firebase update failed - check error messages above")
        except Exception as e:
            print(f"❌ Firebase update failed: {e}")
    elif not FIREBASE_AVAILABLE:
        print("\n⚠️  Firebase not available - skipping update")
    else:
        print("\n⏭️  Skipping Firebase update (--no_firebase flag)")

    print(f"\n✅ Done! Timestamp: {timestamp}")


if __name__ == "__main__":
    main()
