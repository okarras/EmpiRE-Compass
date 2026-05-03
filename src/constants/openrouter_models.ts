/**
 * OpenRouter model id is any string returned by OpenRouter’s catalog (e.g. openai/gpt-4o-mini).
 * The live list is loaded at runtime from GET /api/ai/openrouter-models.
 */
export type OpenRouterModel = string;

export const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4o-mini';
