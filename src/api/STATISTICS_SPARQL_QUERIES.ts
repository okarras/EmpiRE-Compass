type StatisticalQuerysType = {
  [key: string]: string;
};
const STATISTICS_SPARQL_QUERIES: StatisticalQuerysType = {
  PAPERS_QUERY: `
  SELECT COUNT(?paper) AS ?paper_count
  WHERE {
      ?paper orkgp:P31 ?contri.
      OPTIONAL{?paper orkgp:P26 ?doi.} 
      ?contri a orkgc:C27001.
      ?contri orkgp:P135046 ?venue.
      ?venue rdfs:label ?venue_name.
    FILTER ((?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string || ?venue_name = "International Working Conference on Requirements Engineering: Foundation for Software Quality"^^xsd:string))
  }`,
  PAPERS_PER_VENUE_QUERY: `
  SELECT ?venue (COUNT(?paper) AS ?paperCount)
  WHERE { 
    ?paper orkgp:P31 ?contribution .
    ?contribution a orkgc:C27001 ;
                  orkgp:P135046 ?serie .
    ?serie rdfs:label ?venue .
  }
  GROUP BY ?venue`,
  VALUES_COUNT_QUERY: `
  SELECT (COUNT(DISTINCT ?venue) AS ?venueCount)
  WHERE {
    ?paper orkgp:P31 ?contribution .
    ?contribution a orkgc:C27001 ;
                  orkgp:P135046 ?serie .
    ?serie rdfs:label ?venue .
  }`,
  TOTAL_ORKG_PAPERS_QUERY: `
  SELECT (COUNT(?paper) AS ?total_papers)
  WHERE {
    ?paper a orkgc:Paper .
  }`,
  // Distinct typed resources. Denominator for the distinct-resources gauge.
  TOTAL_ORKG_RESOURCES_QUERY: `
  SELECT (COUNT(DISTINCT ?resource) AS ?total_resources)
  WHERE {
    ?resource a ?class .
    FILTER(!isLiteral(?resource))
  }`,
  TOTAL_ORKG_STATEMENTS_QUERY: `
  SELECT (COUNT(*) AS ?total_statements)
  WHERE {
    ?s ?p ?o .
  }`,
  TOTAL_ORKG_OBSERVATORIES_QUERY: `
  SELECT (COUNT(DISTINCT ?observatory) AS ?total_observatories)
  WHERE {
    ?observatory a orkgc:Observatory .
  }`,
  // Resource occurrences (IRI subjects + IRI objects), matching KG total_resources.
  TOTAL_ORKG_RESOURCE_OCCURRENCES_QUERY: `
  SELECT ((?subjects + ?objects) AS ?total_resource_occurrences)
  WHERE {
    {
      SELECT (COUNT(*) AS ?subjects)
      WHERE {
        ?s ?p ?o .
        FILTER(isIRI(?s))
      }
    }
    {
      SELECT (COUNT(*) AS ?objects)
      WHERE {
        ?s ?p ?o .
        FILTER(isIRI(?o))
      }
    }
  }`,
};

export default STATISTICS_SPARQL_QUERIES;
