#!/usr/bin/env python3
import sys
import os
import argparse
import yaml
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from sparql_fetcher import SPARQLFetcher
from pdf_downloader import PDFDownloader
from dataset_organizer import DatasetOrganizer
from data_validator import DataValidator

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False

try:
    from dotenv import load_dotenv
    HAS_DOTENV = True
except ImportError:
    HAS_DOTENV = False

def load_config(config_path: str) -> dict:
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Generate AI evaluation dataset from ORKG')
    parser.add_argument('--config', type=str, default='config.yaml', help='Path to config file')
    parser.add_argument('--limit', type=int, help='Limit number of papers')
    parser.add_argument('--no-pdf', action='store_true', help='Skip PDF downloads')
    parser.add_argument('--resume', action='store_true', help='Resume from previous run')
    parser.add_argument('--retry-failed', action='store_true', help='Only retry papers without PDFs')
    parser.add_argument('--output', type=str, help='Output directory')
    return parser.parse_args()

def validate_config(config: dict, args: argparse.Namespace) -> dict:
    if args.limit is not None:
        config['dataset']['limit_papers'] = args.limit
    if args.output is not None:
        config['dataset']['base_path'] = args.output
    if args.resume:
        config['dataset']['resume_on_failure'] = True
    
    if HAS_DOTENV:
        load_dotenv()
    
    if not args.no_pdf:
        unpaywall_email = os.getenv('UNPAYWALL_EMAIL')
        if unpaywall_email:
            config['pdf_download']['unpaywall_email'] = unpaywall_email
    
    return config

def process_papers(papers: dict, organizer: DatasetOrganizer, pdf_downloader: PDFDownloader = None,
                   skip_pdf: bool = False, resume: bool = False) -> dict:
    stats = {'total': len(papers), 'processed': 0, 'skipped': 0, 'metadata_saved': 0, 'pdf_downloaded': 0, 'pdf_failed': 0, 'errors': 0}
    iterator = tqdm(papers.items(), desc="Processing papers", unit="paper") if HAS_TQDM else papers.items()
    
    for paper_id, metadata in iterator:
        try:
            if resume and organizer.paper_exists(paper_id):
                if skip_pdf or organizer.has_pdf(paper_id):
                    stats['skipped'] += 1
                    continue
            
            paper_dir = organizer.create_paper_directory(paper_id)
            
            full_metadata = {
                'paper_id': paper_id,
                'title': metadata.get('title'),
                'year': metadata.get('year'),
                'doi': metadata.get('doi'),
                'venue': metadata.get('venue'),
                'orkg_uri': paper_id,
                'contribution_id': metadata.get('contribution_id'),
                'pdf_available': False,
                'questionnaire_data': metadata.get('questionnaire_data', {})
            }
            
            organizer.save_metadata(paper_id, full_metadata)
            stats['metadata_saved'] += 1
            
            if not skip_pdf and pdf_downloader and (doi := metadata.get('doi')):
                pdf_path = paper_dir / "paper.pdf"
                if pdf_downloader.download_pdf(doi, str(pdf_path)):
                    stats['pdf_downloaded'] += 1
                    full_metadata['pdf_available'] = True
                    organizer.save_metadata(paper_id, full_metadata)
                else:
                    stats['pdf_failed'] += 1
            
            stats['processed'] += 1
        except:
            stats['errors'] += 1
    
    return stats

def main():
    start_time = datetime.now()
    
    print("=" * 70)
    print("AI Evaluation Dataset Generation")
    print("=" * 70)
    
    args = parse_arguments()
    
    try:
        config = load_config(args.config)
        config = validate_config(config, args)
    except Exception as e:
        print(f"Error loading configuration: {e}")
        sys.exit(1)
    
    print(f"\nOutput directory: {config['dataset']['base_path']}")
    if config['dataset'].get('limit_papers'):
        print(f"Processing limit: {config['dataset']['limit_papers']} papers")
    if args.no_pdf:
        print("PDF downloads: DISABLED")
    print()
    
    try:
        sparql_fetcher = SPARQLFetcher(
            endpoint_url=config['orkg']['endpoint'],
            timeout=config['orkg'].get('timeout', 30)
        )
        
        organizer = DatasetOrganizer(
            base_path=config['dataset']['base_path'],
            skip_existing=config['dataset'].get('skip_existing', True)
        )
        
        pdf_downloader = None
        if not args.no_pdf:
            pdf_downloader = PDFDownloader(
                rate_limit=config['pdf_download'].get('rate_limit', 1.0),
                max_retries=config['pdf_download'].get('max_retries', 3),
                timeout=config['pdf_download'].get('timeout', 30),
                unpaywall_email=config['pdf_download'].get('unpaywall_email')
            )
    except Exception as e:
        print(f"Failed to initialize components: {e}")
        sys.exit(1)
    
    if args.retry_failed:
        print("Retry mode: Only processing papers without PDFs...")
        papers_to_retry = {}
        
        for paper_dir in Path(config['dataset']['base_path']).iterdir():
            if not paper_dir.is_dir() or paper_dir.name.startswith('.'):
                continue
            
            metadata_file = paper_dir / "metadata.json"
            pdf_file = paper_dir / "paper.pdf"
            
            if metadata_file.exists() and not pdf_file.exists():
                try:
                    metadata = json.loads(metadata_file.read_text())
                    papers_to_retry[metadata.get('paper_id', paper_dir.name)] = metadata
                except:
                    pass
        
        papers = papers_to_retry
        print(f"Found {len(papers)} papers without PDFs\n")
        
        if len(papers) == 0:
            print("All papers already have PDFs!")
            sys.exit(0)
    else:
        print("Fetching papers from ORKG...")
        
        try:
            papers = sparql_fetcher.fetch_all_papers_with_metadata(
                limit=config['dataset'].get('limit_papers')
            )
            print(f"Fetched {len(papers)} papers from ORKG\n")
            
            if len(papers) == 0:
                print("No papers found. Exiting.")
                sys.exit(0)
        except Exception as e:
            print(f"Error fetching papers: {e}")
            sys.exit(1)
    
    try:
        stats = process_papers(
            papers=papers,
            organizer=organizer,
            pdf_downloader=pdf_downloader,
            skip_pdf=args.no_pdf,
            resume=config['dataset'].get('resume_on_failure', False)
        )
    except KeyboardInterrupt:
        print("\n\nProcessing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
    finally:
        if pdf_downloader:
            pdf_downloader.close()
    
    print("\nGenerating dataset index...")
    organizer.generate_index()
    
    print("\nGenerating data quality report...")
    validator = DataValidator()
    quality_report = validator.generate_quality_report(
        Path(config['dataset']['base_path']),
        output_file=Path('logs/quality_report.json')
    )
    
    print("\n" + "=" * 70)
    print("Data Quality Summary")
    print("=" * 70)
    summary = quality_report.get('summary', {})
    print(f"Average completeness:      {summary.get('average_completeness', 0.0):.1%}")
    print(f"Papers missing DOI:        {summary.get('papers_missing_doi', 0)}")
    print(f"Papers without PDF:        {summary.get('papers_without_pdf', 0)}")
    print(f"Low completeness papers:   {summary.get('papers_with_low_completeness', 0)}")
    
    elapsed = datetime.now() - start_time
    
    print("\n" + "=" * 70)
    print("Dataset Generation Complete")
    print("=" * 70)
    print(f"\nTotal papers:        {stats['total']}")
    print(f"Processed:           {stats['processed']}")
    print(f"Skipped:             {stats['skipped']}")
    print(f"Metadata saved:      {stats['metadata_saved']}")
    
    if not args.no_pdf:
        print(f"PDFs downloaded:     {stats['pdf_downloaded']}")
        print(f"PDF failures:        {stats['pdf_failed']}")
    
    print(f"Errors:              {stats['errors']}")
    print(f"\nElapsed time:        {elapsed}")
    print(f"Output directory:    {config['dataset']['base_path']}")
    print()
    
    sys.exit(1 if stats['errors'] > 0 else 0)

if __name__ == '__main__':
    main()
