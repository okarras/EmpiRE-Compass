export const ENDPOINT_URL = 'https://www.orkg.org/triplestore';

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
    SELECT DISTINCT ?paper ?year ?dc_label ?da_label
        WHERE {
        ?paper orkgp:P31 ?contribution;
                orkgp:P29 ?year.
        ?contribution a orkgc:C27001;
                        orkgp:P135046 ?serie;
                        orkgp:P56008 ?data_collection;
                        orkgp:P15124 ?data_analysis.

        ?data_collection rdfs:label ?dc_label.
        ?data_analysis rdfs:label ?da_label.
        ?serie rdfs:label ?venue_name.

        FILTER(?dc_label != "no collection"^^xsd:string)
        FILTER(?da_label != "no analysis"^^xsd:string)
        FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
        }
`,

  query_2_1: `
    SELECT ?paper, ?year, ?dc_method_type_label
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P56008 ?data_collection.
                            ?data_collection orkgp:P1005 ?dc_method;
                                            rdfs:label ?dc_label.
                            ?dc_method orkgp:P94003 ?dc_method_type.
                            ?dc_method_type rdfs:label ?dc_method_type_label.
                    }

                    FILTER(?dc_label != "no collection"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_2_2: `
    SELECT DISTINCT ?paper ?year ?da_label 
                (SAMPLE(?descriptive) AS ?descriptive)
                (SAMPLE(?inferential) AS ?inferential)
                (SAMPLE(?machine_learning) AS ?machine_learning)
                (SAMPLE(?method) AS ?method)
        WHERE {
        ?paper orkgp:P31 ?contribution;
                orkgp:P29 ?year.
                
        ?contribution a orkgc:C27001;
                        orkgp:P135046 ?serie;
                        orkgp:P15124 ?data_analysis.
                        
        ?data_analysis rdfs:label ?da_label.
        
        OPTIONAL { ?data_analysis orkgp:P56048/rdfs:label ?descriptive. }
        OPTIONAL { ?data_analysis orkgp:P56043/rdfs:label ?inferential. }
        OPTIONAL { ?data_analysis orkgp:P57016/rdfs:label ?machine_learning. }
        OPTIONAL { ?data_analysis orkgp:P1005/rdfs:label ?method. }

        ?serie rdfs:label ?venue_name.

        FILTER(?da_label != "no analysis"^^xsd:string)
        FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
        }
        GROUP BY ?paper ?year ?da_label
`,

  query_3: `
    SELECT DISTINCT ?paper ?year ?dc_label ?da_label
        WHERE {
        ?paper orkgp:P31 ?contribution;
                orkgp:P29 ?year.
        ?contribution a orkgc:C27001;
                        orkgp:P135046 ?serie.
        ?serie rdfs:label ?venue_name.

        OPTIONAL {
                ?contribution orkgp:P56008 ?data_collection.
                ?data_collection rdfs:label ?dc_label.
        }
        OPTIONAL {
                ?contribution orkgp:P15124 ?data_analysis.
                ?data_analysis rdfs:label ?da_label.
        }

        FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
        FILTER(
                ?dc_label = "no collection"^^xsd:string || 
                ?da_label = "no analysis"^^xsd:string
        )
        }
`,

  query_4_1: `
    SELECT ?paper, ?dc_method_type_label
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P56008 ?data_collection.
                            ?data_collection orkgp:P1005 ?dc_method;
                                            rdfs:label ?dc_label.
                            ?dc_method orkgp:P94003 ?dc_method_type.
                            ?dc_method_type rdfs:label ?dc_method_type_label.
                    }

                    FILTER(?dc_label != "no collection"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_4_2: `
        SELECT ?paper ?year ?da_label 
        (SAMPLE(?descriptive) AS ?descriptive)
        (SAMPLE(?inferential) AS ?inferential)
        (SAMPLE(?machine_learning) AS ?machine_learning)
        (SAMPLE(?method) AS ?method)
        WHERE {
        ?paper orkgp:P31 ?contribution;
                orkgp:P29 ?year.
        
        ?contribution a orkgc:C27001;
                        orkgp:P135046 ?serie.

        ?serie rdfs:label ?venue_name.

        OPTIONAL {
                ?contribution orkgp:P15124 ?data_analysis.
                ?data_analysis rdfs:label ?da_label.

                OPTIONAL { ?data_analysis orkgp:P56048/rdfs:label ?descriptive. }
                OPTIONAL { ?data_analysis orkgp:P56043/rdfs:label ?inferential. }
                OPTIONAL { ?data_analysis orkgp:P57016/rdfs:label ?machine_learning. }
                OPTIONAL { ?data_analysis orkgp:P1005/rdfs:label ?method. }
        }

        FILTER(?da_label != "no analysis"^^xsd:string)
        FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
        }
        GROUP BY ?paper ?year ?da_label
`,

  query_5: `
    SELECT ?paper, ?year, ?dc_method_type_label
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P56008 ?data_collection.
                            ?data_collection orkgp:P1005 ?dc_method;
                                            rdfs:label ?dc_label.
                            ?dc_method orkgp:P94003 ?dc_method_type.
                            ?dc_method_type rdfs:label ?dc_method_type_label.
                    }
                    
                    FILTER(?dc_label != "no collection"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_6_1: `
    SELECT ?paper, ?da_label, ?count, ?percent, ?mean, ?median, ?mode, ?minimum, ?maximum, 
                ?range, ?variance, ?standard_deviation, ?boxplot
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                            orkgp:P29 ?year.
                            ?contribution a orkgc:C27001;
                                    orkgp:P135046 ?serie.
                            ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P15124 ?data_analysis.
                            ?data_analysis rdfs:label ?da_label.
                            
                            OPTIONAl{?data_analysis orkgp:P56048 ?descriptive_stats.
                                    OPTIONAL{?descriptive_stats orkgp:P56049 ?frequency.
                                            OPTIONAL{?frequency orkgp:P55023 ?count.}
                                            OPTIONAL{?frequency orkgp:P56050 ?percent.}}
                                    OPTIONAL{?descriptive_stats orkgp:P57005 ?central_tendency.
                                            OPTIONAL{?central_tendency orkgp:P47000 ?mean.}
                                            OPTIONAL{?central_tendency orkgp:P57006 ?median.}
                                            OPTIONAL{?central_tendency orkgp:P57007 ?mode.}
                                            OPTIONAL{?central_tendency orkgp:P44107 ?minimum.}
                                            OPTIONAL{?central_tendency orkgp:P44108 ?maximum.}}
                                    OPTIONAL{?descriptive_stats orkgp:P57008 ?variation.
                                            OPTIONAL{?variation orkgp:P4013 ?range.}
                                            OPTIONAL{?variation orkgp:P57009 ?variance.}
                                            OPTIONAL{?variation orkgp:P44087 ?standard_deviation.}}
                                    OPTIONAL{?descriptive_stats orkgp:P57010 ?position.
                                            OPTIONAL{?position orkgp:P59065 ?boxplot.}}
                            }
                    }
                    
                    FILTER(?da_label = 'analysis'^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_6_2: `
    SELECT ?paper, ?da_label, ?test
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P15124 ?data_analysis.
                            ?data_analysis rdfs:label ?da_label.
                            
                            OPTIONAl{?data_analysis orkgp:P56043 ?inferential_stats.
                                    OPTIONAL{?inferential_stats orkgp:P35133 ?stats_test.
                                            ?stats_test rdfs:label ?test}
                            }
                    }
                    
                    FILTER(?da_label = 'analysis'^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_7_1: `
    SELECT ?paper, ?year, ?da_label, ?count, ?percent, ?mean, ?median, ?mode, ?minimum, ?maximum, 
                ?range, ?variance, ?standard_deviation, ?boxplot
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                    orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                            orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P15124 ?data_analysis.
                            ?data_analysis rdfs:label ?da_label.
                            
                            OPTIONAl{?data_analysis orkgp:P56048 ?descriptive_stats.
                                    OPTIONAL{?descriptive_stats orkgp:P56049 ?frequency.
                                            OPTIONAL{?frequency orkgp:P55023 ?count.}
                                            OPTIONAL{?frequency orkgp:P56050 ?percent.}}
                                    OPTIONAL{?descriptive_stats orkgp:P57005 ?central_tendency.
                                            OPTIONAL{?central_tendency orkgp:P47000 ?mean.}
                                            OPTIONAL{?central_tendency orkgp:P57006 ?median.}
                                            OPTIONAL{?central_tendency orkgp:P57007 ?mode.}
                                            OPTIONAL{?central_tendency orkgp:P44107 ?minimum.}
                                            OPTIONAL{?central_tendency orkgp:P44108 ?maximum.}}
                                    OPTIONAL{?descriptive_stats orkgp:P57008 ?variation.
                                            OPTIONAL{?variation orkgp:P4013 ?range.}
                                            OPTIONAL{?variation orkgp:P57009 ?variance.}
                                            OPTIONAL{?variation orkgp:P44087 ?standard_deviation.}}
                                    OPTIONAL{?descriptive_stats orkgp:P57010 ?position.
                                            OPTIONAL{?position orkgp:P59065 ?boxplot.}}
                            }
                    }

                    FILTER(?da_label = 'analysis'^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_7_2: `
    SELECT ?paper, ?year, ?da_label, ?test
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P15124 ?data_analysis.
                            ?data_analysis rdfs:label ?da_label.
                            
                            OPTIONAl{?data_analysis orkgp:P56043 ?inferential_stats.
                                    OPTIONAL{?inferential_stats orkgp:P35133 ?stats_test.
                                            ?stats_test rdfs:label ?test}
                            }
                    }
                    
                    FILTER(?da_label = 'analysis'^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_8: `
        SELECT ?paper ?year 
        (SAMPLE(?external) AS ?external)
        (SAMPLE(?internal) AS ?internal)
        (SAMPLE(?construct) AS ?construct)
        (SAMPLE(?conclusion) AS ?conclusion)
        (SAMPLE(?reliability) AS ?reliability)
        (SAMPLE(?generalizability) AS ?generalizability)
        (SAMPLE(?content) AS ?content)
        (SAMPLE(?descriptive) AS ?descriptive)
        (SAMPLE(?theoretical) AS ?theoretical)
        (SAMPLE(?repeatability) AS ?repeatability)
        (SAMPLE(?mentioned) AS ?mentioned)
        WHERE {
        ?paper orkgp:P31 ?contribution;
                orkgp:P29 ?year.
        ?contribution a orkgc:C27001;
                        orkgp:P135046 ?serie.
        ?serie rdfs:label ?venue_name.

        OPTIONAL {
        ?contribution orkgp:P39099 ?threats.
        OPTIONAL { ?threats orkgp:P55034 ?external. }
        OPTIONAL { ?threats orkgp:P55035 ?internal. }
        OPTIONAL { ?threats orkgp:P55037 ?construct. }
        OPTIONAL { ?threats orkgp:P55036 ?conclusion. }
        OPTIONAL { ?threats orkgp:P59109 ?reliability. }
        OPTIONAL { ?threats orkgp:P60006 ?generalizability. }
        OPTIONAL { ?threats orkgp:P68005 ?content. }
        OPTIONAL { ?threats orkgp:P97000 ?descriptive. }
        OPTIONAL { ?threats orkgp:P97001 ?theoretical. }
        OPTIONAL { ?threats orkgp:P97002 ?repeatability. }
        OPTIONAL { ?threats orkgp:P145000 ?mentioned. }
        }
        FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
        }
        GROUP BY ?paper ?year
`,

  query_9: `
    SELECT ?paper, ?year, ?External, ?Internal, ?Construct, ?Conclusion, ?Reliability, ?Generalizability, ?Content, ?Descriptive, ?Theoretical, ?Repeatability, ?Mentioned
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                            orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                    orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P39099 ?threats.
                            OPTIONAL{?threats orkgp:P55034 ?External.}
                            OPTIONAL{?threats orkgp:P55035 ?Internal.}
                            OPTIONAL{?threats orkgp:P55037 ?Construct.}
                            OPTIONAL{?threats orkgp:P55036 ?Conclusion.}
                            OPTIONAL{?threats orkgp:P59109 ?Reliability.}
                            OPTIONAL{?threats orkgp:P60006 ?Generalizability.}
                            OPTIONAL{?threats orkgp:P68005 ?Content.}
                            OPTIONAL{?threats orkgp:P97000 ?Descriptive.}
                            OPTIONAL{?threats orkgp:P97001 ?Theoretical.}
                            OPTIONAL{?threats orkgp:P97002 ?Repeatability.}
                            OPTIONAL{?threats orkgp:P145000 ?Mentioned}
                    }
                    
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_10: `
    SELECT ?paper, ?year, ?dc_method_type_label
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P56008 ?data_collection.
                            ?data_collection orkgp:P1005 ?dc_method;
                                            rdfs:label ?dc_label.
                            ?dc_method orkgp:P94003 ?dc_method_type.
                            ?dc_method_type rdfs:label ?dc_method_type_label.
                    }
                    
                    FILTER(?dc_label != "no collection"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_11: `
    SELECT ?paper, ?year, ?data, ?url
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P56008 ?data_collection.
                            ?data_collection rdfs:label ?dc_label.
                            OPTIONAL{?data_collection orkgp:DATA ?data.
                                    OPTIONAL{?data orkgp:url ?url.}
                                    }
                    }
                    
                    FILTER(?dc_label != "no collection"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_12: `
    SELECT ?paper, ?year, ?question, ?highlighted_q, ?highlighted_a
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    OPTIONAL{?contribution orkgp:P37330 ?rq.
                            OPTIONAL{?rq orkgp:P44139 ?question.}
                            OPTIONAL{?rq orkgp:P55039 ?highlighted_q.}
                    }
                    OPTIONAL{?contribution orkgp:P57004 ?answer.
                            OPTIONAL{?answer orkgp:P55039 ?highlighted_a.}
                    }
                    
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            }
`,

  query_13: `
    SELECT ?paper, ?dc_method_type_label, ?dc_method_name
        WHERE {
                ?paper orkgp:P31 ?contribution;
                       orkgp:P29 ?year.
                ?contribution a orkgc:C27001;
                              orkgp:P135046 ?serie.
                ?serie rdfs:label ?venue_name.

                ?contribution orkgp:P56008 ?data_collection.
                ?data_collection orkgp:P1005 ?dc_method;
                                 rdfs:label ?dc_label.
                ?dc_method orkgp:P94003 ?dc_method_type;
                           orkgp:P145012 ?dc_method_name.
                ?dc_method_type rdfs:label ?dc_method_type_label.
                           
                FILTER(?dc_method_type_label = "secondary research"^^xsd:string)
                #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
        }
`,

  query_14: `
    SELECT ?paper, ?year, ?dc_method_type_label, ?dc_method_name
        WHERE {
                ?paper orkgp:P31 ?contribution;
                       orkgp:P29 ?year.
                ?contribution a orkgc:C27001;
                              orkgp:P135046 ?serie.
                ?serie rdfs:label ?venue_name.

                ?contribution orkgp:P56008 ?data_collection.
                ?data_collection orkgp:P1005 ?dc_method;
                                 rdfs:label ?dc_label.
                ?dc_method orkgp:P94003 ?dc_method_type;
                           orkgp:P145012 ?dc_method_name.
                ?dc_method_type rdfs:label ?dc_method_type_label.
                           
                FILTER(?dc_method_type_label = "secondary research"^^xsd:string)
                #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
        }
`,

  query_15_1: `
    SELECT ?paper, (COUNT(?dc_method_type_label) AS ?number_of_dc_methods), ?year
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    ?contribution orkgp:P56008 ?data_collection.
                    ?data_collection orkgp:P1005 ?dc_method;
                                    rdfs:label ?dc_label.
                    ?dc_method orkgp:P94003 ?dc_method_type.
                    ?dc_method_type rdfs:label ?dc_method_type_label.
                    
                    FILTER(?dc_label != "no collection"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            } GROUP BY ?paper ?year
`,

  query_15_2: `
    SELECT ?paper, (COUNT(DISTINCT ?inferential) AS ?number_of_inf_methods), (COUNT(DISTINCT ?descriptive) AS ?number_of_des_methods), (COUNT(DISTINCT ?machine_learning) AS ?number_of_ml_methods), (COUNT(DISTINCT ?other_methods) AS ?number_of_other_methods), ?year
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    ?contribution orkgp:P15124 ?data_analysis.
                    ?data_analysis rdfs:label ?da_label.
                    
                    OPTIONAL{?data_analysis orkgp:P56043 ?inferential.}
                    OPTIONAL{?data_analysis orkgp:P56048 ?descriptive.}
                    OPTIONAL{?data_analysis orkgp:P57016 ?machine_learning.}
                    OPTIONAL{?data_analysis orkgp:P1005 ?other_methods.}
                    
                    FILTER(?da_label != "no analysis"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            } GROUP BY ?paper ?year
`,

  query_16_1: `
    SELECT ?paper, (COUNT(?dc_method_type_label) AS ?number_of_dc_methods), ?year
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    ?contribution orkgp:P56008 ?data_collection.
                    ?data_collection orkgp:P1005 ?dc_method;
                                    rdfs:label ?dc_label.
                    ?dc_method orkgp:P94003 ?dc_method_type.
                    ?dc_method_type rdfs:label ?dc_method_type_label.
                    
                    FILTER(?dc_label != "no collection"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            } GROUP BY ?paper ?year
`,

  query_16_2: `
    SELECT ?paper, (COUNT(DISTINCT ?inferential) AS ?number_of_inf_methods), (COUNT(DISTINCT ?descriptive) AS ?number_of_des_methods), (COUNT(DISTINCT ?machine_learning) AS ?number_of_ml_methods), (COUNT(DISTINCT ?other_methods) AS ?number_of_other_methods), ?year
            WHERE {
                    ?paper orkgp:P31 ?contribution;
                        orkgp:P29 ?year.
                    ?contribution a orkgc:C27001;
                                orkgp:P135046 ?serie.
                    ?serie rdfs:label ?venue_name.

                    ?contribution orkgp:P15124 ?data_analysis.
                    ?data_analysis rdfs:label ?da_label.
                    
                    OPTIONAL{?data_analysis orkgp:P56043 ?inferential.}
                    OPTIONAL{?data_analysis orkgp:P56048 ?descriptive.}
                    OPTIONAL{?data_analysis orkgp:P57016 ?machine_learning.}
                    OPTIONAL{?data_analysis orkgp:P1005 ?other_methods.}
                    
                    FILTER(?da_label != "no analysis"^^xsd:string)
                    #FILTER(xsd:integer(?year) > "1999"^^xsd:integer)
                    FILTER (?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
            } GROUP BY ?paper ?year
`,
};
