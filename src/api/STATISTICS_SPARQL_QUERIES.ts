//TODO: add types
type StatisticalQuerysType = {
  [key: string]: string;
};
const STATISTICS_SPARQL_QUERIES: StatisticalQuerysType = {
  PAPERS_QUERY: `SELECT (COUNT(?paper) AS ?paper_count)
  WHERE {
      ?paper rdf:type orkgc:Paper ;
            rdfs:label ?paper_title
  }
`,
  TRIPLES_QUERY: `
  SELECT (COUNT(?s) AS ?tripleCount)
  WHERE {
    ?s ?p ?o .
  }
`,
  RESOURCES_QUERY: `
SELECT (COUNT(?resource) AS ?resourceCount) (COUNT(DISTINCT ?resource) AS ?distinctResourceCount)
  WHERE {
    ?s ?p ?resource .
    FILTER(!isLiteral(?resource))
  }
    `,
  Literals_QUERY: `
     SELECT (COUNT(?literal) AS ?literalCount) (COUNT(DISTINCT ?literal) AS ?distinctLiteralCount)
  WHERE {
    ?s ?p ?literal .
    FILTER(isLiteral(?literal))
  }
    `,
  PROPERTIES_QUERY: `
     SELECT (COUNT(?property) AS ?propertyCount) (COUNT(DISTINCT ?property) AS ?distinctPropertyCount)
  WHERE {
    ?s ?property ?o .
  }
    `,
  PAPERS_PER_VENUE_QUERY: `
    SELECT ?venue (COUNT(?paper) AS ?paperCount)
  WHERE { 
    ?paper orkgp:P31 ?contribution .
    ?contribution a orkgc:C27001 ;
                  orkgp:P135046 ?serie .
    ?serie rdfs:label ?venue .
  }
  GROUP BY ?venue
  `,
  VALUES_COUNT_QUERY: `
  SELECT (COUNT(DISTINCT ?venue) AS ?venueCount)
  WHERE {
    ?paper orkgp:P31 ?contribution .
    ?contribution a orkgc:C27001 ;
                  orkgp:P135046 ?serie .
    ?serie rdfs:label ?venue .
  }
    `,
};
export default STATISTICS_SPARQL_QUERIES;
