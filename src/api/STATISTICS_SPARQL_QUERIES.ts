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
};

export default STATISTICS_SPARQL_QUERIES;
