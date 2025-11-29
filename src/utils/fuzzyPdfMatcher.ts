export interface FuzzyMatchResult {
  found: boolean;
  startIndex: number;
  endIndex: number;
  similarity: number;
  matchedText: string;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

export function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .trim();
}

export function aggressiveNormalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findFuzzyMatch(
  pdfText: string,
  searchText: string,
  options: {
    similarityThreshold?: number;
    useAggressiveNormalization?: boolean;
    windowSizeMultiplier?: number;
  } = {}
): FuzzyMatchResult {
  const {
    similarityThreshold = 0.85,
    useAggressiveNormalization = false,
    windowSizeMultiplier = 1.5,
  } = options;

  const exactIndex = pdfText.indexOf(searchText);
  if (exactIndex >= 0) {
    return {
      found: true,
      startIndex: exactIndex,
      endIndex: exactIndex + searchText.length,
      similarity: 1.0,
      matchedText: pdfText.substring(
        exactIndex,
        exactIndex + searchText.length
      ),
    };
  }

  const normalizedSearch = normalizeForMatching(searchText);
  const normalizedPdf = normalizeForMatching(pdfText);

  const normalizedIndex = normalizedPdf.indexOf(normalizedSearch);
  if (normalizedIndex >= 0) {
    const originalIndex = mapNormalizedToOriginal(
      pdfText,
      normalizedPdf,
      normalizedIndex
    );
    return {
      found: true,
      startIndex: originalIndex,
      endIndex: originalIndex + searchText.length,
      similarity: 0.95,
      matchedText: pdfText.substring(
        originalIndex,
        originalIndex + searchText.length
      ),
    };
  }

  if (useAggressiveNormalization) {
    const aggressiveSearch = aggressiveNormalize(searchText);
    const aggressivePdf = aggressiveNormalize(pdfText);

    const aggressiveIndex = aggressivePdf.indexOf(aggressiveSearch);
    if (aggressiveIndex >= 0) {
      const originalIndex = mapAggressiveToOriginal(
        pdfText,
        aggressivePdf,
        aggressiveIndex
      );
      return {
        found: true,
        startIndex: originalIndex,
        endIndex: originalIndex + searchText.length,
        similarity: 0.9,
        matchedText: pdfText.substring(
          originalIndex,
          originalIndex + searchText.length
        ),
      };
    }
  }

  const windowSize = Math.floor(searchText.length * windowSizeMultiplier);
  let bestMatch: FuzzyMatchResult = {
    found: false,
    startIndex: -1,
    endIndex: -1,
    similarity: 0,
    matchedText: '',
  };

  for (let i = 0; i <= pdfText.length - windowSize; i++) {
    const window = pdfText.substring(i, i + windowSize);
    const similarity = calculateSimilarity(
      normalizeForMatching(searchText),
      normalizeForMatching(window)
    );

    if (
      similarity > bestMatch.similarity &&
      similarity >= similarityThreshold
    ) {
      bestMatch = {
        found: true,
        startIndex: i,
        endIndex: i + windowSize,
        similarity,
        matchedText: window,
      };
    }
  }

  return bestMatch;
}

function mapNormalizedToOriginal(
  originalText: string,
  normalizedText: string,
  normalizedIndex: number
): number {
  let originalIndex = 0;
  let normalizedCount = 0;

  while (
    originalIndex < originalText.length &&
    normalizedCount < normalizedIndex
  ) {
    const char = originalText[originalIndex];
    const normalizedChar = normalizeForMatching(char);

    if (normalizedChar.length > 0) {
      normalizedCount++;
    }
    originalIndex++;
  }

  return originalIndex;
}

function mapAggressiveToOriginal(
  originalText: string,
  aggressiveText: string,
  aggressiveIndex: number
): number {
  let originalIndex = 0;
  let aggressiveCount = 0;

  while (
    originalIndex < originalText.length &&
    aggressiveCount < aggressiveIndex
  ) {
    const char = originalText[originalIndex];
    if (/[a-z0-9]/i.test(char)) {
      aggressiveCount++;
    }
    originalIndex++;
  }

  return originalIndex;
}

export function findAllFuzzyMatches(
  pdfText: string,
  searchText: string,
  options: Parameters<typeof findFuzzyMatch>[2] = {}
): FuzzyMatchResult[] {
  const matches: FuzzyMatchResult[] = [];
  let searchStart = 0;

  while (searchStart < pdfText.length) {
    const remainingText = pdfText.substring(searchStart);
    const match = findFuzzyMatch(remainingText, searchText, options);

    if (match.found) {
      matches.push({
        ...match,
        startIndex: searchStart + match.startIndex,
        endIndex: searchStart + match.endIndex,
      });
      searchStart += match.endIndex;
    } else {
      break;
    }
  }

  return matches;
}
