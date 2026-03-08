import { PREFIXES } from '../api/SPARQL_QUERIES';

/**
 * Prepare SPARQL query for execution: remove PREFIX declarations (we prepend standard ones)
 * and strip Virtuoso directives that can cause SP030 "syntax error at '}'".
 * LLM-generated queries often include PREFIXes; duplicates confuse Virtuoso's parser.
 */
function prepareQuery(query: string): string {
  const lines = query.split('\n');
  const filtered = lines.filter((line) => {
    const t = line.trim();
    return !/^PREFIX\s+/i.test(t) && !/^define\s+sql:big-data-const/i.test(t);
  });
  return filtered.join('\n').trim();
}

const fetchSPARQLData = async (
  query: string,
  endpoint: string = 'https://orkg.org/triplestore'
) => {
  // Strip PREFIXes and Virtuoso directives to avoid duplicates/SP030
  const queryWithoutPrefixes = prepareQuery(query);
  const fullQuery = `${PREFIXES.trim()}\n${queryWithoutPrefixes}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
    },
    body: new URLSearchParams({ query: fullQuery }),
  });

  if (!response.ok) {
    // Try to get detailed error message from response body
    let errorMessage = `SPARQL query failed: ${response.status} ${response.statusText}`;
    try {
      const errorText = await response.text();
      if (errorText) {
        // ORKG/Virtuoso returns detailed error messages in the response body
        errorMessage = errorText;
      }
    } catch (e) {
      // If we can't read the error body, use the basic error message
      console.warn('Could not read error response body:', e);
    }

    // Include the query that caused the error for better context
    const errorWithQuery = `${errorMessage}\n\nSPARQL query:\n${fullQuery}`;
    throw new Error(errorWithQuery);
  }

  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.results.bindings.map((binding: any) => {
    // eslint-disable-next-line prefer-const
    let result: Record<string, string> = {};
    for (const key in binding) {
      result[key] = binding[key].value;
    }
    return result;
  });
};

export default fetchSPARQLData;
