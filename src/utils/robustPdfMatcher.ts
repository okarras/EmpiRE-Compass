import {
  findFuzzyMatch,
  aggressiveNormalize,
  type FuzzyMatchResult,
} from './fuzzyPdfMatcher';
import {
  findTokenMatch,
  stripReferences,
  type TokenMatchResult,
} from './tokenPdfMatcher';
import { normalizeUnicode, unicodeFindIndex } from './unicodeNormalizer';

export interface RobustMatchResult {
  found: boolean;
  startIndex: number;
  endIndex: number;
  confidence: number;
  matchedText: string;
  strategy:
    | 'exact'
    | 'normalized'
    | 'aggressive'
    | 'fuzzy'
    | 'token'
    | 'partial';
  metadata?: {
    skippedReferences?: string[];
    similarity?: number;
  };
}

export interface RobustMatchOptions {
  similarityThreshold?: number;
  allowSkipReferences?: boolean;
  minTokenMatch?: number;
  tryAllStrategies?: boolean;
  enablePartialMatch?: boolean;
}

export function findRobustMatch(
  pdfText: string,
  searchText: string,
  options: RobustMatchOptions = {}
): RobustMatchResult {
  const {
    similarityThreshold = 0.85,
    allowSkipReferences = true,
    minTokenMatch = 0.8,
    tryAllStrategies = false,
    enablePartialMatch = true,
  } = options;

  const strategies: Array<() => RobustMatchResult | null> = [
    // Strategy 1: Exact match
    () => {
      const index = pdfText.indexOf(searchText);
      if (index >= 0) {
        return {
          found: true,
          startIndex: index,
          endIndex: index + searchText.length,
          confidence: 1.0,
          matchedText: pdfText.substring(index, index + searchText.length),
          strategy: 'exact',
        };
      }
      return null;
    },

    // Strategy 2: Unicode normalization (handles special characters like ligatures, accents)
    () => {
      const index = unicodeFindIndex(pdfText, searchText);
      if (index >= 0) {
        const normalizedPdf = normalizeUnicode(pdfText);
        const normalizedSearch = normalizeUnicode(searchText);
        const normalizedIndex = normalizedPdf.indexOf(normalizedSearch);
        let originalEnd = index;
        let normalizedCount = 0;
        while (
          originalEnd < pdfText.length &&
          normalizedCount < normalizedSearch.length
        ) {
          const char = pdfText[originalEnd];
          const normalizedChar = normalizeUnicode(char);
          normalizedCount += normalizedChar.length;
          originalEnd++;
        }

        return {
          found: true,
          startIndex: index,
          endIndex: originalEnd,
          confidence: 0.99,
          matchedText: pdfText.substring(index, originalEnd),
          strategy: 'normalized',
        };
      }
      return null;
    },

    // Strategy 3: Case-insensitive match
    () => {
      const lowerPdf = pdfText.toLowerCase();
      const lowerSearch = searchText.toLowerCase();
      const index = lowerPdf.indexOf(lowerSearch);
      if (index >= 0) {
        return {
          found: true,
          startIndex: index,
          endIndex: index + searchText.length,
          confidence: 0.98,
          matchedText: pdfText.substring(index, index + searchText.length),
          strategy: 'normalized',
        };
      }
      return null;
    },

    // Strategy 4: Strip punctuation from search text (handles added periods, etc.)
    () => {
      const cleanedSearch = searchText.replace(/[.!?;,]+$/, '').trim();
      if (cleanedSearch !== searchText) {
        const index = pdfText.indexOf(cleanedSearch);
        if (index >= 0) {
          return {
            found: true,
            startIndex: index,
            endIndex: index + cleanedSearch.length,
            confidence: 0.95,
            matchedText: pdfText.substring(index, index + cleanedSearch.length),
            strategy: 'normalized',
          };
        }
      }
      return null;
    },

    // Strategy 5: Aggressive normalization (alphanumeric only)
    () => {
      const aggressiveSearch = aggressiveNormalize(searchText);
      const aggressivePdf = aggressiveNormalize(pdfText);
      const index = aggressivePdf.indexOf(aggressiveSearch);

      if (index >= 0) {
        const originalIndex = mapAggressiveToOriginal(pdfText, index);
        return {
          found: true,
          startIndex: originalIndex,
          endIndex: originalIndex + searchText.length,
          confidence: 0.9,
          matchedText: pdfText.substring(
            originalIndex,
            originalIndex + searchText.length
          ),
          strategy: 'aggressive',
        };
      }
      return null;
    },

    // Strategy 6: Token-based matching (handles references)
    () => {
      const tokenResult = findTokenMatch(pdfText, searchText, {
        allowSkipReferences,
        minTokenMatch,
      });

      if (tokenResult.found) {
        return {
          found: true,
          startIndex: tokenResult.startIndex,
          endIndex: tokenResult.endIndex,
          confidence: tokenResult.confidence,
          matchedText: tokenResult.matchedText,
          strategy: 'token',
          metadata: {
            skippedReferences: tokenResult.skippedTokens,
          },
        };
      }
      return null;
    },

    // Strategy 7: Fuzzy matching
    () => {
      const fuzzyResult = findFuzzyMatch(pdfText, searchText, {
        similarityThreshold,
        useAggressiveNormalization: true,
      });

      if (fuzzyResult.found) {
        return {
          found: true,
          startIndex: fuzzyResult.startIndex,
          endIndex: fuzzyResult.endIndex,
          confidence: fuzzyResult.similarity,
          matchedText: fuzzyResult.matchedText,
          strategy: 'fuzzy',
          metadata: {
            similarity: fuzzyResult.similarity,
          },
        };
      }
      return null;
    },

    () => {
      if (!enablePartialMatch) return null;

      const minLength = Math.floor(searchText.length * 0.6); // At least 60% match
      const partial = findLongestCommonSubstring(pdfText, searchText);

      if (partial && partial.length >= minLength) {
        const index = pdfText.indexOf(partial);
        if (index >= 0) {
          return {
            found: true,
            startIndex: index,
            endIndex: index + partial.length,
            confidence: partial.length / searchText.length,
            matchedText: pdfText.substring(index, index + partial.length),
            strategy: 'partial',
          };
        }
      }
      return null;
    },
  ];

  if (tryAllStrategies) {
    const results = strategies
      .map((strategy) => strategy())
      .filter((result): result is RobustMatchResult => result !== null)
      .sort((a, b) => b.confidence - a.confidence);

    return (
      results[0] || {
        found: false,
        startIndex: -1,
        endIndex: -1,
        confidence: 0,
        matchedText: '',
        strategy: 'exact',
      }
    );
  } else {
    for (const strategy of strategies) {
      const result = strategy();
      if (result) {
        return result;
      }
    }

    return {
      found: false,
      startIndex: -1,
      endIndex: -1,
      confidence: 0,
      matchedText: '',
      strategy: 'exact',
    };
  }
}

function mapAggressiveToOriginal(
  originalText: string,
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

function findLongestCommonSubstring(str1: string, str2: string): string {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  let longest = '';

  for (let i = 0; i < s2.length; i++) {
    for (let j = i + 1; j <= s2.length; j++) {
      const substring = s2.substring(i, j);
      if (s1.includes(substring) && substring.length > longest.length) {
        longest = substring;
      }
    }
  }

  return longest;
}

export function preprocessSearchText(text: string): string {
  return text
    .trim()
    .replace(/[.!?;,]+$/, '') // Remove trailing punctuation
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function findAllRobustMatches(
  pdfText: string,
  searchTexts: string[],
  options: RobustMatchOptions = {}
): RobustMatchResult[] {
  return searchTexts
    .map((searchText) =>
      findRobustMatch(pdfText, preprocessSearchText(searchText), options)
    )
    .filter((result) => result.found);
}
