"""Utility functions for dataset analysis"""
import json
import csv
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

def load_dataset_index(dataset_path: str = "dataset") -> Dict:
    return json.loads((Path(dataset_path) / "dataset_index.json").read_text())

def load_paper_metadata(paper_id: str, dataset_path: str = "dataset") -> Dict:
    return json.loads((Path(dataset_path) / paper_id / "metadata.json").read_text())

def get_paper_pdf_path(paper_id: str, dataset_path: str = "dataset") -> Optional[Path]:
    pdf = Path(dataset_path) / paper_id / "paper.pdf"
    return pdf if pdf.exists() else None

def validate_dataset_structure(dataset_path: str = "dataset") -> Tuple[bool, List[str]]:
    errors = []
    ds = Path(dataset_path)
    
    if not ds.exists():
        return False, [f"Dataset not found: {dataset_path}"]
    
    try:
        index = load_dataset_index(dataset_path)
        papers = index.get('papers', [])
        
        for paper_info in papers:
            paper_id = paper_info.get('paper_id', '').split('/')[-1]
            paper_dir = ds / paper_id
            
            if not paper_dir.exists():
                errors.append(f"Missing directory: {paper_id}")
                continue
            
            metadata_file = paper_dir / "metadata.json"
            if not metadata_file.exists():
                errors.append(f"Missing metadata: {paper_id}")
        
        return len(errors) == 0, errors
    except Exception as e:
        return False, [f"Error validating dataset: {e}"]

def export_to_csv(dataset_path: str, output_file: str):
    index = load_dataset_index(dataset_path)
    papers = index.get('papers', [])
    
    if not papers:
        return
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['paper_id', 'title', 'doi', 'pdf_available'])
        writer.writeheader()
        
        for paper_info in papers:
            paper_id = paper_info.get('paper_id', '').split('/')[-1]
            try:
                metadata = load_paper_metadata(paper_id, dataset_path)
                writer.writerow({
                    'paper_id': paper_id,
                    'title': metadata.get('title', ''),
                    'doi': metadata.get('doi', ''),
                    'pdf_available': get_paper_pdf_path(paper_id, dataset_path) is not None
                })
            except:
                pass
