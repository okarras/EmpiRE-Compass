type StatisticalQuerysType = {
  [key: string]: string;
};
const STATISTICS_SPARQL_QUERIES: StatisticalQuerysType = {
  PAPERS_QUERY: `
  SELECT COUNT(?paper) AS ?paper_count
  WHERE {
      ?paper orkgp:P31 ?contri.
      OPTIONAL{?paper orkgp:P26 ?doi.} 
      ?contri a orkgc:C121001.
  }`,
  // TRIPLES_QUERY: `
  // SELECT (COUNT(?s) AS ?tripleCount)
  // WHERE {
  //   {
  //     ?s a orkgc:C121001 .
  //     ?s ?p ?o .
  //   } UNION {
  //     ?paper orkgp:P31 ?contri .
  //     ?contri a orkgc:C121001 .
  //     ?paper ?p ?o .
  //   }
  // }`,
  // RESOURCES_QUERY: `
  // SELECT (COUNT(?resource) AS ?resourceCount) (COUNT(DISTINCT ?resource) AS ?distinctResourceCount)
  // WHERE {
  //   {
  //     ?contri a orkgc:C121001 .
  //     ?contri ?p ?resource .
  //   } UNION {
  //     ?paper orkgp:P31 ?contri .
  //     ?contri a orkgc:C121001 .
  //     ?paper ?p ?resource .
  //   }
  // }`,
  // Literals_QUERY: `
  // SELECT (COUNT(?literal) AS ?literalCount) (COUNT(DISTINCT ?literal) AS ?distinctLiteralCount)
  // WHERE {
  //   {
  //     ?contri a orkgc:C121001 .
  //     ?contri ?p ?literal .
  //     FILTER(isLiteral(?literal))
  //   } UNION {
  //     ?paper orkgp:P31 ?contri .
  //     ?contri a orkgc:C121001 .
  //     ?paper ?p ?literal .
  //     FILTER(isLiteral(?literal))
  //   }
  // }`,
  // PROPERTIES_QUERY: `
  // SELECT (COUNT(?property) AS ?propertyCount) (COUNT(DISTINCT ?property) AS ?distinctPropertyCount)
  // WHERE {
  //   {
  //     ?contri a orkgc:C121001 .
  //     ?contri ?property ?o .
  //   } UNION {
  //     ?paper orkgp:P31 ?contri .
  //     ?contri a orkgc:C121001 .
  //     ?paper ?property ?o .
  //   }
  // }`,
  PAPERS_PER_VENUE_QUERY: `
  SELECT ?venue (COUNT(?paper) AS ?paperCount)
  WHERE { 
    ?paper orkgp:P31 ?contribution .
    ?contribution a orkgc:C121001 .
    ?paper orkgp:HAS_VENUE ?venueResource .
    ?venueResource rdfs:label ?venue .
  }
  GROUP BY ?venue`,
  VALUES_COUNT_QUERY: `
  SELECT (COUNT(DISTINCT ?venue) AS ?venueCount)
  WHERE {
    ?paper orkgp:P31 ?contribution .
    ?contribution a orkgc:C121001 .
    ?paper orkgp:HAS_VENUE ?venueResource .
    ?venueResource rdfs:label ?venue .
  }`,
};

export default STATISTICS_SPARQL_QUERIES;
