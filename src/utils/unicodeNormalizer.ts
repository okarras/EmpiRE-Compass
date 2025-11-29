/**
 * Unicode Normalization for PDF Text Matching
 * Handles special characters that look the same but have different Unicode values
 */

const UNICODE_REPLACEMENTS: Record<string, string> = {
  // Various forms of 'a'
  '\u0061': 'a', // Latin Small Letter A (standard)
  '\u00E0': 'a', // à (a with grave)
  '\u00E1': 'a', // á (a with acute)
  '\u00E2': 'a', // â (a with circumflex)
  '\u00E3': 'a', // ã (a with tilde)
  '\u00E4': 'a', // ä (a with diaeresis)
  '\u00E5': 'a', // å (a with ring above)
  '\u0101': 'a', // ā (a with macron)
  '\u0103': 'a', // ă (a with breve)
  '\u0105': 'a', // ą (a with ogonek)
  '\u01CE': 'a', // ǎ (a with caron)
  '\u01DF': 'a', // ǟ (a with diaeresis and macron)
  '\u01E1': 'a', // ǡ (a with dot above and macron)
  '\u01FB': 'a', // ǻ (a with ring above and acute)
  '\u0201': 'a', // ȁ (a with double grave)
  '\u0203': 'a', // ȃ (a with inverted breve)
  '\u0227': 'a', // ȧ (a with dot above)
  '\u1E01': 'a', // ạ (a with ring below)
  '\u1EA1': 'a', // ạ (a with dot below)
  '\uFF41': 'a', // ａ (fullwidth Latin small letter a)

  // Ligatures
  '\uFB00': 'ff', // ﬀ (ff ligature)
  '\uFB01': 'fi', // ﬁ (fi ligature)
  '\uFB02': 'fl', // ﬂ (fl ligature)
  '\uFB03': 'ffi', // ﬃ (ffi ligature)
  '\uFB04': 'ffl', // ﬄ (ffl ligature)
  '\uFB05': 'ft', // ﬅ (long s t ligature)
  '\uFB06': 'st', // ﬆ (st ligature)

  // Quotes
  '\u2018': "'", // ' (left single quotation mark)
  '\u2019': "'", // ' (right single quotation mark)
  '\u201A': "'", // ‚ (single low-9 quotation mark)
  '\u201B': "'", // ‛ (single high-reversed-9 quotation mark)
  '\u201C': '"', // " (left double quotation mark)
  '\u201D': '"', // " (right double quotation mark)
  '\u201E': '"', // „ (double low-9 quotation mark)
  '\u201F': '"', // ‟ (double high-reversed-9 quotation mark)
  '\u2032': "'", // ′ (prime)
  '\u2033': '"', // ″ (double prime)

  // Dashes and hyphens
  '\u2010': '-', // ‐ (hyphen)
  '\u2011': '-', // ‑ (non-breaking hyphen)
  '\u2012': '-', // ‒ (figure dash)
  '\u2013': '-', // – (en dash)
  '\u2014': '-', // — (em dash)
  '\u2015': '-', // ― (horizontal bar)
  '\u2212': '-', // − (minus sign)

  // Spaces
  '\u00A0': ' ', // non-breaking space
  '\u2000': ' ', // en quad
  '\u2001': ' ', // em quad
  '\u2002': ' ', // en space
  '\u2003': ' ', // em space
  '\u2004': ' ', // three-per-em space
  '\u2005': ' ', // four-per-em space
  '\u2006': ' ', // six-per-em space
  '\u2007': ' ', // figure space
  '\u2008': ' ', // punctuation space
  '\u2009': ' ', // thin space
  '\u200A': ' ', // hair space
  '\u202F': ' ', // narrow no-break space
  '\u205F': ' ', // medium mathematical space
  '\u3000': ' ', // ideographic space

  // Other common characters
  '\u2026': '...', // … (horizontal ellipsis)
  '\u00B7': '.', // · (middle dot)
  '\u2022': '*', // • (bullet)
  '\u2024': '.', // ․ (one dot leader)
  '\u2025': '..', // ‥ (two dot leader)
};

/**
 * Normalize Unicode characters to their ASCII equivalents
 */
export function normalizeUnicode(text: string): string {
  let normalized = text;

  // Replace known problematic characters
  for (const [unicode, ascii] of Object.entries(UNICODE_REPLACEMENTS)) {
    normalized = normalized.replace(new RegExp(unicode, 'g'), ascii);
  }

  // Apply Unicode normalization (NFD = decompose, then remove combining marks)
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Convert to lowercase for case-insensitive matching
  normalized = normalized.toLowerCase();

  return normalized;
}

// removes all non-ASCII characters
export function aggressiveUnicodeNormalize(text: string): string {
  return normalizeUnicode(text)
    .replace(/[^\x00-\x7F]/g, '') // Remove all non-ASCII
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function debugUnicode(text: string): void {
  console.log('=== Unicode Debug ===');
  console.log('Text:', text);
  console.log('Length:', text.length);
  console.log('Characters:');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    const hex = code.toString(16).toUpperCase().padStart(4, '0');
    const name = getCharacterName(code);

    console.log(`  [${i}] "${char}" → U+${hex} (${code}) - ${name}`);
  }

  console.log('Normalized:', normalizeUnicode(text));
  console.log('===================');
}

function getCharacterName(code: number): string {
  if (code >= 0x0020 && code <= 0x007e) return 'ASCII';
  if (code >= 0x00a0 && code <= 0x00ff) return 'Latin-1 Supplement';
  if (code >= 0x0100 && code <= 0x017f) return 'Latin Extended-A';
  if (code >= 0x0180 && code <= 0x024f) return 'Latin Extended-B';
  if (code >= 0x2000 && code <= 0x206f) return 'General Punctuation';
  if (code >= 0x2070 && code <= 0x209f) return 'Superscripts/Subscripts';
  if (code >= 0x20a0 && code <= 0x20cf) return 'Currency Symbols';
  if (code >= 0xfb00 && code <= 0xfb4f) return 'Alphabetic Presentation Forms';
  if (code >= 0xff00 && code <= 0xffef) return 'Halfwidth/Fullwidth Forms';
  return 'Other Unicode';
}

export function unicodeEquals(str1: string, str2: string): boolean {
  return normalizeUnicode(str1) === normalizeUnicode(str2);
}

export function unicodeFindIndex(haystack: string, needle: string): number {
  const normalizedHaystack = normalizeUnicode(haystack);
  const normalizedNeedle = normalizeUnicode(needle);

  return normalizedHaystack.indexOf(normalizedNeedle);
}

export function unicodeIncludes(haystack: string, needle: string): boolean {
  return unicodeFindIndex(haystack, needle) !== -1;
}
