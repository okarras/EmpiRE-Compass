export interface SimpleMatchResult {
  found: boolean;
  startIndex: number;
  endIndex: number;
  confidence: number;
  strategy: 'exact' | 'normalized' | 'none';
  matchedText: string;
}

/**
 * Normalize text for matching
 * Rules:
 * 1. Lowercase
 * 2. Remove everything except a-z and 0-9 (including spaces!)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase() // Step 1: lowercase
    .replace(/[^a-z0-9]/g, ''); // Step 2: keep only a-z, 0-9 (NO spaces)
}

function buildPositionMap(originalText: string): number[] {
  const map: number[] = [];

  let originalIdx = 0;
  let normalizedIdx = 0;

  while (originalIdx < originalText.length) {
    const char = originalText[originalIdx];
    const normalizedChar = normalizeText(char);

    if (normalizedChar.length > 0 && normalizedChar !== ' ') {
      map[normalizedIdx] = originalIdx;
      normalizedIdx++;
    } else if (normalizedChar === ' ') {
      if (normalizedIdx === 0 || map[normalizedIdx - 1] !== undefined) {
        map[normalizedIdx] = originalIdx;
        normalizedIdx++;
      }
    }

    originalIdx++;
  }

  return map;
}

function findExactNormalizedMatch(
  pdfText: string,
  searchText: string
): SimpleMatchResult | null {
  const normalizedPdf = normalizeText(pdfText);
  const normalizedSearch = normalizeText(searchText);

  const index = normalizedPdf.indexOf(normalizedSearch);

  if (index >= 0) {
    // Map back to original positions
    const positionMap = buildPositionMap(pdfText);
    const startIndex = positionMap[index] ?? 0;

    // Find end position
    let endIndex = startIndex;
    let matchedLength = 0;
    while (
      endIndex < pdfText.length &&
      matchedLength < normalizedSearch.length
    ) {
      const char = pdfText[endIndex];
      const normalizedChar = normalizeText(char);
      if (normalizedChar.length > 0) {
        matchedLength += normalizedChar.length;
      }
      endIndex++;
    }

    return {
      found: true,
      startIndex,
      endIndex,
      confidence: 1.0,
      strategy: 'normalized',
      matchedText: pdfText.substring(startIndex, endIndex),
    };
  }

  return null;
}

export function findSimpleMatch(
  pdfText: string,
  searchText: string,
  options: {
    maxSearchTime?: number;
  } = {}
): SimpleMatchResult {
  const startTime = performance.now();
  const maxTime = options.maxSearchTime ?? 50;

  const cleanSearch = searchText.trim();
  if (cleanSearch.length === 0) {
    return {
      found: false,
      startIndex: -1,
      endIndex: -1,
      confidence: 0,
      strategy: 'none',
      matchedText: '',
    };
  }

  // Strategy 1: Exact match (try original text first)
  const exactIndex = pdfText.indexOf(cleanSearch);
  if (exactIndex >= 0) {
    return {
      found: true,
      startIndex: exactIndex,
      endIndex: exactIndex + cleanSearch.length,
      confidence: 1.0,
      strategy: 'exact',
      matchedText: pdfText.substring(
        exactIndex,
        exactIndex + cleanSearch.length
      ),
    };
  }

  const elapsed = performance.now() - startTime;
  if (elapsed >= maxTime) {
    return {
      found: false,
      startIndex: -1,
      endIndex: -1,
      confidence: 0,
      strategy: 'none',
      matchedText: '',
    };
  }

  // Strategy 2: Normalized match (alphanumeric only, no spaces)
  const normalizedResult = findExactNormalizedMatch(pdfText, cleanSearch);
  if (normalizedResult) {
    return normalizedResult;
  }

  // Not found
  return {
    found: false,
    startIndex: -1,
    endIndex: -1,
    confidence: 0,
    strategy: 'none',
    matchedText: '',
  };
}

export function preprocessSearchText(text: string): string {
  return text.trim();
}
