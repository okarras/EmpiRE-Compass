import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';

export type AIProvider = 'openai' | 'groq' | 'mistral';
export type OpenAIModel =
  // Frontier models - OpenAI's most advanced models
  | 'gpt-5.1'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gpt-5-pro'
  | 'gpt-5'
  | 'gpt-4.1'
  // Previous generation models
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'gpt-4o-2024-08-06'
  | 'gpt-4-turbo-2024-04-09'
  | 'o1-preview'
  | 'o1-mini'
  | 'gpt-4'
  | 'gpt-3.5-turbo';
export type GroqModel =
  | 'llama-3.1-8b-instant'
  | 'llama-3.1-70b-versatile'
  | 'llama-3.1-405b-reasoning'
  | 'llama-3.3-70b-versatile'
  | 'openai/gpt-oss-120b'
  | 'openai/gpt-oss-20b'
  | 'whisper-large-v3'
  | 'deepseek-r1-distill-llama-70b'
  | 'llama-3-70b-8192'
  | 'mixtral-8x7b-32768';
export type MistralModel =
  | 'mistral-large-latest'
  | 'mistral-medium-latest'
  | 'mistral-small-latest'
  | 'pixtral-large-latest'
  | 'open-mistral-nemo';

export interface AIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  mistralModel: MistralModel;
  openaiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
}

export interface GenerateTextRequest {
  prompt: string;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemContext?: string;
  // NOTE: API keys from request are IGNORED - backend uses environment keys only
  // This is for security - user API keys should never be sent to backend
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

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  private getApiKey(provider: AIProvider, _userProvidedKey?: string): string {
    // SECURITY: Always ignore user-provided keys - only use environment keys
    // User API keys should never be sent to backend for security reasons
    if (provider === 'openai') {
      return this.config.openaiApiKey;
    } else if (provider === 'groq') {
      return this.config.groqApiKey;
    } else if (provider === 'mistral') {
      return this.config.mistralApiKey;
    }
    return '';
  }

  private createProvider(provider: AIProvider, userProvidedKey?: string) {
    const apiKey = this.getApiKey(provider, userProvidedKey);

    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()} API key is not configured`);
    }

    if (provider === 'openai') {
      return createOpenAI({ apiKey });
    } else if (provider === 'groq') {
      return createGroq({ apiKey });
    } else if (provider === 'mistral') {
      return createMistral({ apiKey });
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
    request: GenerateTextRequest
  ): Promise<GenerateTextResponse> {
    try {
      const targetProvider = request.provider || this.config.provider;
      // SECURITY: Never use API keys from request - always use environment keys
      // This ensures user API keys are never processed by the backend

      // Check if API key is configured
      const apiKey = this.getApiKey(targetProvider);
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error(
          `${targetProvider.toUpperCase()} API key is not configured`
        );
      }

      const model = this.getEnhancedModel(
        targetProvider,
        request.model,
        undefined // Never pass user API keys
      );

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
        provider: request.provider || this.config.provider,
      });

      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`AI generation failed: ${String(error)}`);
    }
  }

  public isConfigured(provider?: AIProvider): boolean {
    const targetProvider = provider || this.config.provider;
    const apiKey = this.getApiKey(targetProvider);
    return !!apiKey && apiKey.length > 0;
  }

  public getCurrentConfig() {
    let model: string;
    if (this.config.provider === 'openai') {
      model = this.config.openaiModel;
    } else if (this.config.provider === 'groq') {
      model = this.config.groqModel;
    } else if (this.config.provider === 'mistral') {
      model = this.config.mistralModel;
    } else {
      model = '';
    }

    return {
      provider: this.config.provider,
      model,
      apiKeyConfigured: this.isConfigured(),
    };
  }
}
