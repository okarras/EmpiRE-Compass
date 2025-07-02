#!/usr/bin/env python3
"""
daily_orkg_metrics.py

1. Send SPARQL query directly to ORKG to list all KG-EmpiRE papers.
2. For each paper IRI, fetch its statements bundle via ORKG library (with caching).
3. Compute RPL metrics and output daily_results.csv.
4. Supports --reload_data to force re-fetching everything.
"""

import os
import json
import hashlib
import argparse
import requests
import pandas as pd
from datetime import datetime
from orkg import ORKG

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────
SPARQL_ENDPOINT = "https://www.orkg.org/triplestore"
CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# Initialize ORKG client
orkg = ORKG(host="https://www.orkg.org/")

SPARQL_QUERY = """
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?paper WHERE {
  ?paper orkgp:P31 ?contri.
  ?contri a orkgc:C27001.
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
            {"fetched_at": datetime.utcnow().isoformat(), "statements": statements}, f
        )


# ──────────────────────────────────────────────────────────────────────────────
# 3) RPL metric calculation
# ──────────────────────────────────────────────────────────────────────────────
def analyze(statements):
    total = len(statements)
    res_ids, lit_ids, pred_ids = [], [], []
    dist_res, dist_lit, dist_pred = set(), set(), set()

    for stmt in statements:
        s = stmt["subject"]
        if s["_class"] == "resource":
            res_ids.append(s["id"])
            dist_res.add(s["id"])
        else:
            lit_ids.append(s["id"])
            dist_lit.add(s["id"])

        o = stmt["object"]
        if o["_class"] == "resource":
            res_ids.append(o["id"])
            dist_res.add(o["id"])
        else:
            lit_ids.append(o["id"])
            dist_lit.add(o["id"])

        p = stmt["predicate"]["id"]
        pred_ids.append(p)
        dist_pred.add(p)

    return (
        total,
        len(res_ids),
        len(dist_res),
        len(lit_ids),
        len(dist_lit),
        len(pred_ids),
        len(dist_pred),
    )


# ──────────────────────────────────────────────────────────────────────────────
# 4) Fetch statements bundle with cache using ORKG library
# ──────────────────────────────────────────────────────────────────────────────
def fetch_bundle(resource_id, reload_data=False):
    # Use cache if available
    if not reload_data:
        cached = load_cached(resource_id)
        if cached:
            return resource_id, cached["statements"]

    try:
        # Use ORKG library to fetch statements bundle
        bundle = orkg.statements.bundle(thing_id=resource_id, maxLevel=15)
        stmts = bundle.content["statements"]
        save_cache(resource_id, stmts)
        return resource_id, stmts
    except Exception as e:
        print(f"Resource {resource_id} not found, skipping... ({e})")
        return resource_id, []


def process_all(papers, reload_data=False):
    results = []
    results_file = "scripts/daily_results_incremental.csv"

    # Check for already processed papers
    processed_papers = set()
    if os.path.exists(results_file) and not reload_data:
        with open(results_file, "r") as f:
            for line in f:
                if line.strip() and not line.startswith("paper,"):  # Skip header
                    paper_id = line.split(",")[0].strip()
                    processed_papers.add(paper_id)
        print(f"Found {len(processed_papers)} already processed papers")

    # Create header if file doesn't exist
    if not os.path.exists(results_file):
        with open(results_file, "w") as f:
            f.write(
                "paper,#Statements,#Resources,#DistResources,#Literals,#DistLiterals,#Predicates,#DistPredicates\n"
            )

    for i, resource_id in enumerate(papers):
        # Skip if already processed (unless reload_data is True)
        if resource_id in processed_papers and not reload_data:
            print(f"Skipping {i+1}/{len(papers)}: {resource_id} (already processed)")
            continue
        print(f"Processing {i+1}/{len(papers)}: {resource_id}")
        try:
            iri, stmts = fetch_bundle(resource_id, reload_data)
            metrics = analyze(stmts)
            result = (iri, *metrics)
            results.append(result)

            # Save result immediately to file
            with open(results_file, "a") as f:
                f.write(
                    f"{iri},{metrics[0]},{metrics[1]},{metrics[2]},{metrics[3]},{metrics[4]},{metrics[5]},{metrics[6]}\n"
                )

            print(f"  ✓ Saved: {metrics[0]} statements")

        except Exception as e:
            print(f"  ✗ Error processing {resource_id}: {e}")
            # Still append empty result to maintain list structure
            result = (resource_id, 0, 0, 0, 0, 0, 0, 0)
            results.append(result)

            # Save error result to file
            with open(results_file, "a") as f:
                f.write(f"{resource_id},0,0,0,0,0,0,0\n")

    print(f"\nIncremental results saved to: {results_file}")
    return results


# ──────────────────────────────────────────────────────────────────────────────
# 5) Main entrypoint & CLI
# ──────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Daily ORKG KG‑EmpiRE RPL metrics via SPARQL + HTTP"
    )
    parser.add_argument(
        "--reload_data",
        action="store_true",
        help="Ignore cache and re-fetch all bundles",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit processing to first N papers (for testing)",
    )
    args = parser.parse_args()

    print(f"[{datetime.utcnow().isoformat()}] Fetching paper list…")
    papers = fetch_paper_list()
    print(f" → Found {len(papers)} papers.")

    # Limit papers if requested
    if args.limit:
        papers = papers[: args.limit]
        print(f" → Limited to first {len(papers)} papers for testing.")

    print(
        f"[{datetime.utcnow().isoformat()}] Fetching bundles{' (reload)' if args.reload_data else ''}…"
    )
    results = process_all(papers, reload_data=args.reload_data)

    df = pd.read_csv("scripts/daily_results_incremental.csv")

    # sum the number of statements, resources, distresources, literals, distliterals, predicates, distpredicates
    total_statements = df["#Statements"].sum()
    total_resources = df["#Resources"].sum()
    total_distresources = df["#DistResources"].sum()
    total_literals = df["#Literals"].sum()
    total_distliterals = df["#DistLiterals"].sum()
    total_predicates = df["#Predicates"].sum()
    total_distpredicates = df["#DistPredicates"].sum()
    print(f"Total statements: {total_statements}")
    print(f"Total resources: {total_resources}")
    print(f"Total distresources: {total_distresources}")
    print(f"Total literals: {total_literals}")
    print(f"Total distliterals: {total_distliterals}")
    print(f"Total predicates: {total_predicates}")
    print(f"Total distpredicates: {total_distpredicates}")


if __name__ == "__main__":
    main()
