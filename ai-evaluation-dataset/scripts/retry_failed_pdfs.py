# Retry PDF Downloads - Retry downloading PDFs for papers that don't have them

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from pdf_downloader import PDFDownloader
from utils import load_dataset_index

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

def find_papers_without_pdf(dataset_path: str) -> list:
    # Find all papers that don't have PDFs
    dataset_dir = Path(dataset_path)
    papers_without_pdf = []
    
    for paper_dir in dataset_dir.iterdir():
        if not paper_dir.is_dir() or paper_dir.name.startswith('.'):
            continue
        
        metadata_file = paper_dir / "metadata.json"
        pdf_file = paper_dir / "paper.pdf"
        
        if metadata_file.exists() and not pdf_file.exists():
            try:
                metadata = json.loads(metadata_file.read_text())
                if doi := metadata.get('doi'):
                    papers_without_pdf.append({
                        'paper_id': paper_dir.name,
                        'doi': doi,
                        'title': metadata.get('title', 'Unknown'),
                        'metadata_file': metadata_file,
                        'pdf_path': pdf_file
                    })
            except:
                pass
    
    return papers_without_pdf

def retry_pdf_download(paper: dict, downloader: PDFDownloader) -> bool:
    try:
        if downloader.download_pdf(paper['doi'], str(paper['pdf_path'])):
            metadata = json.loads(paper['metadata_file'].read_text())
            metadata['pdf_available'] = True
            metadata['pdf_downloaded_at'] = datetime.now().isoformat()
            paper['metadata_file'].write_text(json.dumps(metadata, indent=2, ensure_ascii=False))
            return True
    except:
        pass
    return False

def main():
    parser = argparse.ArgumentParser(
        description='Retry downloading PDFs for papers that failed',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('--dataset-path', type=str, default='dataset', 
                       help='Path to dataset directory (default: dataset)')
    parser.add_argument('--limit', type=int, help='Limit number of papers to retry')
    parser.add_argument('--rate-limit', type=float, default=1.0,
                       help='Rate limit in seconds between requests (default: 1.0)')
    parser.add_argument('--unpaywall-email', type=str,
                       help='Email for Unpaywall API (or set UNPAYWALL_EMAIL env var)')
    
    args = parser.parse_args()
    
    if HAS_DOTENV:
        load_dotenv()
    
    unpaywall_email = args.unpaywall_email or os.getenv('UNPAYWALL_EMAIL')
    
    print("Retry Failed PDF Downloads")
    print(f"\nDataset path: {args.dataset_path}")
    
    if not Path(args.dataset_path).exists():
        print(f"\nError: Dataset directory not found: {args.dataset_path}")
        return 1
    
    print("\nScanning for papers without PDFs...")
    papers_without_pdf = find_papers_without_pdf(args.dataset_path)
    
    papers_without_doi = []
    for paper_dir in Path(args.dataset_path).iterdir():
        if not paper_dir.is_dir() or paper_dir.name.startswith('.'):
            continue
        metadata_file = paper_dir / "metadata.json"
        pdf_file = paper_dir / "paper.pdf"
        if metadata_file.exists() and not pdf_file.exists():
            try:
                metadata = json.loads(metadata_file.read_text())
                if not metadata.get('doi'):
                    papers_without_doi.append({
                        'paper_id': paper_dir.name,
                        'title': metadata.get('title', 'Unknown')
                    })
            except:
                pass
    
    if not papers_without_pdf and not papers_without_doi:
        print("\nAll papers already have PDFs!")
        return 0
    
    if papers_without_doi:
        print(f"\nNote: {len(papers_without_doi)} papers don't have PDFs because they're missing DOIs:")
        for paper in papers_without_doi[:5]:
            title = paper['title'][:60] + "..." if len(paper['title']) > 60 else paper['title']
            print(f"  - {paper['paper_id']}: {title}")
        if len(papers_without_doi) > 5:
            print(f"  ... and {len(papers_without_doi) - 5} more")
        print("\nThese papers need DOIs added to ORKG or manual PDF download.")
    
    if not papers_without_pdf:
        print("\nAll papers with DOIs already have PDFs!")
        return 0
    
    print(f"Found {len(papers_without_pdf)} papers without PDFs")
    
    if args.limit:
        papers_without_pdf = papers_without_pdf[:args.limit]
        print(f"Limiting to {len(papers_without_pdf)} papers")
    
    print("\nSample of papers to retry:")
    for paper in papers_without_pdf[:5]:
        title = paper['title'][:60] + "..." if len(paper['title']) > 60 else paper['title']
        print(f"  - {paper['paper_id']}: {title}")
    if len(papers_without_pdf) > 5:
        print(f"  ... and {len(papers_without_pdf) - 5} more")
    
    print(f"\nInitializing PDF downloader (rate limit: {args.rate_limit}s)...")
    downloader = PDFDownloader(
        rate_limit=args.rate_limit,
        max_retries=3,
        timeout=30,
        unpaywall_email=unpaywall_email
    )
    
    print("\nRetrying PDF downloads...\n")
    
    stats = {'total': len(papers_without_pdf), 'success': 0, 'failed': 0}
    
    iterator = tqdm(papers_without_pdf, desc="Downloading PDFs", unit="paper") if HAS_TQDM else papers_without_pdf
    
    for paper in iterator:
        if HAS_TQDM:
            title = paper['title'][:40] + "..." if len(paper['title']) > 40 else paper['title']
            iterator.set_description(f"Downloading: {title}")
        
        if retry_pdf_download(paper, downloader):
            stats['success'] += 1
        else:
            stats['failed'] += 1
    
    downloader.close()
    
    # Print results
    print("\n" + "=" * 70)
    print("Retry Complete")
    print("=" * 70)
    print(f"\nTotal papers:        {stats['total']}")
    print(f"Successfully downloaded: {stats['success']}")
    print(f"Failed:              {stats['failed']}")
    print(f"Success rate:        {stats['success']/stats['total']*100:.1f}%")
    
    if stats['failed'] > 0:
        print(f"\n{stats['failed']} papers still don't have PDFs.")
        print("These may be:")
        print("  - Behind paywalls")
        print("  - Not available online")
        print("  - Require institutional access")
        print("\nYou can try again later or manually download them.")
    
    print()
    
    return 0

if __name__ == '__main__':
    import os
    exit(main())
