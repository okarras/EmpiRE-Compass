/**
 * Utility functions for parsing and extracting SPARQL queries and JavaScript code
 * from Markdown formatted text
 */

export interface SPARQLBlock {
  id: string;
  query: string;
}

export interface ParsedQueryResponse {
  sparqlBlocks: SPARQLBlock[];
  javascript: string | null;
}

/**
 * Extract SPARQL and JavaScript blocks from Markdown output
 */
export const extractFromMarkdown = (markdown: string): ParsedQueryResponse => {
  const sparqlBlockRegex = /```sparql\n([\s\S]*?)\n```/gi;
  const jsRegex = /```(?:javascript|js)\n([\s\S]*?)\n```/i;

  const sparqlBlocks: SPARQLBlock[] = [];
  let match: RegExpExecArray | null;

  while ((match = sparqlBlockRegex.exec(markdown)) !== null) {
    const full = match[1].trim();
    const lines = full.split(/\n/);
    let id = 'main';
    let startIndex = 0;

    if (lines[0].trim().startsWith('#')) {
      const idMatch = lines[0].match(/#\s*id\s*:\s*([A-Za-z0-9_-]+)/i);
      if (idMatch) {
        id = idMatch[1];
        startIndex = 1;
      }
    }

    const query = lines.slice(startIndex).join('\n').trim();
    if (query) {
      sparqlBlocks.push({ id, query });
    }
  }

  const jsMatch = markdown.match(jsRegex);

  return {
    sparqlBlocks,
    javascript: jsMatch && jsMatch[1] ? jsMatch[1].trim() : null,
  };
};

/**
 * Sanitize a raw SPARQL query string by removing markdown code fences
 */
export const sanitizeSparqlQuery = (query: string): string => {
  return query
    .replace(/^```.*$/gm, '')
    .replace(/```\s*$/gm, '')
    .trim();
};

/**
 * Parse SPARQL blocks from a query string (with or without markdown)
 */
export const parseSparqlBlocks = (queryString: string): SPARQLBlock[] => {
  const { sparqlBlocks } = extractFromMarkdown(
    '```sparql\n' + queryString + '\n```'
  );

  if (sparqlBlocks.length > 0) {
    return sparqlBlocks;
  }

  // Fallback: treat as single query
  return [
    {
      id: 'main',
      query: sanitizeSparqlQuery(queryString),
    },
  ];
};

/**
 * Combine multiple SPARQL blocks into a single display string
 */
export const combineSparqlBlocks = (blocks: SPARQLBlock[]): string => {
  return blocks.map((b) => `# id: ${b.id}\n${b.query}`).join('\n\n');
};
