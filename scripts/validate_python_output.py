
import importlib.util
import sys
import json
import os
import argparse
from datetime import datetime

# Import the module with hyphen in name
spec = importlib.util.spec_from_file_location("orkg_statistics", os.path.join(os.path.dirname(__file__), "orkg-statistics.py"))
orkg_statistics = importlib.util.module_from_spec(spec)
sys.modules["orkg_statistics"] = orkg_statistics
spec.loader.exec_module(orkg_statistics)

ORKGStatisticsProcessor = orkg_statistics.ORKGStatisticsProcessor

def main():
    parser = argparse.ArgumentParser(description="Validate Python output for migration")
    parser.add_argument("--template", type=str, default="empire", help="Template to process")
    parser.add_argument("--limit", type=int, default=5, help="Limit number of papers to process")
    args = parser.parse_args()

    print(f"Running validation for template: {args.template}, limit: {args.limit}")

    # Initialize processor
    processor = ORKGStatisticsProcessor(args.template)
    
    # Mock firebase method to avoid actual writes during validation
    processor.update_firebase = lambda *args, **kwargs: print("Skipping Firebase update (Validation Mode)")

    # Fetch papers
    papers = processor.fetch_paper_list()
    
    # Limit if requested
    if args.limit:
        papers = papers[:args.limit]
    
    # Process papers
    results, global_stats = processor.process_papers(papers, reload_data=False)

    # Prepare output structure identical to what we expect to compare
    output_data = {
        "results": results,
        "global_stats": global_stats,
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "count": len(results)
        }
    }

    # Write to file
    output_file = "python_output.json"
    with open(output_file, "w") as f:
        json.dump(output_data, f, indent=2)
    
    print(f"Validation output written to {output_file}")

if __name__ == "__main__":
    main()
