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

  query_4: `
    SELECT DISTINCT ?contribution ?paper ?paperLabel ?RETaskLabel ?NLPTaskInputLabel
    WHERE {
        ?paper orkgp:P31 ?contribution .
        ?contribution rdf:type orkgc:C121001;
             orkgp:P181002 ?RETask;
                         orkgp:P181003 ?NLPTask.
        ?NLPTask orkgp:P181005 ?NLPTaskInput .


        OPTIONAL {?paper rdfs:label ?paperLabel .}
        OPTIONAL {?RETask rdfs:label ?RETaskLabel .}
        OPTIONAL {?NLPTaskInput rdfs:label ?NLPTaskInputLabel .}
    }ORDER BY ?contribution
`,

  query_5: `
    SELECT DISTINCT ?contribution ?paper ?paperLabel ?baseline_typeLabel
    WHERE {
        ?paper orkgp:P31 ?contribution .
        ?contribution rdf:type orkgc:C121001;
             orkgp:HAS_EVALUATION ?evaluation .
        ?evaluation orkgp:P181051 ?baseline_comparison .
        ?baseline_comparison orkgp:P181052 ?baseline_type .


        OPTIONAL {?paper rdfs:label ?paperLabel .}
        OPTIONAL {?baseline_type rdfs:label ?baseline_typeLabel .}
    } ORDER BY ?contribution
`,

  query_6: `
    SELECT DISTINCT ?contribution ?paper ?paperLabel ?NLPdataformatLabel
    WHERE {
        ?paper orkgp:P31 ?contribution .
        ?contribution rdf:type orkgc:C121001;
                 orkgp:P181011 ?NLPdataset .
        ?NLPdataset orkgp:P181022 ?NLPdatatype .
        ?NLPdatatype orkgp:P181023 ?NLPdataformat .


        OPTIONAL {?paper rdfs:label ?paperLabel .}
        OPTIONAL {?NLPdataformat rdfs:label ?NLPdataformatLabel .}
    } ORDER BY ?contribution
`,

  query_7: `
    SELECT DISTINCT ?contribution ?paper ?paperLabel ?intercoderReliabilityMetricLabel
    WHERE {
        ?paper orkgp:P31 ?contribution .
        ?contribution rdf:type orkgc:C121001;
                 orkgp:P181031 ?annotationProcess .
        ?annotationProcess orkgp:P181041 ?annotationAgreement .
        ?annotationAgreement orkgp:P181042 ?intercoderReliabilityMetric .


        OPTIONAL {?paper rdfs:label ?paperLabel .}
        OPTIONAL {?intercoderReliabilityMetric rdfs:label ?intercoderReliabilityMetricLabel .}
    } ORDER BY ?contribution
`,

  query_8: `
    SELECT DISTINCT
      ?contribution
      ?paper
      ?paperLabel
      ?NLPTaskTypeLabel
      ?NLPdataItem
      ?dataProductionTime
      ?NLPdatasourceTypeLabel
      ?numberOfDatasources
      ?datasourceDomainLabel
      ?NLPdataFormatLabel
      ?rigorOfDataFormatLabel
      ?naturalLanguage
      ?licensePubliclyAvailableLabel
      ?licenseTypeLabel
      ?NLPdataset
      ?datasetLocationTypeLabel
      ?datasetURL
      ?NLPabstractionLevelLabel
    WHERE {
      ?paper orkgp:P31 ?contribution .
      ?contribution rdf:type orkgc:C121001 ;
                    orkgp:P181003 ?NLPTask ;
                    orkgp:P181011 ?NLPdataset .

      OPTIONAL {
        ?NLPTask orkgp:P181004 ?NLPTaskType .
        ?NLPTaskType rdfs:label ?NLPTaskTypeLabel .}

      ?NLPdataset orkgp:P181015 ?NLPdataItem ;
                  orkgp:P181016 ?dataProductionTime ;
                  orkgp:P181017 ?NLPdatasource ;
                  orkgp:P181021 ?NLPabstractionLevel ;
                  orkgp:P181022 ?NLPdatatype ;
                  orkgp:license ?license ;
                  orkgp:P181028 ?datasetLocation .

      ?NLPdatasource orkgp:P181018 ?NLPdatasourceType ;
                         orkgp:P181020 ?datasourceDomain .

      OPTIONAL{?NLPdatasource orkgp:P181019 ?numberOfDatasources .}

      OPTIONAL { ?NLPdatasourceType rdfs:label ?NLPdatasourceTypeLabel .
                 ?datasourceDomain rdfs:label ?datasourceDomainLabel .
                 ?NLPabstractionLevel rdfs:label ?NLPabstractionLevelLabel .}

      ?NLPdatatype orkgp:P181023 ?NLPdataFormat ;
                   orkgp:P181024 ?rigorOfDataFormat ;
                   orkgp:P181025 ?naturalLanguage .

      OPTIONAL { ?NLPdataFormat rdfs:label ?NLPdataFormatLabel . }
      OPTIONAL { ?rigorOfDataFormat rdfs:label ?rigorOfDataFormatLabel .}

      ?license orkgp:P181026 ?licensePubliclyAvailable ;
               orkgp:P181027 ?licenseType .
      OPTIONAL { ?licensePubliclyAvailable rdfs:label ?licensePubliclyAvailableLabel . }
      OPTIONAL { ?licenseType rdfs:label ?licenseTypeLabel . }

      ?datasetLocation orkgp:P181030 ?datasetLocationType .
      OPTIONAL { ?datasetLocationType rdfs:label ?datasetLocationTypeLabel . }
      OPTIONAL { ?datasetLocation orkgp:P1003 ?datasetURL . }

      OPTIONAL { ?paper rdfs:label ?paperLabel . }
    }
    ORDER BY ?contribution ?NLPTaskTypeLabel
`,

  query_9: `
    SELECT DISTINCT ?contribution ?paper ?paperLabel ?RETaskLabel ?NLPTaskTypeLabel ?NLPTaskTypeDescription
    WHERE {
        ?paper orkgp:P31 ?contribution .
        ?contribution rdf:type orkgc:C121001;
                          orkgp:P181002 ?RETask;
                          orkgp:P181003 ?NLPTask .

        ?NLPTask orkgp:P181004 ?NLPTaskType .
        OPTIONAL{?NLPTaskType orkgp:description ?NLPTaskTypeDescription .}

        OPTIONAL { ?paper rdfs:label ?paperLabel . }
        OPTIONAL { ?RETask rdfs:label ?RETaskLabel . }
        OPTIONAL { ?NLPTaskType rdfs:label ?NLPTaskTypeLabel . }
    }
    ORDER BY ?contribution ?paperLabel ?NLPTaskTypeLabel
`,

  query_10: `
    SELECT 
    DISTINCT ?contribution
    ?ratio_missing_eval
    ?ratio_missing_approach
    ?ratio_missing_nlptask
    ?ratio_missing_nlp_dataset
    ?ratio_annotation_missing
    WHERE {
      {
        SELECT DISTINCT ?contribution (xsd:float(?AnnotationNotReportedCount)/xsd:float(10)*100 AS ?ratio_annotation_missing)
        WHERE {
          ?paper orkgp:P31 ?contribution.
          ?contribution a orkgc:C121001;
                       orkgp:P181031 ?annotationProcess.
          
          ?annotationProcess orkgp:P181032 ?annotator; 
                             orkgp:P181036 ?annotationScheme; 
                             orkgp:P181039 ?sharedMat; 
                             orkgp:P181040 ?fatigueMitig; 
                             orkgp:P181041 ?agreement .
          
          ?annotator orkgp:P181033 ?annotatorAssignm; 
                     orkgp:P181034 ?levelExpertise; 
                     orkgp:P181035 ?annotatorIdentity .
          
          OPTIONAL{?annotator orkgp:P59120 ?numAnnotators.}
          
          ?annotationScheme orkgp:P181037 ?schemeEstabl; 
                            orkgp:P181038 ?guidelineAv .
          
          ?agreement orkgp:P181042 ?intercoder; 
                     orkgp:P181044 ?conflictRes; 
                     orkgp:P181045 ?measueredAgree .
                    
          ?sharedMat rdfs:label ?sharedMatLabel .
          ?annotatorAssignm rdfs:label ?annotatorAssignmLabel .
          ?levelExpertise rdfs:label ?levelExpertiseLabel .
          ?annotatorIdentity rdfs:label ?annotatorIdentityLabel .
          ?schemeEstabl rdfs:label ?schemeEstablLabel .
          ?guidelineAv rdfs:label ?guidelineAvLabel .
          ?intercoder rdfs:label ?intercoderLabel .
          ?conflictRes rdfs:label ?conflictResLabel .
          
          BIND(
            (IF(?sharedMatLabel = "Not reported"^^xsd:string, 1, 0) +
            IF(?annotatorAssignmLabel = "Not reported"^^xsd:string, 1, 0) +
            IF(?levelExpertiseLabel = "Not reported"^^xsd:string, 1, 0) +
            IF(?annotatorIdentityLabel = "Not reported"^^xsd:string, 1, 0) +
            IF(?schemeEstablLabel = "Not reported"^^xsd:string, 1, 0) +
            IF(?guidelineAvLabel = "Not reported"^^xsd:string, 1, 0) +
            IF(?intercoderLabel = "Not reported"^^xsd:string, 1, 0) +
            IF(?conflictResLabel = "Not reported"^^xsd:string, 1, 0) +
            IF(?measueredAgree = "Not reported"^^xsd:string, 1, 0) +
             IF(BOUND(?numAnnotators), 0, 1))
            AS ?AnnotationNotReportedCount
          )
        } GROUP BY ?contribution
      }
    
      {
        SELECT DISTINCT ?contribution (xsd:float(?DatasetNotReportedCount)/xsd:float(13)*100 AS ?ratio_missing_nlp_dataset)
        WHERE {
          ?paper orkgp:P31 ?contribution.
          ?contribution a orkgc:C121001;
                       orkgp:P181011 ?NLPdataset.
          
          ?NLPdataset orkgp:P181015 ?dataitem; 
                      orkgp:P181016 ?prodtime;
                      orkgp:P181021 ?abstractionLevel; 
                      orkgp:P181017 ?dataSource; 
                      orkgp:P181022 ?dataType; 
                      orkgp:license ?license; 
                      orkgp:P181028 ?datasetLoc .
                    
          ?dataSource orkgp:P181018 ?datasourceType; 
                      orkgp:P181020 ?dataSourceDomain .
          
           OPTIONAL{?dataSource orkgp:P181019 ?numDatasources.} 
          
          ?abstractionLevel rdfs:label ?abstractionLevelLabel .
          ?datasourceType rdfs:label ?datasourceTypeLabel .
          ?dataSourceDomain rdfs:label ?dataSourceDomainLabel .
          
          ?dataType orkgp:P181023 ?dataFormat; 
                    orkgp:P181025 ?naturalLang; 
                    orkgp:P181024 ?rigor .
                    
          ?dataFormat rdfs:label ?dataFormatLabel .
          ?rigor rdfs:label ?rigorLabel .
          
          ?license orkgp:P181026 ?publiclyAvail;
                   orkgp:P181027 ?licenseType .
          
          ?publiclyAvail rdfs:label ?publiclyAvailLabel .
          ?licenseType rdfs:label ?licenseTypeLabel .
          
          ?datasetLoc orkgp:P181030 ?locType .
          OPTIONAL{ ?datasetLoc orkgp:P1003 ?url .}
          
          ?locType rdfs:label ?locTypeLabel .
                    
          BIND(
            (IF(?dataitem = "Not reported"^^xsd:string, 1, 0) +
             IF(?prodtime = "Not reported"^^xsd:string, 1, 0) +
             IF(?abstractionLevelLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?datasourceTypeLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?dataSourceDomainLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?dataFormatLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?naturalLang = "Not reported"^^xsd:string, 1, 0) +
             IF(?rigorLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?publiclyAvailLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?licenseTypeLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?locTypeLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(BOUND(?numDataSources), 0, 1)+
             IF(BOUND(?url), 0, 1))
            AS ?DatasetNotReportedCount
          )
        } GROUP BY ?contribution
      }
  
      {
        SELECT DISTINCT ?contribution (xsd:float(?NLPTaskNotReportedCount)/xsd:float(6)*100 AS ?ratio_missing_nlptask)
        WHERE {
          ?paper orkgp:P31 ?contribution.
          ?contribution a orkgc:C121001;
                        orkgp:P181003 ?NLPTask .
          ?NLPTask orkgp:P181004 ?NLPTaskType;
                 orkgp:P181005 ?NLPTaskInput;
                 orkgp:P181006 ?NLPTaskOutput .

          ?NLPTaskOutput orkgp:P181007 ?NLPTaskOutputType;
                       orkgp:P181008 ?NLPTaskOutputClassi;
                       orkgp:P181009 ?NLPTaskOutputExtr; 
                       orkgp:P181010 ?NLPTaskOutputTransl .
        
          ?NLPTaskType rdfs:label ?taskLabel .
          ?NLPTaskInput rdfs:label ?inputLabel .
          ?NLPTaskOutputType rdfs:label ?outputLabel .
          ?NLPTaskOutputTransl rdfs:label ?transLabel .
        
          BIND(
            (IF(?taskLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?inputLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?outputLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?NLPTaskOutputClassi = "Not reported"^^xsd:string, 1, 0) +
             IF(?NLPTaskOutputExtr = "Not reported"^^xsd:string, 1, 0) +
             IF(?transLabel = "Not reported"^^xsd:string, 1, 0))
            AS ?NLPTaskNotReportedCount
            )
          }ORDER BY ?contribution
       }
         
      {
        SELECT DISTINCT ?contribution (xsd:float(?EvaluationNotReportedCount)/xsd:float(4)*100 AS ?ratio_missing_eval)
        WHERE {
          ?paper orkgp:P31 ?contribution.
          ?contribution a orkgc:C121001.
          ?contribution orkgp:HAS_EVALUATION ?evaluation.
          ?evaluation orkgp:P110006 ?metric;
                      orkgp:P181050 ?validation;
                      orkgp:P181051 ?baseline.
          ?baseline orkgp:P181052 ?type;
                    orkgp:P181053 ?details.
          ?metric rdfs:label ?mlabel.
          ?validation rdfs:label ?vlabel.
          ?type rdfs:label ?tlabel.
          
          BIND(
            (IF(?mlabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?vlabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?tlabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?details = "Not reported"^^xsd:string, 1, 0))
            AS ?EvaluationNotReportedCount
          )
        } GROUP BY ?contribution
      }
      
      {
        SELECT DISTINCT ?contribution (xsd:float(?ApproachNotReportedCount)/xsd:float(9)*100 AS ?ratio_missing_approach)
        WHERE {
          ?paper orkgp:P31 ?contribution.
          ?contribution a orkgc:C121001.

          ?contribution orkgp:P181046 ?approach.
          ?approach orkgp:P5043 ?type;
                    orkgp:P58069 ?algorithm;
                    orkgp:P181047 ?requirements; 
                    orkgp:P41835 ?documentation;
                    orkgp:P181048 ?dependency; 
                    orkgp:P181027 ?licenseType; 
                    orkgp:release ?release.
          ?release orkgp:P181029 ?locationType;
                   orkgp:P181049 ?releaseFormat.
          
          OPTIONAL{?release orkgp:P1003 ?url.}
          ?type rdfs:label ?typeLabel.
          ?algorithm rdfs:label ?algorithmLabel.

          ?requirements rdfs:label ?requirementsLabel.
          ?documentation rdfs:label ?documentationLabel.
          ?dependency rdfs:label ?dependencyLabel.
          ?licenseType rdfs:label ?licenseTypeLabel.
          ?locationType rdfs:label ?locationTypeLabel.
          ?releaseFormat rdfs:label ?releaseFormatLabel.

          BIND(
            (IF(?typeLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?algorithmLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?requirementsLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?documentationLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?dependencyLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?licenseTypeLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?locationTypeLabel = "Not reported"^^xsd:string, 1, 0) +
             IF(?releaseFormatLabel = "No reported"^^xsd:string, 1, 0) +
             IF(BOUND(?url), 0, 1))
            AS ?ApproachNotReportedCount
          )
        } GROUP BY ?contribution
      } 
    } GROUP BY ?contribution
    ORDER BY ?contribution
`,

  query_11: `
    SELECT DISTINCT ?contribution ?paper ?paperLabel ?numberOfAnnotators ?NLPTaskTypeLabel ?annotatorAssignmentLabel ?levelOfExpertiseLabel ?annotatorIdentityLabel
    WHERE {
        ?paper orkgp:P31 ?contribution .
        ?contribution rdf:type orkgc:C121001;
                 orkgp:P181031 ?annotationProcess;
                 orkgp:P181003 ?NLPTask .

         ?NLPTask orkgp:P181004 ?NLPTaskType .
         ?annotationProcess orkgp:P181032 ?annotator .
         ?annotator orkgp:P59120 ?numberOfAnnotators;
                    orkgp:P181033 ?annotatorAssignment;
                    orkgp:P181034 ?levelOfExpertise;
                    orkgp:P181035 ?annotatorIdentity .

        OPTIONAL { ?NLPTaskType rdfs:label ?NLPTaskTypeLabel . }
        OPTIONAL {?paper rdfs:label ?paperLabel .}
        OPTIONAL {?annotatorAssignment rdfs:label ?annotatorAssignmentLabel .}
        OPTIONAL {?levelOfExpertise rdfs:label ?levelOfExpertiseLabel .}
        OPTIONAL {?annotatorIdentity rdfs:label ?annotatorIdentityLabel .}
    } ORDER BY ?paperLabel
`,
};
