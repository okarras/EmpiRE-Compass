/**
 * Cost calculator for AI model usage
 * Pricing per 1M tokens (as of 2025)
 * Prices are in USD
 */

import type {
  AIProvider,
  OpenAIModel,
  GroqModel,
  MistralModel,
  GoogleModel,
} from '../store/slices/aiSlice';

// OpenAI pricing per 1M tokens (input/output)
// Pricing based on https://openai.com/api/pricing/ (as of 2025)
const OPENAI_PRICING: Record<OpenAIModel, { input: number; output: number }> = {
  // Frontier models - GPT-5 series
  'gpt-5': { input: 1.25, output: 10.0 },
  'gpt-5-mini': { input: 0.25, output: 2.0 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-5-pro': { input: 15.0, output: 120.0 },
  'gpt-5.1': { input: 1.25, output: 10.0 }, // Same as GPT-5 base model

  // GPT-4.1 series (verified pricing)
  'gpt-4.1': { input: 3.0, output: 12.0 },

  // Previous generation - GPT-4o series
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o-2024-08-06': { input: 2.5, output: 10.0 },

  // GPT-4 Turbo series
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4-turbo-2024-04-09': { input: 10.0, output: 30.0 },

  // O1 reasoning models (verified pricing)
  'o1-preview': { input: 15.0, output: 60.0 },
  'o1-mini': { input: 1.1, output: 4.4 },

  // Legacy models
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
};

// Groq pricing per 1M tokens
// Pricing based on https://console.groq.com/docs/models and https://groq.com/pricing (as of 2025)
const GROQ_PRICING: Partial<
  Record<GroqModel, { input: number; output: number }>
> = {
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama-3.1-70b-versatile': { input: 0.0, output: 0.0 }, // Not listed in production/preview models - may be deprecated
  'llama-3.1-405b-reasoning': { input: 0.0, output: 0.0 }, // Not listed in production/preview models - may be deprecated
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'openai/gpt-oss-120b': { input: 0.15, output: 0.6 },
  'openai/gpt-oss-20b': { input: 0.075, output: 0.3 },
};

// Mistral pricing per 1M tokens
// Pricing based on https://mistral.ai/pricing#api-pricing (as of 2025)
const MISTRAL_PRICING: Record<MistralModel, { input: number; output: number }> =
  {
    'mistral-large-latest': { input: 2.7, output: 8.1 },
    'mistral-medium-latest': { input: 2.7, output: 8.1 },
    'mistral-small-latest': { input: 0.2, output: 0.6 },
    'pixtral-large-latest': { input: 2.7, output: 8.1 },
    'open-mistral-nemo': { input: 0.0, output: 0.0 }, // Free/open model
  };

// Google/Gemini pricing per 1M tokens
// Pricing based on https://ai.google.dev/gemini-api/docs/pricing (as of 2025)
// Using base tier pricing (up to 200k tokens for Pro models, 128k for Flash models)
const GOOGLE_PRICING: Record<GoogleModel, { input: number; output: number }> = {
  // Gemini 3 series
  'gemini-3-pro-preview': { input: 2.0, output: 12.0 },
  // Gemini 2.5 series
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash': { input: 0.1, output: 0.4 },
  // Gemini 2.0 series
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-2.0-flash-exp': { input: 0.1, output: 0.4 },
  'gemini-2.0-flash-lite': { input: 0.019, output: 0.019 },
  // Gemini 1.5 series
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  'gemini-1.5-flash-8b': { input: 0.075, output: 0.3 },
  // Other models
  'gemma-3-27b-it': { input: 0.0, output: 0.0 }, // Pricing TBD
};

export interface CostBreakdown {
  model: string;
  provider: AIProvider;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  section?: string; // Optional label for which section this cost is for (e.g., "Query Generation", "Chart Generation")
}

/**
 * Calculate cost for a single API call
 */
export function calculateCost(
  provider: AIProvider,
  model: string,
  promptTokens: number,
  completionTokens: number
): CostBreakdown {
  let pricing: { input: number; output: number };

  switch (provider) {
    case 'openai':
      pricing = OPENAI_PRICING[model as OpenAIModel] || { input: 0, output: 0 };
      break;
    case 'groq':
      pricing = GROQ_PRICING[model as GroqModel] || { input: 0, output: 0 };
      break;
    case 'mistral':
      pricing = MISTRAL_PRICING[model as MistralModel] || {
        input: 0,
        output: 0,
      };
      break;
    case 'google':
      pricing = GOOGLE_PRICING[model as GoogleModel] || {
        input: 0,
        output: 0,
      };
      break;
    default:
      pricing = { input: 0, output: 0 };
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    model,
    provider,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    inputCost,
    outputCost,
    totalCost,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return '<$0.0001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(4)}`;
}

/**
 * Aggregate multiple cost breakdowns
 */
export function aggregateCosts(costs: CostBreakdown[]): CostBreakdown {
  const total = costs.reduce(
    (acc, cost) => ({
      promptTokens: acc.promptTokens + cost.promptTokens,
      completionTokens: acc.completionTokens + cost.completionTokens,
      inputCost: acc.inputCost + cost.inputCost,
      outputCost: acc.outputCost + cost.outputCost,
      totalCost: acc.totalCost + cost.totalCost,
    }),
    {
      promptTokens: 0,
      completionTokens: 0,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
    }
  );

  return {
    model: 'Multiple',
    provider: costs[0]?.provider || 'openai',
    promptTokens: total.promptTokens,
    completionTokens: total.completionTokens,
    totalTokens: total.promptTokens + total.completionTokens,
    inputCost: total.inputCost,
    outputCost: total.outputCost,
    totalCost: total.totalCost,
  };
}
