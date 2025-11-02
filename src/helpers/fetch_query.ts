import { PREFIXES } from '../api/SPARQL_QUERIES';

const fetchSPARQLData = async (
  query: string,
  endpoint: string = 'https://orkg.org/triplestore'
) => {
  // Combine the prefixes and the query
  const fullQuery = `${PREFIXES}\n${query}`;

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
