/**
 * Convert Markdown links [text](url) to HTML anchor tags so they render as clickable links.
 */
export function markdownLinksToHtml(text: string): string {
  return text.replace(
    /\[([^\]]+)\]\((https?[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

/**
 * Strip prompt-leak patterns that ORKG Ask sometimes echoes in responses.
 * Removes meta-instructions and formatting guidelines that leak from the model's context.
 */
export function stripPromptLeaks(text: string): string {
  let cleaned = text;

  // Remove common leaked instruction patterns (case-insensitive)
  const leakPatterns = [
    /\d+\.\s*Ensure that your response[^.]*\./gi,
    /\d+\.\s*Use appropriate visuals[^.]*\./gi,
    /\d+\.\s*Cite relevant sources[^.]*\./gi,
    /\d+\.\s*Write in the third person\.?/gi,
    /\d+\.\s*Maintain an objective and analytical tone[^.]*\./gi,
    /Ensure that your response is clear and easy to read\.?/gi,
    /Use appropriate visuals \(charts, diagrams, images, etc\.\)[^.]*\./gi,
    /Cite relevant sources when appropriate\.?/gi,
    /Write in the third person\.?/gi,
    /Maintain an objective and analytical tone throughout your response\.?/gi,
    // Orphaned fragments at start of response (e.g. ", rather than X. 8. Y")
    /^[,\s]*(?:rather than generic or vague statements\.?\s*)(?:\d+\.\s*)?(?:Maintain an objective and analytical tone[^.]*\.\s*)/gim,
    /^[,\s]*\d+\.\s*Maintain an objective and analytical tone[^.]*\.\s*/gim,
    // Section headers echoed as plain text (often before real content)
    /\bPotential insights:\s*(?=\n)/gi,
    /\bLimitations and Considerations:\s*(?=\n)/gi,
  ];

  for (const pattern of leakPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Normalize leftover whitespace
  return cleaned.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
}

/** Strip markdown code fences, prompt leaks, and convert markdown links to HTML. */
export function cleanAiHtmlResponse(text: string): string {
  return markdownLinksToHtml(
    stripPromptLeaks(
      text
        .replace(/```html\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim()
    )
  );
}
