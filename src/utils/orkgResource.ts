export const ORKG_RESOURCE_REGEX = /orkg\.org\/orkg\/resource\/([A-Za-z0-9]+)/i;
/** e.g. https://orkg.org/papers/R1547354 */
export const ORKG_PAPER_PAGE_REGEX = /orkg\.org\/papers\/([A-Za-z0-9]+)/i;

export function isOrkgResourceUri(value: string): boolean {
  return (
    typeof value === 'string' &&
    (ORKG_RESOURCE_REGEX.test(value) || ORKG_PAPER_PAGE_REGEX.test(value))
  );
}

export function extractOrkgResourceId(uri: string): string | null {
  const resourceMatch = uri.match(ORKG_RESOURCE_REGEX);
  if (resourceMatch) return resourceMatch[1];
  const paperMatch = uri.match(ORKG_PAPER_PAGE_REGEX);
  if (paperMatch) return paperMatch[1];
  const trimmed = uri.trim();
  if (/^R[A-Za-z0-9_-]+$/i.test(trimmed)) return trimmed;
  return null;
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
