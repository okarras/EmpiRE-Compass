#!/usr/bin/env python3
import sys
import json
import os

os.environ['TOKENIZERS_PARALLELISM'] = 'false'

def calculate_bertscore(predictions, references, lang='en', model_type='microsoft/deberta-xlarge-mnli'):

    try:
        from bert_score import score
        
        P, R, F1 = score(
            predictions, 
            references, 
            lang=lang,
            model_type=model_type,
            verbose=False
        )
        
        results = []
        for i in range(len(predictions)):
            results.append({
                'precision': float(P[i]),
                'recall': float(R[i]),
                'f1': float(F1[i])
            })
        
        return results
    except ImportError as e:
        return {'error': f'Import error: {str(e)}. Please install: pip install bert-score torch transformers'}
    except Exception as e:
        return {'error': f'Calculation error: {str(e)}'}

if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())
        
        predictions = input_data.get('predictions', [])
        references = input_data.get('references', [])
        lang = input_data.get('lang', 'en')
        model_type = input_data.get('model_type', 'microsoft/deberta-xlarge-mnli')
        
        results = calculate_bertscore(predictions, references, lang, model_type)
        
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({'error': f'Script error: {str(e)}'}))
        sys.exit(1)
