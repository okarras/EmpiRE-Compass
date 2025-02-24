import { PREFIXES } from "../queries/queries";

const fetchSPARQLData = async (query: string, endpoint: string = 'https://orkg.org/triplestore') => {
    try {
        // Combine the prefixes and the query
        const fullQuery = `${PREFIXES}\n${query}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/sparql-results+json',
            },
            body: new URLSearchParams({ query: fullQuery }),
        });

        if (!response.ok) {
            throw new Error(`SPARQL query failed: ${response.status} ${response.statusText}`);
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
    } catch (error) {
        console.error("Error fetching SPARQL data:", error);
        return [];
    }
};

export default fetchSPARQLData;
