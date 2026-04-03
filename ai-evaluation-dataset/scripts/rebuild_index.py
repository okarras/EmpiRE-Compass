#!/usr/bin/env python3
"""
Rebuild dataset index from existing metadata files
"""
import json
from pathlib import Path
from datetime import datetime, timezone

def rebuild_index(dataset_path: str = 'dataset'):    
    dataset_dir = Path(dataset_path)
    if not dataset_dir.exists():
        print(f"Dataset directory not found: {dataset_path}")
        return False
    
    papers = []
    stats = {
        'total_papers': 0,
        'papers_with_pdf': 0,
        'papers_without_pdf': 0,
        'papers_skipped': 0,
        'errors': 0
    }
    
    # Find all paper directories
    paper_dirs = [d for d in dataset_dir.iterdir() 
                  if d.is_dir() and not d.name.startswith('.')]
    
    print(f"Found {len(paper_dirs)} paper directories")
    
    for paper_dir in paper_dirs:
        try:
            metadata_file = paper_dir / 'metadata.json'
            if not metadata_file.exists():
                stats['papers_skipped'] += 1
                continue
            
            metadata = json.loads(metadata_file.read_text())
            pdf_exists = (paper_dir / 'paper.pdf').exists()
            
            # Calculate completeness
            completeness = calculate_completeness(metadata)
            
            papers.append({
                'paper_id': metadata.get('paper_id'),
                'title': metadata.get('title'),
                'year': metadata.get('year'),
                'doi': metadata.get('doi'),
                'venue': metadata.get('venue'),
                'pdf_status': 'downloaded' if pdf_exists else 'not_available',
                'metadata_completeness': completeness
            })
            
            stats['total_papers'] += 1
            if pdf_exists:
                stats['papers_with_pdf'] += 1
            else:
                stats['papers_without_pdf'] += 1
                
        except Exception as e:
            print(f"Error processing {paper_dir.name}: {e}")
            stats['errors'] += 1
    
    # Create index
    index_data = {
        'generated_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        **stats,
        'papers': papers
    }
    
    # Write index
    index_file = dataset_dir / 'dataset_index.json'
    index_file.write_text(json.dumps(index_data, indent=2, ensure_ascii=False))
    
    print(f"\nIndex rebuilt successfully")
    print(f"Total papers: {stats['total_papers']}")
    print(f"Papers with PDF: {stats['papers_with_pdf']}")
    print(f"Papers without PDF: {stats['papers_without_pdf']}")
    print(f"Errors: {stats['errors']}")
    
    return True

def calculate_completeness(metadata: dict) -> float:
    """Calculate metadata completeness score"""
    fields = ['title', 'year', 'doi', 'venue', 'contribution_id']
    populated = sum(1 for f in fields if metadata.get(f))
    
    qdata = metadata.get('questionnaire_data', {})
    
    # Research paradigm
    if qdata.get('research_paradigm'):
        populated += 1
    
    # Data collection
    dc = qdata.get('data_collection', {})
    if dc.get('methods'):
        populated += 1
    if dc.get('data_type'):
        populated += 1
    if dc.get('data_urls'):
        populated += 1
    
    # Data analysis
    da = qdata.get('data_analysis', {})
    if any(da.get(k) for k in ['descriptive', 'inferential', 'machine_learning', 'other_methods']):
        populated += 1
    if da.get('descriptive_measures', {}).get('frequency') or \
       da.get('descriptive_measures', {}).get('central_tendency') or \
       da.get('descriptive_measures', {}).get('dispersion') or \
       da.get('descriptive_measures', {}).get('position'):
        populated += 1
    if da.get('statistical_tests'):
        populated += 1
    if da.get('ml_algorithms'):
        populated += 1
    if da.get('ml_metrics'):
        populated += 1
    if da.get('hypotheses'):
        populated += 1
    
    # Threats to validity
    if any(qdata.get('threats_to_validity', {}).values()):
        populated += 1
    
    # Research questions
    if qdata.get('research_questions'):
        populated += 1
    
    # Total possible fields: 5 (basic) + 15 (questionnaire) = 20
    return round(populated / 20, 3)

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Rebuild dataset index')
    parser.add_argument('--dataset', type=str, default='dataset',
                        help='Path to dataset directory')
    args = parser.parse_args()
    
    rebuild_index(args.dataset)
