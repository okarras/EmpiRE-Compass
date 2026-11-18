/** Visible text from an AI SDK generateText result. */

export interface GeneratedAiPayload {
  text?: unknown;
  content?: unknown;
  reasoning?: unknown;
  reasoningText?: unknown;
}

export interface GeneratedAiText {
  text: string;
  reasoning?: string;
}

function partText(part: unknown): string {
  if (typeof part === 'string') return part.trim();
  if (!part || typeof part !== 'object' || !('text' in part)) return '';
  const text = (part as { text?: unknown }).text;
  return typeof text === 'string' ? text.trim() : '';
}

function textsOfType(value: unknown, type: string): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (part) =>
        !!part &&
        typeof part === 'object' &&
        (part as { type?: unknown }).type === type
    )
    .map(partText)
    .filter(Boolean);
}

/** True when a string is a serialized reasoning-part array, not an answer. */
export function isReasoningDump(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return false;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return (
      Array.isArray(parsed) &&
      parsed.some(
        (part) =>
          !!part &&
          typeof part === 'object' &&
          (part as { type?: unknown }).type === 'reasoning'
      )
    );
  } catch {
    return false;
  }
}

function readable(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed && !isReasoningDump(trimmed) ? trimmed : '';
}

/**
 * Pull the answer out of a generateText result.
 * Reasoning-model payloads often include an empty reasoning part; that JSON
 * must not be shown in place of the answer.
 */
export function readGeneratedText(result: GeneratedAiPayload): GeneratedAiText {
  const fromField = readable(result.text);
  const fromContent = textsOfType(result.content, 'text').join('\n').trim();
  const fromReasoningParts = textsOfType(result.reasoning, 'reasoning');
  const reasoning =
    readable(result.reasoningText) ||
    (typeof result.reasoning === 'string' ? readable(result.reasoning) : '') ||
    fromReasoningParts.join('\n\n') ||
    undefined;

  return {
    text: fromField || fromContent || reasoning || '',
    reasoning,
  };
}
