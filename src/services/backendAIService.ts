import type {
  AIProvider,
  OpenAIModel,
  GroqModel,
} from '../store/slices/aiSlice';
import { useAppSelector } from '../store/hooks';

export interface BackendAIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  useEnvironmentKeys: boolean;
  openaiApiKey?: string;
  groqApiKey?: string;
}

export interface GenerateTextRequest {
  prompt: string;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemContext?: string;
  // Optional: User-provided API keys (sent securely to backend, never exposed)
  openaiApiKey?: string;
  groqApiKey?: string;
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

export interface AIConfigResponse {
  provider: AIProvider;
  model: string;
  apiKeyConfigured: boolean;
}

export class BackendAIService {
  private baseUrl: string;
  private config: BackendAIConfig;

  constructor(config: BackendAIConfig) {
    this.config = config;
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  public async generateText(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      provider?: AIProvider;
      systemContext?: string;
    }
  ): Promise<{ text: string; reasoning?: string }> {
    const request: GenerateTextRequest = {
      prompt,
      provider: options?.provider || this.config.provider,
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens ?? 2000,
      systemContext: options?.systemContext,
      // Include API keys if provided (user's own keys)
      // Backend will use these if provided, otherwise fall back to environment variables
      openaiApiKey: this.config.openaiApiKey || undefined,
      groqApiKey: this.config.groqApiKey || undefined,
    };

    const response = await this.makeRequest<GenerateTextResponse>(
      '/api/ai/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    // Return in the format expected by frontend components
    return {
      text: response.text,
      reasoning: response.reasoning,
    };
  }

  public async getConfiguration(): Promise<AIConfigResponse> {
    return this.makeRequest<AIConfigResponse>('/api/ai/config');
  }

  public async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    aiConfigured: boolean;
  }> {
    return this.makeRequest<{
      status: string;
      timestamp: string;
      aiConfigured: boolean;
    }>('/api/health');
  }

  public isConfigured(): boolean {
    // for backend service, assume its configured if we can reach backend
    // actual config is handled in backend
    return true;
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

// get backend service hook
export const useBackendAIService = () => {
  // Get provider/model and API keys from Redux store
  // API keys are stored in frontend state but sent securely to backend
  const aiConfig = useAppSelector((state) => state.ai);

  return new BackendAIService({
    provider: aiConfig.provider || 'groq',
    openaiModel: aiConfig.openaiModel || 'gpt-4o-mini',
    groqModel: aiConfig.groqModel || 'deepseek-r1-distill-llama-70b',
    useEnvironmentKeys: aiConfig.useEnvironmentKeys || false,
    // Include API keys from store - they'll be sent to backend securely
    openaiApiKey: aiConfig.openaiApiKey || '',
    groqApiKey: aiConfig.groqApiKey || '',
  });
};

// Alias for compatibility - use this instead of useAIService
export const useAIService = useBackendAIService;

// for components that dont use hooks
export const createDefaultBackendAIService = () => {
  return new BackendAIService({
    provider: 'openai',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'deepseek-r1-distill-llama-70b',
    useEnvironmentKeys: true,
  });
};
