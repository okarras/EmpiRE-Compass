import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime, timezone

class DatasetOrganizer:
    def __init__(self, base_path: str = "dataset", skip_existing: bool = True):
        self.base_path = Path(base_path)
        self.skip_existing = skip_existing
        self.stats = {'total_papers': 0, 'papers_with_pdf': 0, 'papers_without_pdf': 0, 
                     'papers_skipped': 0, 'errors': 0}
        self.papers: List[Dict[str, Any]] = []
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def create_paper_directory(self, paper_id: str) -> Path:
        resource_id = paper_id.rstrip('/').split('/')[-1] if '/' in paper_id else paper_id
        paper_dir = self.base_path / resource_id
        
        if paper_dir.exists() and self.skip_existing:
            if (paper_dir / "metadata.json").exists():
                self.stats['papers_skipped'] += 1
                return paper_dir
        
        paper_dir.mkdir(parents=True, exist_ok=True)
        return paper_dir
    
    def save_metadata(self, paper_id: str, metadata: Dict[str, Any]) -> None:
        resource_id = paper_id.rstrip("/").split("/")[-1] if "/" in paper_id else paper_id
        paper_dir = self.base_path / resource_id
        paper_dir.mkdir(parents=True, exist_ok=True)
        
        metadata_with_timestamp = {
            **metadata,
            'extraction_date': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        }
        
        (paper_dir / "metadata.json").write_text(json.dumps(metadata_with_timestamp, indent=2, ensure_ascii=False))
        self.stats['total_papers'] += 1
        self._track_paper(paper_id, metadata_with_timestamp)
    
    def save_pdf(self, paper_id: str, pdf_content: bytes) -> None:
        resource_id = paper_id.rstrip("/").split("/")[-1] if "/" in paper_id else paper_id
        paper_dir = self.base_path / resource_id
        paper_dir.mkdir(parents=True, exist_ok=True)
        (paper_dir / "paper.pdf").write_bytes(pdf_content)
        self.stats['papers_with_pdf'] += 1
    
    def _track_paper(self, paper_id: str, metadata: Dict[str, Any]) -> None:
        resource_id = paper_id.rstrip("/").split("/")[-1] if "/" in paper_id else paper_id
        pdf_exists = (self.base_path / resource_id / "paper.pdf").exists()
        
        self.papers.append({
            'paper_id': paper_id,
            'title': metadata.get('title'),
            'year': metadata.get('year'),
            'doi': metadata.get('doi'),
            'venue': metadata.get('venue'),
            'pdf_status': 'downloaded' if pdf_exists else 'not_available',
            'metadata_completeness': self._calc_completeness(metadata)
        })
    
    def _calc_completeness(self, metadata: Dict[str, Any]) -> float:
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
    
    def generate_index(self, output_file: str = "dataset_index.json") -> None:
        self.stats['papers_without_pdf'] = self.stats['total_papers'] - self.stats['papers_with_pdf']
        
        index_data = {
            'generated_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            **self.stats,
            'papers': self.papers
        }
        
        (self.base_path / output_file).write_text(json.dumps(index_data, indent=2, ensure_ascii=False))
    
    def get_statistics(self) -> Dict[str, int]:
        return self.stats.copy()
    
    def paper_exists(self, paper_id: str) -> bool:
        resource_id = paper_id.rstrip("/").split("/")[-1] if "/" in paper_id else paper_id
        return (self.base_path / resource_id / "metadata.json").exists()
    
    def has_pdf(self, paper_id: str) -> bool:
        resource_id = paper_id.rstrip("/").split("/")[-1] if "/" in paper_id else paper_id
        return (self.base_path / resource_id / "paper.pdf").exists()
