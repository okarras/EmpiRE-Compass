/**
 * Extract ORKG predicate IDs (P-number) from SPARQL text.
 * Matches `orkgp:P123` style references.
 */
export function extractOrkgPredicateIds(query: string): Set<string> {
  const regex = /orkgp:(P\d+)/gi;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(query)) !== null) {
    seen.add(match[1].toUpperCase());
  }
  return seen;
}
