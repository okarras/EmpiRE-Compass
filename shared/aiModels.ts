/** Shared AI provider and model types used by frontend and backend. */

export const OPENAI_MODELS = [
  'gpt-5.1',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5-pro',
  'gpt-5',
  'gpt-4.1',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4o-2024-08-06',
  'gpt-4-turbo-2024-04-09',
  'o1-preview',
  'o1-mini',
  'gpt-4',
  'gpt-3.5-turbo',
] as const;

export const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'llama-3.1-405b-reasoning',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
] as const;

export const MISTRAL_MODELS = [
  'mistral-large-latest',
  'mistral-medium-latest',
  'mistral-small-latest',
  'pixtral-large-latest',
  'open-mistral-nemo',
] as const;

export const GOOGLE_MODELS = [
  'gemini-3-pro-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemma-3-27b-it',
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];
export type GroqModel = (typeof GROQ_MODELS)[number];
export type MistralModel = (typeof MISTRAL_MODELS)[number];
export type GoogleModel = (typeof GOOGLE_MODELS)[number];

export type AIProvider =
  | 'openai'
  | 'groq'
  | 'mistral'
  | 'google'
  | 'openrouter';
