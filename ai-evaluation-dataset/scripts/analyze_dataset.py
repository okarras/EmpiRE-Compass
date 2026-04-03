#!/usr/bin/env python3Dataset Analysis Script - Analyze the generated datasetimport argparse
from pathlib import Path
from utils import (
    load_dataset_index,
    load_paper_metadata,
    validate_dataset_structure,
    get_dataset_statistics,
    filter_papers_by_criteria,
    get_field_statistics,
    export_to_csv
)

def print_header(title: str):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def analyze_basic_statistics(dataset_path: str):
    print_header("BASIC DATASET STATISTICS")
    
    try:
        index = load_dataset_index(dataset_path)
        print(f"\n✓ Dataset loaded from: {dataset_path}")
        print(f"  Generated at: {index.get('generated_at', 'Unknown')}")
    except FileNotFoundError as e:
        print(f"\n✗ Error: {e}")
        return
    
    stats = get_dataset_statistics(dataset_path)
    
    print(f"\nTotal Papers: {stats['total_papers']}")
    print(f"Papers with PDF: {stats['papers_with_pdf']} ({stats['pdf_download_rate']:.1%})")
    print(f"Papers without PDF: {stats['papers_without_pdf']}")
    print(f"Papers with DOI: {stats['papers_with_doi']}")
    print(f"Average Metadata Completeness: {stats['average_completeness']:.1%}")
    
    print("\nVenue Distribution:")
    for venue, count in sorted(stats['venues'].items(), key=lambda x: x[1], reverse=True):
        print(f"  - {venue}: {count} papers")
    
    print("\nYear Distribution:")
    for year, count in sorted(stats['years'].items()):
        print(f"  - {year}: {count} papers")
    
    print("\nMetadata Completeness Distribution:")
    dist = stats['completeness_distribution']
    print(f"  - High (>80%):     {dist['high']} papers")
    print(f"  - Medium (50-80%): {dist['medium']} papers")
    print(f"  - Low (20-50%):    {dist['low']} papers")
    print(f"  - Minimal (<20%):  {dist['minimal']} papers")

def iterate_through_papers(dataset_path: str, limit: int = 5):
    print_header(f"ITERATING THROUGH PAPERS (showing first {limit})")
    
    try:
        index = load_dataset_index(dataset_path)
    except FileNotFoundError as e:
        print(f"\n✗ Error: {e}")
        return
    
    for i, paper in enumerate(index.get('papers', [])[:limit], 1):
        paper_id = paper.get('paper_id')
        print(f"\n--- Paper {i}: {paper_id} ---")
        print(f"Title: {paper.get('title', 'N/A')}")
        print(f"Year: {paper.get('year', 'N/A')}")
        print(f"DOI: {paper.get('doi', 'N/A')}")
        print(f"Venue: {paper.get('venue', 'N/A')}")
        print(f"PDF Available: {paper.get('pdf_status') == 'downloaded'}")
        print(f"Metadata Completeness: {paper.get('metadata_completeness', 0.0):.1%}")
        
        try:
            metadata = load_paper_metadata(paper_id, dataset_path)
            qdata = metadata.get('questionnaire_data', {})
            
            methods = qdata.get('data_collection', {}).get('methods', [])
            if methods:
                print(f"Data Collection Methods: {len(methods)}")
                for method in methods[:3]:
                    print(f"  - {method.get('name', 'N/A')} ({method.get('type', 'N/A')})")
            
            rqs = qdata.get('research_questions', [])
            if rqs:
                print(f"Research Questions: {len(rqs)}")
                for rq in rqs[:2]:
                    q = rq.get('question', 'N/A')
                    print(f"  - {q[:80]}..." if len(q) > 80 else f"  - {q}")
        except:
            print("  ⚠ Could not load metadata")

def analyze_specific_fields(dataset_path: str):
    print_header("FIELD-SPECIFIC ANALYSIS")
    print("\n--- Data Collection Methods ---")
    dc_stats = get_field_statistics(dataset_path, "questionnaire_data.data_collection.methods")
    print(f"Coverage: {dc_stats['papers_with_field']}/{dc_stats['total_papers']} papers ({dc_stats['coverage']:.1%})")
    print(f"Total method entries: {dc_stats['total_values']}")
    print(f"Unique methods: {dc_stats['unique_values_count']}")
    
    print("\n--- Research Questions ---")
    rq_stats = get_field_statistics(dataset_path, "questionnaire_data.research_questions")
    print(f"Coverage: {rq_stats['papers_with_field']}/{rq_stats['total_papers']} papers ({rq_stats['coverage']:.1%})")
    print(f"Total research questions: {rq_stats['total_values']}")

def filter_papers_example(dataset_path: str):
    print_header("FILTERING PAPERS")
    print("\n--- Papers with >80% completeness and PDF ---")
    high_quality = filter_papers_by_criteria(dataset_path, min_completeness=0.8, has_pdf=True)
    print(f"Found {len(high_quality)} papers")
    for paper in high_quality[:3]:
        print(f"  - {paper['paper_id']}: {paper.get('title', 'N/A')[:60]}...")
    
    print("\n--- Papers from IEEE RE conference ---")
    ieee_papers = filter_papers_by_criteria(dataset_path, venue="IEEE International Requirements Engineering Conference")
    print(f"Found {len(ieee_papers)} papers")
    
    print("\n--- Papers without PDF ---")
    no_pdf = filter_papers_by_criteria(dataset_path, has_pdf=False)
    print(f"Found {len(no_pdf)} papers")
    for paper in no_pdf[:5]:
        print(f"  - {paper['paper_id']}: DOI={paper.get('doi', 'N/A')}")

def validate_dataset(dataset_path: str):
    print_header("DATASET VALIDATION")
    
    print("\nValidating dataset structure...")
    is_valid, errors = validate_dataset_structure(dataset_path)
    
    if is_valid:
        print("✓ Dataset structure is valid!")
    else:
        print(f"✗ Found {len(errors)} validation errors:")
        for error in errors[:10]:
            print(f"  - {error}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors")

def main():
    parser = argparse.ArgumentParser(description='Analyze the generated dataset')
    parser.add_argument('--dataset-path', type=str, default='dataset', help='Path to dataset directory')
    parser.add_argument('--export-csv', type=str, help='Export dataset to CSV file')
    parser.add_argument('--only-basic', action='store_true', help='Run only basic statistics')
    parser.add_argument('--only-iterate', action='store_true', help='Run only paper iteration')
    parser.add_argument('--only-fields', action='store_true', help='Run only field analysis')
    parser.add_argument('--only-filter', action='store_true', help='Run only filtering')
    parser.add_argument('--only-validate', action='store_true', help='Run only validation')
    parser.add_argument('--limit', type=int, default=5, help='Number of papers to show')
    args = parser.parse_args()
    
    if not Path(args.dataset_path).exists():
        print(f"\n✗ Error: Dataset directory not found: {args.dataset_path}")
        print("\nPlease run generate_dataset.py first.")
        return 1
    
    print("\n" + "=" * 80)
    print("  DATASET ANALYSIS")
    print("=" * 80)
    print(f"\nDataset path: {args.dataset_path}")
    
    run_all = not any([args.only_basic, args.only_iterate, args.only_fields, 
                       args.only_filter, args.only_validate])
    
    if run_all or args.only_validate:
        validate_dataset(args.dataset_path)
    
    if run_all or args.only_basic:
        analyze_basic_statistics(args.dataset_path)
    
    if run_all or args.only_iterate:
        iterate_through_papers(args.dataset_path, limit=args.limit)
    
    if run_all or args.only_fields:
        analyze_specific_fields(args.dataset_path)
    
    if run_all or args.only_filter:
        filter_papers_example(args.dataset_path)
    
    if args.export_csv:
        print_header("EXPORTING TO CSV")
        print(f"\nExporting to: {args.export_csv}")
        if export_to_csv(args.dataset_path, args.export_csv):
            print("Export successful!")
        else:
            print("Export failed!")
    
    print("\n" + "=" * 80)
    print("  ANALYSIS COMPLETE")
    print("=" * 80)
    print()
    
    return 0

if __name__ == '__main__':
    exit(main())
