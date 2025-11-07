/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { useAppSelector } from '../store/hooks';
import type {
  AIProvider,
  OpenAIModel,
  GroqModel,
} from '../store/slices/aiSlice';

export interface AIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  openaiApiKey: string;
  groqApiKey: string;
  useEnvironmentKeys: boolean;
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  private getApiKey(provider: AIProvider): string {
    if (this.config.useEnvironmentKeys) {
      return provider === 'openai'
        ? import.meta.env.VITE_OPEN_AI_API_KEY || ''
        : import.meta.env.VITE_GROQ_API_KEY || '';
    }
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

  private getModel(provider: AIProvider) {
    const aiProvider = this.createProvider(provider);
    const modelName =
      provider === 'openai' ? this.config.openaiModel : this.config.groqModel;

    return aiProvider.languageModel(modelName);
  }

  public getEnhancedModel(provider?: AIProvider) {
    const targetProvider = provider || this.config.provider;
    // Return the provider model directly; cast to satisfy SDK typings
    return this.getModel(targetProvider) as unknown as any;
  }

  public async generateText(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      provider?: AIProvider;
      systemContext?: string;
    }
  ) {
    const targetProvider = options?.provider || this.config.provider;
    const model = this.getEnhancedModel(targetProvider);

    const result = await generateText({
      model,
      prompt,
      system: options?.systemContext,
      temperature: options?.temperature ?? 0.3,
      // omit maxTokens to match SDK typings
    });

    // Normalize text to string (handle different response formats)
    const normalizedText =
      typeof result.text === 'string'
        ? result.text
        : result.text
          ? String(result.text)
          : '';

    // Normalize reasoning to string for downstream types
    const reasoningVal = (result as any).reasoning;
    const normalizedReasoning =
      typeof reasoningVal === 'string'
        ? reasoningVal
        : Array.isArray(reasoningVal)
          ? JSON.stringify(reasoningVal)
          : undefined;

    return {
      text: normalizedText,
      reasoning: normalizedReasoning,
      usage: result.usage,
    };
  }

  public isConfigured(): boolean {
    const apiKey = this.getApiKey(this.config.provider);
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

// Hook to get AI service instance
export const useAIService = () => {
  const aiConfig = useAppSelector((state) => state.ai);

  // Ensure we have valid configuration
  const config: AIConfig = {
    provider: aiConfig.provider || 'openai',
    openaiModel: aiConfig.openaiModel || 'gpt-4o-mini',
    groqModel: aiConfig.groqModel || 'deepseek-r1-distill-llama-70b',
    openaiApiKey: aiConfig.openaiApiKey || '',
    groqApiKey: aiConfig.groqApiKey || '',
    useEnvironmentKeys:
      aiConfig.useEnvironmentKeys !== undefined
        ? aiConfig.useEnvironmentKeys
        : true,
  };

  return new AIService(config);
};

// Default AI service for components that don't use hooks
export const createDefaultAIService = () => {
  return new AIService({
    provider: 'openai',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'deepseek-r1-distill-llama-70b',
    openaiApiKey: '',
    groqApiKey: '',
    useEnvironmentKeys: true,
  });
};
