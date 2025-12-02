/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';
import { useAppSelector } from '../store/hooks';
import type {
  AIProvider,
  OpenAIModel,
  GroqModel,
  MistralModel,
} from '../store/slices/aiSlice';

export interface AIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  mistralModel: MistralModel;
  openaiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  useEnvironmentKeys: boolean;
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  private getApiKey(provider: AIProvider): string {
    if (this.config.useEnvironmentKeys) {
      if (provider === 'openai') {
        return import.meta.env.VITE_OPEN_AI_API_KEY || '';
      } else if (provider === 'groq') {
        return import.meta.env.VITE_GROQ_API_KEY || '';
      } else if (provider === 'mistral') {
        return import.meta.env.VITE_MISTRAL_API_KEY || '';
      }
    }
    if (provider === 'openai') {
      return this.config.openaiApiKey;
    } else if (provider === 'groq') {
      return this.config.groqApiKey;
    } else if (provider === 'mistral') {
      return this.config.mistralApiKey;
    }
    return '';
  }

  private createProvider(provider: AIProvider) {
    const apiKey = this.getApiKey(provider);

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

  private getModel(provider: AIProvider) {
    const aiProvider = this.createProvider(provider);
    let modelName: string;
    if (provider === 'openai') {
      modelName = this.config.openaiModel;
    } else if (provider === 'groq') {
      modelName = this.config.groqModel;
    } else if (provider === 'mistral') {
      modelName = this.config.mistralModel;
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

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

// Hook to get AI service instance
export const useAIService = () => {
  const aiConfig = useAppSelector((state) => state.ai);

  // Ensure we have valid configuration
  const config: AIConfig = {
    provider: aiConfig.provider || 'mistral',
    openaiModel: aiConfig.openaiModel || 'gpt-5-nano',
    groqModel: aiConfig.groqModel || 'llama-3.1-8b-instant',
    mistralModel: aiConfig.mistralModel || 'mistral-large-latest',
    openaiApiKey: aiConfig.openaiApiKey || '',
    groqApiKey: aiConfig.groqApiKey || '',
    mistralApiKey: aiConfig.mistralApiKey || '',
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
    provider: 'mistral',
    openaiModel: 'gpt-5-nano',
    groqModel: 'llama-3.1-8b-instant',
    mistralModel: 'mistral-large-latest',
    openaiApiKey: '',
    groqApiKey: '',
    mistralApiKey: '',
    useEnvironmentKeys: true,
  });
};
