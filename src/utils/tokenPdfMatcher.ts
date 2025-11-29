export interface TokenMatchResult {
  found: boolean;
  startIndex: number;
  endIndex: number;
  confidence: number;
  matchedText: string;
  skippedTokens: string[];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function isReference(token: string): boolean {
  const referencePatterns = [
    /^\[\d+\]$/,
    /^\[\w+\s*\d{4}\]$/,
    /^\(\d{4}\)$/,
    /^\[\w+\s*et\s*al\.?\]$/,
    /^[\[\(]\d+[\]\)]$/,
    /^\d+\.$/,
  ];

  return referencePatterns.some((pattern) => pattern.test(token));
}

export function findTokenMatch(
  pdfText: string,
  searchText: string,
  options: {
    allowSkipReferences?: boolean;
    minTokenMatch?: number;
    maxSkippedTokens?: number;
  } = {}
): TokenMatchResult {
  const {
    allowSkipReferences = true,
    minTokenMatch = 0.8,
    maxSkippedTokens = 5,
  } = options;

  const searchTokens = tokenize(searchText);
  const pdfTokens = tokenize(pdfText);

  if (searchTokens.length === 0) {
    return {
      found: false,
      startIndex: -1,
      endIndex: -1,
      confidence: 0,
      matchedText: '',
      skippedTokens: [],
    };
  }

  for (let i = 0; i <= pdfTokens.length - searchTokens.length; i++) {
    let searchIdx = 0;
    let pdfIdx = i;
    let matchedTokens = 0;
    const skipped: string[] = [];
    const startPos = i;

    while (searchIdx < searchTokens.length && pdfIdx < pdfTokens.length) {
      const searchToken = searchTokens[searchIdx];
      const pdfToken = pdfTokens[pdfIdx];

      if (searchToken === pdfToken) {
        matchedTokens++;
        searchIdx++;
        pdfIdx++;
      } else if (
        allowSkipReferences &&
        isReference(pdfToken) &&
        skipped.length < maxSkippedTokens
      ) {
        skipped.push(pdfToken);
        pdfIdx++;
      } else if (
        pdfToken.includes(searchToken) ||
        searchToken.includes(pdfToken)
      ) {
        matchedTokens += 0.8;
        searchIdx++;
        pdfIdx++;
      } else {
        break;
      }
    }

    const matchRatio = matchedTokens / searchTokens.length;

    if (matchRatio >= minTokenMatch && searchIdx === searchTokens.length) {
      const charStart = findTokenCharPosition(pdfText, startPos);
      const charEnd = findTokenCharPosition(pdfText, pdfIdx);

      return {
        found: true,
        startIndex: charStart,
        endIndex: charEnd,
        confidence: matchRatio,
        matchedText: pdfText.substring(charStart, charEnd),
        skippedTokens: skipped,
      };
    }
  }

  return {
    found: false,
    startIndex: -1,
    endIndex: -1,
    confidence: 0,
    matchedText: '',
    skippedTokens: [],
  };
}

function findTokenCharPosition(text: string, tokenIndex: number): number {
  const tokens = text.toLowerCase().split(/\s+/);
  let charPos = 0;
  let currentToken = 0;

  while (charPos < text.length && currentToken < tokenIndex) {
    if (/\s/.test(text[charPos])) {
      charPos++;
    } else {
      while (charPos < text.length && !/\s/.test(text[charPos])) {
        charPos++;
      }
      currentToken++;
    }
  }

  while (charPos < text.length && /\s/.test(text[charPos])) {
    charPos++;
  }

  return charPos;
}

export function stripReferences(text: string): string {
  return text
    .replace(/\[\d+\]/g, '')
    .replace(/\[\w+\s*\d{4}\]/g, '')
    .replace(/\(\d{4}\)/g, '')
    .replace(/\[\w+\s*et\s*al\.?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
