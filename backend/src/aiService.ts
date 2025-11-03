import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';

export type AIProvider = 'openai' | 'groq';
export type OpenAIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';
export type GroqModel =
  | 'deepseek-r1-distill-llama-70b'
  | 'llama-3-70b-8192'
  | 'mixtral-8x7b-32768';

export interface AIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  openaiApiKey: string;
  groqApiKey: string;
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

  private getApiKey(provider: AIProvider, userProvidedKey?: string): string {
    // SECURITY: Always ignore user-provided keys - only use environment keys
    // User API keys should never be sent to backend for security reasons
    return provider === 'openai'
      ? this.config.openaiApiKey
      : this.config.groqApiKey;
  }

  private createProvider(provider: AIProvider, userProvidedKey?: string) {
    const apiKey = this.getApiKey(provider, userProvidedKey);

    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()} API key is not configured`);
    }

    return provider === 'openai'
      ? createOpenAI({ apiKey })
      : createGroq({ apiKey });
  }

  private getModel(
    provider: AIProvider,
    modelName?: string,
    userProvidedKey?: string
  ) {
    const aiProvider = this.createProvider(provider, userProvidedKey);
    const defaultModel =
      provider === 'openai' ? this.config.openaiModel : this.config.groqModel;
    const model = modelName || defaultModel;

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
    const targetProvider = request.provider || this.config.provider;
    // SECURITY: Never use API keys from request - always use environment keys
    // This ensures user API keys are never processed by the backend

    const model = this.getEnhancedModel(
      targetProvider,
      request.model,
      undefined // Never pass user API keys
    );

    const result = await generateText({
      model,
      prompt: request.prompt,
      temperature: request.temperature ?? 0.3,
      // omit maxTokens for SDK v5 typings
      system: request.systemContext,
    });

    const reasoningVal = (result as any).reasoning;
    const normalizedReasoning = Array.isArray(reasoningVal)
      ? JSON.stringify(reasoningVal)
      : typeof reasoningVal === 'string'
        ? reasoningVal
        : undefined;

    const normalizedText = (result.text || '').trim();

    return {
      text: normalizedText !== '' ? normalizedText : normalizedReasoning || '',
      reasoning: normalizedReasoning,
      usage: result.usage,
    };
  }

  public isConfigured(provider?: AIProvider): boolean {
    const targetProvider = provider || this.config.provider;
    const apiKey = this.getApiKey(targetProvider);
    return !!apiKey && apiKey.length > 0;
  }

  public getCurrentConfig() {
    return {
      provider: this.config.provider,
      model:
        this.config.provider === 'openai'
          ? this.config.openaiModel
          : this.config.groqModel,
      apiKeyConfigured: this.isConfigured(),
    };
  }
}
