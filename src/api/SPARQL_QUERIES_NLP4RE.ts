export const ENDPOINT_URL = import.meta.env.VITE_ENDPOINT_URL + '/triplestore';

export const PREFIXES = `
    PREFIX orkgr: <http://orkg.org/orkg/resource/>
    PREFIX orkgc: <http://orkg.org/orkg/class/>
    PREFIX orkgp: <http://orkg.org/orkg/predicate/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
`;

export const SPARQL_QUERIES = {
  query_1: `
     SELECT DISTINCT ?paper ?paperLabel ?evaluation_metricLabel 
        WHERE {
        ?paper orkgp:P31 ?contribution .
        ?contribution rdf:type orkgc:C121001;
                orkgp:HAS_EVALUATION ?evaluation .
        ?evaluation orkgp:P110006 ?evaluation_metric .

        
        OPTIONAL {?paper rdfs:label ?paperLabel .}
        OPTIONAL {?evaluation_metric rdfs:label ?evaluation_metricLabel .}
        } ORDER BY ?paperLabel

`,

  query_2: `
    SELECT DISTINCT ?paper ?paperLabel ?guidelineAvailabilityLabel
        WHERE {
        ?paper orkgp:P31 ?contribution .
        ?contribution rdf:type orkgc:C121001;
                orkgp:P181031 ?annotationProcess .
        ?annotationProcess orkgp:P181036 ?annotationScheme .
        ?annotationScheme orkgp:P181038 ?guidelineAvailability .

        
        OPTIONAL {?paper rdfs:label ?paperLabel .}
        OPTIONAL {?guidelineAvailability rdfs:label ?guidelineAvailabilityLabel .}
        }ORDER BY ?paperLabel

`,

  query_3: `
        SELECT ?paper, ?year, ?dc_label, ?da_label
                WHERE {
                        ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                        ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                        ?serie rdfs:label ?venue_name.
                        
                        OPTIONAL{?contribution orkgp:P56008 ?data_collection.
                                ?data_collection rdfs:label ?dc_label.
                        }
                        OPTIONAL{?contribution orkgp:P15124 ?data_analysis.
                                ?data_analysis rdfs:label ?da_label.
                        }
                        
                        #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                        FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)    
                }
`,
};
