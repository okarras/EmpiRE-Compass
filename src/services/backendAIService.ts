import type {
  AIProvider,
  OpenAIModel,
  GroqModel,
} from '../store/slices/aiSlice';

export interface BackendAIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  useEnvironmentKeys: boolean;
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
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
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
    request: GenerateTextRequest
  ): Promise<GenerateTextResponse> {
    return this.makeRequest<GenerateTextResponse>('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
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
  return new BackendAIService({
    provider: 'groq',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'deepseek-r1-distill-llama-70b',
    useEnvironmentKeys: true,
  });
};

// for components that dont use hooks
export const createDefaultBackendAIService = () => {
  return new BackendAIService({
    provider: 'openai',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'deepseek-r1-distill-llama-70b',
    useEnvironmentKeys: true,
  });
};
