import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type {
  AIProvider,
  OpenAIModel,
  GroqModel,
  MistralModel,
  GoogleModel,
} from '../../shared/aiModels.js';

export type {
  AIProvider,
  OpenAIModel,
  GroqModel,
  MistralModel,
  GoogleModel,
} from '../../shared/aiModels.js';

export interface AIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  mistralModel: MistralModel;
  googleModel: GoogleModel;
  /** Default OpenRouter model id when request omits `model` */
  openrouterModel: string;
  openaiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  googleApiKey: string;
}

export interface GenerateTextRequest {
  prompt: string;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemContext?: string;
}

export interface GenerateTextResponse {
  text: string;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** OpenRouter keys use the sk-or-v1- prefix; OPENAI_API_KEY may hold one when using OpenRouter. */
export const isOpenRouterApiKey = (apiKey: string): boolean =>
  apiKey.trim().startsWith('sk-or-');

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /** OPENAI_API_KEY holds the OpenRouter key when provider is openrouter */
  public resolveOpenRouterApiKey(headerKey?: string): string {
    const fromHeader = headerKey?.trim() || '';
    if (fromHeader) return fromHeader;
    return this.config.openaiApiKey.trim();
  }

  /**
   * Route OpenRouter keys to OpenRouter even when AI_PROVIDER is mis-set to openai.
   * Personal keys may arrive only via x-openrouter-api-key.
   */
  public getEffectiveProvider(
    requested?: AIProvider,
    openRouterApiKey?: string
  ): AIProvider {
    const configured = requested ?? this.config.provider;
    if (configured === 'openrouter') {
      return 'openrouter';
    }
    const headerOrEnvKey = this.resolveOpenRouterApiKey(openRouterApiKey);
    if (isOpenRouterApiKey(headerOrEnvKey)) {
      return 'openrouter';
    }
    return configured;
  }

  private resolveOpenRouterModelId(requestModel?: string): string {
    const sanitized = requestModel ? this.sanitizeModelName(requestModel) : '';
    if (sanitized.includes('/')) {
      return sanitized;
    }
    return this.sanitizeModelName(this.config.openrouterModel);
  }

  private getApiKey(provider: AIProvider, _userProvidedKey?: string): string {
    if (provider === 'openrouter') {
      return this.config.openaiApiKey;
    }
    if (provider === 'openai') {
      return this.config.openaiApiKey;
    } else if (provider === 'groq') {
      return this.config.groqApiKey;
    } else if (provider === 'mistral') {
      return this.config.mistralApiKey;
    } else if (provider === 'google') {
      return this.config.googleApiKey;
    }
    return '';
  }

  private getOpenRouterHeaders(): Record<string, string> {
    const refererRaw =
      process.env.OPENROUTER_HTTP_REFERER || process.env.FRONTEND_URL || '';
    const referer =
      refererRaw.trim().replace(/^["']|["']$/g, '') ||
      'https://empire-compass.tib.eu';
    const title = (process.env.OPENROUTER_APP_TITLE || 'EmpiRE Compass').trim();
    return {
      'HTTP-Referer': referer,
      'X-Title': title,
    };
  }

  private createProvider(provider: AIProvider, userProvidedKey?: string) {
    const apiKey = this.getApiKey(provider, userProvidedKey);

    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()} API key is not configured`);
    }

    if (provider === 'openrouter') {
      throw new Error('OpenRouter uses a per-request API key from headers');
    }
    if (provider === 'openai') {
      return createOpenAI({ apiKey });
    } else if (provider === 'groq') {
      return createGroq({ apiKey });
    } else if (provider === 'mistral') {
      return createMistral({ apiKey });
    } else if (provider === 'google') {
      return createGoogleGenerativeAI({ apiKey });
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  private sanitizeModelName(modelName: string): string {
    // Remove surrounding quotes if present
    return modelName.trim().replace(/^["']|["']$/g, '');
  }

  private getModel(
    provider: AIProvider,
    modelName?: string,
    userProvidedKey?: string
  ) {
    const aiProvider = this.createProvider(provider, userProvidedKey);
    let defaultModel: string;
    if (provider === 'openai') {
      defaultModel = this.config.openaiModel;
    } else if (provider === 'groq') {
      defaultModel = this.config.groqModel;
    } else if (provider === 'mistral') {
      defaultModel = this.config.mistralModel;
    } else if (provider === 'google') {
      defaultModel = this.config.googleModel;
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    const rawModel = modelName || defaultModel;

    // Sanitize model name to remove any quotes
    const model = this.sanitizeModelName(rawModel);

    return aiProvider.languageModel(model);
  }

  public getEnhancedModel(
    provider?: AIProvider,
    modelName?: string,
    userProvidedKey?: string
  ) {
    const targetProvider = provider || this.config.provider;
    // Return base model directly; compatible with SDK v5 providers
    return this.getModel(targetProvider, modelName, userProvidedKey) as any;
  }

  public async generateText(
    request: GenerateTextRequest,
    options?: { openRouterApiKey?: string }
  ): Promise<GenerateTextResponse> {
    try {
      const targetProvider = this.getEffectiveProvider(
        request.provider,
        options?.openRouterApiKey
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let model: any;

      if (targetProvider === 'openrouter') {
        const orKey = this.resolveOpenRouterApiKey(options?.openRouterApiKey);
        if (!orKey) {
          throw new Error('OpenRouter API key is required');
        }
        const openrouter = createOpenAI({
          apiKey: orKey,
          baseURL: 'https://openrouter.ai/api/v1',
          headers: this.getOpenRouterHeaders(),
        });
        const modelId = this.resolveOpenRouterModelId(request.model);
        model = openrouter.languageModel(modelId);
      } else {
        const apiKey = this.getApiKey(targetProvider);
        if (!apiKey || apiKey.trim().length === 0) {
          throw new Error(
            `${targetProvider.toUpperCase()} API key is not configured`
          );
        }

        model = this.getEnhancedModel(targetProvider, request.model, undefined);
      }

      const generateOptions: {
        model: any;
        prompt: string;
        temperature?: number;
        maxTokens?: number;
        system?: string;
      } = {
        model,
        prompt: request.prompt,
        temperature: request.temperature ?? 0.3,
        system: request.systemContext,
      };

      // Only include maxTokens if it's provided and valid
      if (request.maxTokens && request.maxTokens > 0) {
        generateOptions.maxTokens = request.maxTokens;
      }

      const result = await generateText(generateOptions);

      // Handle different response formats safely
      if (!result) {
        throw new Error('AI service returned empty result');
      }

      // Normalize text response
      let normalizedText = '';
      if (result.text) {
        normalizedText =
          typeof result.text === 'string' ? result.text : String(result.text);
      }

      // Handle reasoning
      const reasoningVal = (result as any).reasoning;
      let normalizedReasoning: string | undefined = undefined;

      if (reasoningVal !== undefined && reasoningVal !== null) {
        if (Array.isArray(reasoningVal)) {
          normalizedReasoning = JSON.stringify(reasoningVal);
        } else if (typeof reasoningVal === 'string') {
          normalizedReasoning = reasoningVal;
        } else {
          normalizedReasoning = String(reasoningVal);
        }
      }

      // Use reasoning as fallback if text is empty
      const finalText = normalizedText.trim() || normalizedReasoning || '';

      // Extract usage information - check multiple possible locations
      // Type the usage as any to access properties that may vary by provider
      let usage:
        | {
            promptTokens?: number;
            completionTokens?: number;
            inputTokens?: number;
            outputTokens?: number;
            totalTokens?: number;
          }
        | undefined = result.usage as any;

      if (!usage && (result as any).response) {
        usage = (result as any).response.usage;
      }
      if (!usage && (result as any).usageMetadata) {
        usage = (result as any).usageMetadata;
      }

      // Log usage for debugging (only in development)
      if (process.env.NODE_ENV !== 'production' && usage) {
        console.log('AI Service Usage:', JSON.stringify(usage, null, 2));
      }

      // Normalize usage to our expected format
      const normalizedUsage = usage
        ? {
            promptTokens: usage.promptTokens ?? usage.inputTokens ?? 0,
            completionTokens: usage.completionTokens ?? usage.outputTokens ?? 0,
            totalTokens:
              usage.totalTokens ??
              (usage.promptTokens ?? usage.inputTokens ?? 0) +
                (usage.completionTokens ?? usage.outputTokens ?? 0),
          }
        : undefined;

      return {
        text: finalText,
        reasoning: normalizedReasoning,
        usage: normalizedUsage,
      };
    } catch (error) {
      // Enhanced error logging
      console.error('Error in generateText:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        provider: this.getEffectiveProvider(request.provider),
      });

      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`AI generation failed: ${String(error)}`);
    }
  }

  public isConfigured(provider?: AIProvider): boolean {
    const targetProvider = this.getEffectiveProvider(provider);
    if (targetProvider === 'openrouter') {
      return this.resolveOpenRouterApiKey().length > 0;
    }
    const apiKey = this.getApiKey(targetProvider);
    return !!apiKey && apiKey.length > 0;
  }

  public getCurrentConfig() {
    const provider = this.getEffectiveProvider();
    let model: string;
    if (provider === 'openai') {
      model = this.config.openaiModel;
    } else if (provider === 'groq') {
      model = this.config.groqModel;
    } else if (provider === 'mistral') {
      model = this.config.mistralModel;
    } else if (provider === 'google') {
      model = this.config.googleModel;
    } else if (provider === 'openrouter') {
      model = this.config.openrouterModel;
    } else {
      model = '';
    }

    return {
      provider,
      model,
      apiKeyConfigured: this.isConfigured(),
    };
  }
}
