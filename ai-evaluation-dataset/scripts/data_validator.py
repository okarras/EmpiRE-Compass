import json
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime, timezone

class DataValidator:
    def validate_metadata(self, metadata: Dict[str, Any]) -> Tuple[bool, List[str]]:
        errors = []
        
        if not isinstance(metadata, dict):
            return False, ["Metadata must be a dictionary"]
        
        for field in ['paper_id', 'contribution_id']:
            if not metadata.get(field):
                errors.append(f"Missing required field: {field}")
        
        return len(errors) == 0, errors
    
    def validate_dataset_directory(self, dataset_path: Path) -> Dict[str, Any]:
        results = {'total_papers': 0, 'valid_papers': 0, 'invalid_papers': 0, 
                  'validation_errors': [], 'missing_files': []}
        
        if not dataset_path.exists():
            return results
        
        for paper_dir in dataset_path.iterdir():
            if not paper_dir.is_dir() or paper_dir.name.startswith('.'):
                continue
            
            metadata_file = paper_dir / "metadata.json"
            if not metadata_file.exists():
                results['missing_files'].append(paper_dir.name)
                results['invalid_papers'] += 1
                continue
            
            try:
                metadata = json.loads(metadata_file.read_text())
                is_valid, errors = self.validate_metadata(metadata)
                results['total_papers'] += 1
                
                if is_valid:
                    results['valid_papers'] += 1
                else:
                    results['invalid_papers'] += 1
                    results['validation_errors'].append({'paper_id': paper_dir.name, 'errors': errors})
            except:
                results['invalid_papers'] += 1
        
        return results
    
    def calculate_metadata_completeness(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        fields = ['title', 'year', 'doi', 'venue', 'contribution_id']
        populated = sum(1 for f in fields if metadata.get(f))
        total = len(fields)
        
        qdata = metadata.get('questionnaire_data', {})
        if qdata.get('data_collection', {}).get('methods'):
            populated += 1
        total += 1
        
        if any(qdata.get('data_analysis', {}).get(k) for k in ['descriptive', 'inferential', 'machine_learning']):
            populated += 1
        total += 1
        
        if any(qdata.get('threats_to_validity', {}).values()):
            populated += 1
        total += 1
        
        if qdata.get('research_questions'):
            populated += 1
        total += 1
        
        return {
            'score': round(populated / total, 3) if total > 0 else 0.0,
            'total_fields': total,
            'populated_fields': populated
        }
    
    def generate_quality_report(self, dataset_path: Path, output_file: Path = None) -> Dict[str, Any]:
        report = {
            'generated_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'dataset_path': str(dataset_path),
            'summary': {},
            'papers_missing_doi': [],
            'papers_without_pdf': [],
            'papers_with_low_completeness': []
        }
        
        if not dataset_path.exists():
            return report
        
        validation = self.validate_dataset_directory(dataset_path)
        completeness_scores = []
        
        for paper_dir in dataset_path.iterdir():
            if not paper_dir.is_dir() or paper_dir.name.startswith('.'):
                continue
            
            metadata_file = paper_dir / "metadata.json"
            if not metadata_file.exists():
                continue
            
            try:
                metadata = json.loads(metadata_file.read_text())
                completeness = self.calculate_metadata_completeness(metadata)
                completeness_scores.append(completeness['score'])
                
                if not metadata.get('doi'):
                    report['papers_missing_doi'].append({
                        'paper_id': paper_dir.name,
                        'title': metadata.get('title', 'Unknown')
                    })
                
                if not (paper_dir / "paper.pdf").exists():
                    report['papers_without_pdf'].append({
                        'paper_id': paper_dir.name,
                        'title': metadata.get('title', 'Unknown'),
                        'doi': metadata.get('doi')
                    })
                
                if completeness['score'] < 0.4:
                    report['papers_with_low_completeness'].append({
                        'paper_id': paper_dir.name,
                        'title': metadata.get('title', 'Unknown'),
                        'completeness': completeness['score']
                    })
            except:
                pass
        
        report['summary'] = {
            'total_papers': validation['total_papers'],
            'valid_papers': validation['valid_papers'],
            'invalid_papers': validation['invalid_papers'],
            'papers_missing_doi': len(report['papers_missing_doi']),
            'papers_without_pdf': len(report['papers_without_pdf']),
            'papers_with_low_completeness': len(report['papers_with_low_completeness']),
            'average_completeness': sum(completeness_scores) / len(completeness_scores) if completeness_scores else 0.0
        }
        
        if output_file:
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(json.dumps(report, indent=2, ensure_ascii=False))
        
        return report
