import {
  generateText,
  wrapLanguageModel,
  extractReasoningMiddleware,
} from 'ai';
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

  private getApiKey(provider: AIProvider): string {
    return provider === 'openai'
      ? this.config.openaiApiKey
      : this.config.groqApiKey;
  }

  private createProvider(provider: AIProvider) {
    const apiKey = this.getApiKey(provider);

    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()} API key is not configured`);
    }

    return provider === 'openai'
      ? createOpenAI({ apiKey })
      : createGroq({ apiKey });
  }

  private getModel(provider: AIProvider, modelName?: string) {
    const aiProvider = this.createProvider(provider);
    const defaultModel =
      provider === 'openai' ? this.config.openaiModel : this.config.groqModel;
    const model = modelName || defaultModel;

    return aiProvider.languageModel(model);
  }

  public getEnhancedModel(provider?: AIProvider, modelName?: string) {
    const targetProvider = provider || this.config.provider;
    const baseModel = this.getModel(targetProvider, modelName);

    // Add reasoning middleware for better AI responses
    return wrapLanguageModel({
      model: baseModel,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  public async generateText(
    request: GenerateTextRequest
  ): Promise<GenerateTextResponse> {
    const targetProvider = request.provider || this.config.provider;
    const model = this.getEnhancedModel(targetProvider, request.model);

    const result = await generateText({
      model,
      prompt: request.prompt,
      temperature: request.temperature ?? 0.3,
      maxTokens: request.maxTokens ?? 2000,
      system: request.systemContext,
    });

    return {
      text: result.text,
      reasoning: result.reasoning,
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
