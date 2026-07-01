/** RDF / SPARQL IRI, e.g. http://orkg.org/orkg/resource/R1547354 */
export const ORKG_RESOURCE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?orkg\.org\/orkg\/resource\/([A-Za-z0-9]+)/i;
/** e.g. https://orkg.org/papers/R1547354 */
export const ORKG_PAPER_PAGE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?orkg\.org\/papers\/([A-Za-z0-9]+)/i;
/** UI list path, e.g. https://orkg.org/resources/R1547354 */
export const ORKG_RESOURCES_UI_REGEX =
  /(?:https?:\/\/)?(?:www\.)?orkg\.org\/resources\/([A-Za-z0-9]+)/i;
/** Some UI deep links use singular "resource" */
export const ORKG_RESOURCE_UI_REGEX =
  /(?:https?:\/\/)?(?:www\.)?orkg\.org\/resource\/([A-Za-z0-9]+)/i;

export function isOrkgResourceUri(value: string): boolean {
  return typeof value === 'string' && extractOrkgResourceId(value) !== null;
}

export function extractOrkgResourceId(uri: string): string | null {
  const resourceMatch = uri.match(ORKG_RESOURCE_REGEX);
  if (resourceMatch) return resourceMatch[1];
  const paperMatch = uri.match(ORKG_PAPER_PAGE_REGEX);
  if (paperMatch) return paperMatch[1];
  const resourcesUiMatch = uri.match(ORKG_RESOURCES_UI_REGEX);
  if (resourcesUiMatch) return resourcesUiMatch[1];
  const resourceUiMatch = uri.match(ORKG_RESOURCE_UI_REGEX);
  if (resourceUiMatch) return resourceUiMatch[1];
  const trimmed = uri.trim();
  if (/^R[A-Za-z0-9_-]+$/i.test(trimmed)) return trimmed;
  return null;
}

/** Canonical public paper URL (avoids RDF IRI path …/orkg/resource/…). */
export function orkgPaperBrowseUrl(uriOrId: string): string | null {
  const id = extractOrkgResourceId(uriOrId);
  if (!id) return null;
  return `https://orkg.org/papers/${encodeURIComponent(id)}`;
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
