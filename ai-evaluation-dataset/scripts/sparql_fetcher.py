"""SPARQL Fetcher - Query ORKG for papers with metadata"""
from typing import Dict, List, Optional, Any
from collections import defaultdict

try:
    from SPARQLWrapper import SPARQLWrapper, JSON
except ImportError:
    raise ImportError("SPARQLWrapper required: pip install SPARQLWrapper==2.0.0")

class SPARQLFetcher:
    def __init__(self, endpoint_url: str, timeout: int = 30):
        self.sparql = SPARQLWrapper(endpoint_url)
        self.sparql.setReturnFormat(JSON)
        self.sparql.setTimeout(timeout)
        self.sparql.setMethod('POST')
    
    def execute_query(self, query: str) -> List[Dict[str, Any]]:
        self.sparql.setQuery(query)
        results = self.sparql.query().convert()
        bindings = results.get("results", {}).get("bindings", [])
        return [{k: v.get("value") for k, v in b.items()} for b in bindings]
    
    def fetch_all_papers_with_metadata(self, limit: Optional[int] = None) -> Dict[str, Dict[str, Any]]:
        query = self._build_query(limit)
        results = self.execute_query(query)
        return self.aggregate_results(results)
    
    def _build_query(self, limit: Optional[int] = None) -> str:
        query = """
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?paper ?paperLabel ?doi ?year ?contri ?venue_name
       ?research_paradigm_label
       ?dc_label ?dc_method_name ?dc_method_type_label
       ?data_type_qualitative ?data_type_quantitative ?data_url
       ?da_label ?descriptive ?inferential ?machine_learning ?other_method
       ?desc_freq_count ?desc_freq_percent
       ?desc_central_mean ?desc_central_median ?desc_central_mode ?desc_central_min ?desc_central_max
       ?desc_disp_range ?desc_disp_variance ?desc_disp_stddev
       ?desc_pos_boxplot
       ?stat_test_label
       ?ml_algo_label ?ml_metric_recall ?ml_metric_precision ?ml_metric_accuracy ?ml_metric_fscore
       ?hypothesis_statement ?hypothesis_type_null ?hypothesis_type_alt
       ?external ?internal ?construct ?conclusion ?reliability
       ?generalizability ?repeatability ?content_validity ?descriptive_validity ?theoretical_validity ?mentioned_uncategorized
       ?question ?question_hidden ?question_highlighted ?question_type_label
       ?subquestion ?subquestion_type_label
       ?answer_hidden ?answer_highlighted
WHERE {
    # Basic paper information
    ?paper orkgp:P31 ?contri .
    ?paper orkgp:P29 ?year .
    OPTIONAL { ?paper orkgp:P26 ?doi . }
    OPTIONAL { ?paper rdfs:label ?paperLabel . }
    
    # Contribution and venue
    ?contri a orkgc:C27001 .
    ?contri orkgp:P135046 ?venue .
    ?venue rdfs:label ?venue_name .
    
    # Research Paradigm (P57003)
    OPTIONAL {
        ?contri orkgp:P57003 ?research_paradigm .
        ?research_paradigm rdfs:label ?research_paradigm_label .
    }
    
    # Data Collection
    OPTIONAL {
        ?contri orkgp:P56008 ?data_collection .
        ?data_collection rdfs:label ?dc_label .
        
        # Data Collection Methods
        OPTIONAL {
            ?data_collection orkgp:P1005 ?dc_method .
            ?dc_method orkgp:P145012 ?dc_method_name .
            ?dc_method orkgp:P94003 ?dc_method_type .
            ?dc_method_type rdfs:label ?dc_method_type_label .
        }
        
        # Research Data (nested)
        OPTIONAL {
            ?data_collection orkgp:DATA ?research_data .
            
            # Data Type (P7055 -> qualitative P57038, quantitative P57039)
            OPTIONAL {
                ?research_data orkgp:P7055 ?data_type .
                OPTIONAL { ?data_type orkgp:P57038 ?data_type_qualitative . }
                OPTIONAL { ?data_type orkgp:P57039 ?data_type_quantitative . }
            }
            
            # Data URLs
            OPTIONAL { ?research_data orkgp:url ?data_url . }
        }
    }
    
    # Data Analysis
    OPTIONAL {
        ?contri orkgp:P15124 ?data_analysis .
        ?data_analysis rdfs:label ?da_label .
        
        # Descriptive Statistics (P56048)
        OPTIONAL {
            ?data_analysis orkgp:P56048 ?desc_stats .
            ?desc_stats rdfs:label ?descriptive .
            
            # Measures of Frequency (P56049)
            OPTIONAL {
                ?desc_stats orkgp:P56049 ?desc_freq .
                OPTIONAL { ?desc_freq orkgp:P55023 ?desc_freq_count . }
                OPTIONAL { ?desc_freq orkgp:P56050 ?desc_freq_percent . }
            }
            
            # Measures of Central Tendency (P57005)
            OPTIONAL {
                ?desc_stats orkgp:P57005 ?desc_central .
                OPTIONAL { ?desc_central orkgp:P47000 ?desc_central_mean . }
                OPTIONAL { ?desc_central orkgp:P57006 ?desc_central_median . }
                OPTIONAL { ?desc_central orkgp:P57007 ?desc_central_mode . }
                OPTIONAL { ?desc_central orkgp:P44107 ?desc_central_min . }
                OPTIONAL { ?desc_central orkgp:P44108 ?desc_central_max . }
            }
            
            # Measures of Dispersion (P57008)
            OPTIONAL {
                ?desc_stats orkgp:P57008 ?desc_disp .
                OPTIONAL { ?desc_disp orkgp:P4013 ?desc_disp_range . }
                OPTIONAL { ?desc_disp orkgp:P57009 ?desc_disp_variance . }
                OPTIONAL { ?desc_disp orkgp:P44087 ?desc_disp_stddev . }
            }
            
            # Measures of Position (P57010)
            OPTIONAL {
                ?desc_stats orkgp:P57010 ?desc_pos .
                OPTIONAL { ?desc_pos orkgp:P59065 ?desc_pos_boxplot . }
            }
        }
        
        # Inferential Statistics (P56043)
        OPTIONAL {
            ?data_analysis orkgp:P56043 ?inf_stats .
            ?inf_stats rdfs:label ?inferential .
            
            # Statistical Tests (P35133)
            OPTIONAL {
                ?inf_stats orkgp:P35133 ?stat_test .
                ?stat_test rdfs:label ?stat_test_label .
            }
            
            # Hypotheses (P30001)
            OPTIONAL {
                ?inf_stats orkgp:P30001 ?hypothesis .
                OPTIONAL { ?hypothesis orkgp:P56046 ?hypothesis_statement . }
                OPTIONAL {
                    ?hypothesis orkgp:P41703 ?hypothesis_type .
                    OPTIONAL { ?hypothesis_type orkgp:P35106 ?hypothesis_type_null . }
                    OPTIONAL { ?hypothesis_type orkgp:P35107 ?hypothesis_type_alt . }
                }
            }
        }
        
        # Machine Learning (P57016)
        OPTIONAL {
            ?data_analysis orkgp:P57016 ?ml .
            ?ml rdfs:label ?machine_learning .
            
            # ML Algorithms (P2001)
            OPTIONAL {
                ?ml orkgp:P2001 ?ml_algo .
                ?ml_algo rdfs:label ?ml_algo_label .
            }
            
            # ML Metrics (P2006)
            OPTIONAL {
                ?ml orkgp:P2006 ?ml_metrics .
                OPTIONAL { ?ml_metrics orkgp:P5073 ?ml_metric_recall . }
                OPTIONAL { ?ml_metrics orkgp:P3004 ?ml_metric_precision . }
                OPTIONAL { ?ml_metrics orkgp:P18048 ?ml_metric_accuracy . }
                OPTIONAL { ?ml_metrics orkgp:P59137 ?ml_metric_fscore . }
            }
        }
        
        # Other Methods (P1005) - at data_analysis level
        OPTIONAL { 
            ?data_analysis orkgp:P1005 ?other_method_node .
            ?other_method_node rdfs:label ?other_method .
        }
    }
    
    # Threats to Validity (P39099)
    OPTIONAL {
        ?contri orkgp:P39099 ?threats .
        OPTIONAL { ?threats orkgp:P55034 ?external . }
        OPTIONAL { ?threats orkgp:P55035 ?internal . }
        OPTIONAL { ?threats orkgp:P55037 ?construct . }
        OPTIONAL { ?threats orkgp:P55036 ?conclusion . }
        OPTIONAL { ?threats orkgp:P59109 ?reliability . }
        OPTIONAL { ?threats orkgp:P60006 ?generalizability . }
        OPTIONAL { ?threats orkgp:P97002 ?repeatability . }
        OPTIONAL { ?threats orkgp:P68005 ?content_validity . }
        OPTIONAL { ?threats orkgp:P97000 ?descriptive_validity . }
        OPTIONAL { ?threats orkgp:P97001 ?theoretical_validity . }
        OPTIONAL { ?threats orkgp:P145000 ?mentioned_uncategorized . }
    }
    
    # Research Questions (P37330)
    OPTIONAL {
        ?contri orkgp:P37330 ?rq .
        OPTIONAL { ?rq orkgp:P44139 ?question . }
        OPTIONAL { ?rq orkgp:P55038 ?question_hidden . }
        OPTIONAL { ?rq orkgp:P55039 ?question_highlighted . }
        OPTIONAL {
            ?rq orkgp:P41928 ?question_type .
            ?question_type rdfs:label ?question_type_label .
        }
        
        # Subquestions (P57000)
        OPTIONAL {
            ?rq orkgp:P57000 ?subq .
            OPTIONAL { ?subq orkgp:P44139 ?subquestion . }
            OPTIONAL {
                ?subq orkgp:P41928 ?subquestion_type .
                ?subquestion_type rdfs:label ?subquestion_type_label .
            }
        }
    }
    
    # Research Question Answer (P57004)
    OPTIONAL {
        ?contri orkgp:P57004 ?answer .
        OPTIONAL { ?answer orkgp:P55038 ?answer_hidden . }
        OPTIONAL { ?answer orkgp:P55039 ?answer_highlighted . }
    }
    
    # Venue filter
    FILTER ((?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string || ?venue_name = "International Working Conference on Requirements Engineering: Foundation for Software Quality"^^xsd:string))

}
ORDER BY ?year ?paper
"""
        if limit:
            query += f"\nLIMIT {limit}"
        return query
    
    def aggregate_results(self, raw_results: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        papers_data = defaultdict(list)
        for row in raw_results:
            if paper_id := row.get('paper'):
                papers_data[paper_id].append(row)
        
        return {pid: self._aggregate_paper(rows) for pid, rows in papers_data.items()}
    
    def _aggregate_paper(self, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not rows:
            return {}
        
        first = rows[0]
        
        # Initialize collections for aggregating multi-valued fields
        dc_methods = []
        data_urls = []
        descriptive_labels = []
        inferential_labels = []
        ml_labels = []
        other_methods = []
        stat_tests = []
        ml_algorithms = []
        hypotheses = []
        questions = []
        
        # Descriptive measures tracking
        desc_measures = {
            'frequency': set(),
            'central_tendency': set(),
            'dispersion': set(),
            'position': set()
        }
        
        # ML metrics tracking
        ml_metrics = set()
        
        for row in rows:
            # Data collection methods
            if row.get('dc_method_name'):
                dc_methods.append({
                    'name': row['dc_method_name'],
                    'type': row.get('dc_method_type_label')
                })
            
            # Data URLs
            if row.get('data_url'):
                data_urls.append(row['data_url'])
            
            # Data analysis labels
            if row.get('descriptive'):
                descriptive_labels.append(row['descriptive'])
            if row.get('inferential'):
                inferential_labels.append(row['inferential'])
            if row.get('machine_learning'):
                ml_labels.append(row['machine_learning'])
            if row.get('other_method'):
                other_methods.append(row['other_method'])
            
            # Descriptive statistics measures
            if row.get('desc_freq_count') == '1':
                desc_measures['frequency'].add('count')
            if row.get('desc_freq_percent') == '1':
                desc_measures['frequency'].add('percent')
            if row.get('desc_central_mean') == '1':
                desc_measures['central_tendency'].add('mean')
            if row.get('desc_central_median') == '1':
                desc_measures['central_tendency'].add('median')
            if row.get('desc_central_mode') == '1':
                desc_measures['central_tendency'].add('mode')
            if row.get('desc_central_min') == '1':
                desc_measures['central_tendency'].add('minimum')
            if row.get('desc_central_max') == '1':
                desc_measures['central_tendency'].add('maximum')
            if row.get('desc_disp_range') == '1':
                desc_measures['dispersion'].add('range')
            if row.get('desc_disp_variance') == '1':
                desc_measures['dispersion'].add('variance')
            if row.get('desc_disp_stddev') == '1':
                desc_measures['dispersion'].add('standard deviation')
            if row.get('desc_pos_boxplot') == '1':
                desc_measures['position'].add('boxplot')
            
            # Statistical tests
            if row.get('stat_test_label'):
                stat_tests.append(row['stat_test_label'])
            
            # ML algorithms
            if row.get('ml_algo_label'):
                ml_algorithms.append(row['ml_algo_label'])
            
            # ML metrics
            if row.get('ml_metric_recall') == '1':
                ml_metrics.add('recall')
            if row.get('ml_metric_precision') == '1':
                ml_metrics.add('precision')
            if row.get('ml_metric_accuracy') == '1':
                ml_metrics.add('accuracy')
            if row.get('ml_metric_fscore') == '1':
                ml_metrics.add('f-score')
            
            # Hypotheses
            if row.get('hypothesis_statement'):
                hyp_type = 'Null hypothesis' if row.get('hypothesis_type_null') == '1' else \
                           'Alternative hypothesis' if row.get('hypothesis_type_alt') == '1' else \
                           'Hypothesis'
                hypotheses.append({
                    'statement': row['hypothesis_statement'],
                    'type': hyp_type
                })
            
            # Research questions with subquestions
            if row.get('question'):
                # Find or create question entry
                q_entry = next((q for q in questions if q['question'] == row['question']), None)
                if not q_entry:
                    q_entry = {
                        'question': row['question'],
                        'hidden': row.get('question_hidden') == '1',
                        'highlighted_question': row.get('question_highlighted') == '1',
                        'type': row.get('question_type_label', 'exploratory'),
                        'subquestions': []
                    }
                    questions.append(q_entry)
                
                # Add subquestion if present
                if row.get('subquestion'):
                    subq = {
                        'question': row['subquestion'],
                        'type': row.get('subquestion_type_label', 'exploratory')
                    }
                    if subq not in q_entry['subquestions']:
                        q_entry['subquestions'].append(subq)
        
        # Determine data type (qualitative/quantitative)
        data_type = []
        if first.get('data_type_qualitative') == '1':
            data_type.append('qualitative')
        if first.get('data_type_quantitative') == '1':
            data_type.append('quantitative')
        
        return {
            'paper_id': first.get('paper'),
            'title': first.get('paperLabel'),
            'year': first.get('year'),
            'doi': first.get('doi'),
            'venue': first.get('venue_name'),
            'contribution_id': first.get('contri'),
            'questionnaire_data': {
                'research_paradigm': first.get('research_paradigm_label', ''),
                'data_collection': {
                    'label': first.get('dc_label'),
                    'methods': list({str(d): d for d in dc_methods}.values()),
                    'data_type': data_type,
                    'data_urls': list(set(data_urls))
                },
                'data_analysis': {
                    'label': first.get('da_label'),
                    'descriptive': list(set(descriptive_labels)),
                    'inferential': list(set(inferential_labels)),
                    'machine_learning': list(set(ml_labels)),
                    'other_methods': list(set(other_methods)),
                    'descriptive_measures': {
                        'frequency': list(desc_measures['frequency']),
                        'central_tendency': list(desc_measures['central_tendency']),
                        'dispersion': list(desc_measures['dispersion']),
                        'position': list(desc_measures['position'])
                    },
                    'statistical_tests': list(set(stat_tests)),
                    'ml_algorithms': list(set(ml_algorithms)),
                    'ml_metrics': list(ml_metrics),
                    'hypotheses': list({str(h): h for h in hypotheses}.values())
                },
                'threats_to_validity': {
                    'external': first.get('external'),
                    'internal': first.get('internal'),
                    'construct': first.get('construct'),
                    'conclusion': first.get('conclusion'),
                    'reliability': first.get('reliability'),
                    'generalizability': first.get('generalizability'),
                    'repeatability': first.get('repeatability'),
                    'content_validity': first.get('content_validity'),
                    'descriptive_validity': first.get('descriptive_validity'),
                    'theoretical_validity': first.get('theoretical_validity'),
                    'mentioned_uncategorized': first.get('mentioned_uncategorized')
                },
                'research_questions': questions,
                'answer_highlighted': first.get('answer_highlighted') == '1',
                'answer_hidden': first.get('answer_hidden') == '1'
            }
        }
