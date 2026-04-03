#!/usr/bin/env python3
"""
Regenerate metadata.json files for all papers without re-downloading PDFs
This updates the metadata structure with all new fields from the updated SPARQL query
"""
import sys
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from sparql_fetcher import SPARQLFetcher
from dataset_organizer import DatasetOrganizer

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False

def regenerate_metadata(dataset_path: str = 'dataset'):
    """Regenerate metadata for all existing papers"""
    
    print("Regenerating Metadata Files")
    print()
    
    print("Fetching fresh data from ORKG...")
    sparql_fetcher = SPARQLFetcher(
        endpoint_url='https://orkg.org/triplestore',
        timeout=60
    )
    
    papers = sparql_fetcher.fetch_all_papers_with_metadata(limit=None)
    print(f"Fetched {len(papers)} papers from ORKG")
    print()
    
    organizer = DatasetOrganizer(
        base_path=dataset_path,
        skip_existing=False 
    )
    
    dataset_dir = Path(dataset_path)
    if not dataset_dir.exists():
        print(f"Dataset directory not found: {dataset_path}")
        sys.exit(1)
    
    existing_dirs = [d for d in dataset_dir.iterdir() 
                     if d.is_dir() and not d.name.startswith('.')]
    
    print(f"Found {len(existing_dirs)} existing paper directories")
    print()
    
    stats = {
        'total': len(existing_dirs),
        'updated': 0,
        'skipped': 0,
        'errors': 0,
        'pdf_preserved': 0
    }
    
    iterator = tqdm(existing_dirs, desc="Updating metadata") if HAS_TQDM else existing_dirs
    
    for paper_dir in iterator:
        try:
            metadata_file = paper_dir / 'metadata.json'
            if not metadata_file.exists():
                print(f"  No metadata.json in {paper_dir.name}, skipping")
                stats['skipped'] += 1
                continue
            
            old_metadata = json.loads(metadata_file.read_text())
            paper_id = old_metadata.get('paper_id') or old_metadata.get('orkg_uri')
            
            if not paper_id:
                print(f"  No paper_id in {paper_dir.name}, skipping")
                stats['skipped'] += 1
                continue
            
            if paper_id not in papers:
                print(f"  Paper {paper_id} not found in ORKG data, skipping")
                stats['skipped'] += 1
                continue
            
            fresh_data = papers[paper_id]
            
            pdf_file = paper_dir / 'paper.pdf'
            has_pdf = pdf_file.exists()
            
            new_metadata = {
                'paper_id': fresh_data.get('paper_id'),
                'title': fresh_data.get('title'),
                'year': fresh_data.get('year'),
                'doi': fresh_data.get('doi'),
                'venue': fresh_data.get('venue'),
                'orkg_uri': fresh_data.get('paper_id'),
                'contribution_id': fresh_data.get('contribution_id'),
                'pdf_available': has_pdf,
                'questionnaire_data': fresh_data.get('questionnaire_data', {}),
                'extraction_date': datetime.utcnow().isoformat() + 'Z'
            }
            
            if has_pdf and 'pdf_downloaded_at' in old_metadata:
                new_metadata['pdf_downloaded_at'] = old_metadata['pdf_downloaded_at']
                stats['pdf_preserved'] += 1
            
            metadata_file.write_text(json.dumps(new_metadata, indent=2))
            stats['updated'] += 1
            
        except Exception as e:
            print(f" Error processing {paper_dir.name}: {e}")
            stats['errors'] += 1
    
    print()
    print("=" * 80)
    print("Regeneration Complete")
    print("=" * 80)
    print(f"Total directories:     {stats['total']}")
    print(f"Metadata updated:      {stats['updated']}")
    print(f"PDFs preserved:        {stats['pdf_preserved']}")
    print(f"Skipped:               {stats['skipped']}")
    print(f"Errors:                {stats['errors']}")
    print()
    
    # Regenerate index
    print("Regenerating dataset index...")
    organizer.generate_index()
    print("Index updated")
    print()
    
    return stats['errors'] == 0

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Regenerate metadata.json files')
    parser.add_argument('--dataset', type=str, default='dataset',
                        help='Path to dataset directory')
    args = parser.parse_args()
    
    success = regenerate_metadata(args.dataset)
    sys.exit(0 if success else 1)
