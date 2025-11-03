import type {
  AIProvider,
  OpenAIModel,
  GroqModel,
} from '../store/slices/aiSlice';
import { useAppSelector } from '../store/hooks';
import { AIService, type AIConfig } from './aiService';

export interface BackendAIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  useEnvironmentKeys: boolean;
  // NOTE: API keys are NEVER sent to backend - backend uses its own environment keys
}

export interface GenerateTextRequest {
  prompt: string;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemContext?: string;
  // NOTE: API keys are NEVER included - backend uses its own environment keys
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

/**
 * Get Keycloak token if available
 */
const getKeycloakToken = (): string | null => {
  try {
    // Try to get token from window.keycloak if available
    if (typeof window !== 'undefined' && (window as any).keycloak) {
      const keycloak = (window as any).keycloak;
      if (keycloak.token) {
        return keycloak.token;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to get Keycloak token:', error);
    return null;
  }
};

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

    // Get authentication token
    const token = getKeycloakToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // In development, also add user headers if available (for testing)
    const isDev = import.meta.env.DEV;
    if (isDev && typeof window !== 'undefined') {
      // Try to get user info from auth context or localStorage
      try {
        const authData = localStorage.getItem('auth-data');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed.userId) {
            headers['x-user-id'] = parsed.userId;
          }
          if (parsed.userEmail) {
            headers['x-user-email'] = parsed.userEmail;
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
        // Ignore errors getting user info
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));

      // Handle authentication errors
      if (response.status === 401) {
        const error = new Error(
          errorData.error || 'Authentication required. Please log in.'
        ) as Error & { status: number; requiresAuth: boolean };
        error.status = 401;
        error.requiresAuth = true;
        throw error;
      }

      // Handle rate limit errors
      if (response.status === 429) {
        const error = new Error(
          errorData.message || errorData.error || 'Rate limit exceeded'
        ) as Error & { status: number; resetIn?: number; resetAt?: string };
        error.status = 429;
        if (errorData.resetIn) error.resetIn = errorData.resetIn;
        if (errorData.resetAt) error.resetAt = errorData.resetAt;
        throw error;
      }

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
      // NOTE: API keys are NEVER sent to backend - backend uses its own environment keys
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

/**
 * Unified AI Service that automatically chooses between frontend and backend
 * - Uses frontend service when user provides their own API keys (privacy-first)
 * - Uses backend service when using shared/environment keys
 */
export class UnifiedAIService {
  private frontendService: AIService | null = null;
  private backendService: BackendAIService | null = null;
  private config: {
    provider: AIProvider;
    openaiModel: OpenAIModel;
    groqModel: GroqModel;
    openaiApiKey: string;
    groqApiKey: string;
    useEnvironmentKeys: boolean;
  };

  constructor(config: {
    provider: AIProvider;
    openaiModel: OpenAIModel;
    groqModel: GroqModel;
    openaiApiKey: string;
    groqApiKey: string;
    useEnvironmentKeys: boolean;
  }) {
    this.config = config;
  }

  /**
   * Determines if we should use frontend service (user's own API keys)
   * Returns true if user has provided their own API keys and is not using environment keys
   */
  private shouldUseFrontend(): boolean {
    // If using environment keys, always use backend
    if (this.config.useEnvironmentKeys) {
      return false;
    }

    // Check if user has provided API keys for the current provider
    const hasOpenAIKey =
      this.config.openaiApiKey && this.config.openaiApiKey.trim().length > 0;
    const hasGroqKey =
      this.config.groqApiKey && this.config.groqApiKey.trim().length > 0;

    // Use frontend if user has provided keys for the selected provider
    if (this.config.provider === 'openai' && hasOpenAIKey) {
      return true;
    }
    if (this.config.provider === 'groq' && hasGroqKey) {
      return true;
    }

    // Fallback to backend if no user keys provided
    return false;
  }

  private getFrontendService(): AIService {
    if (!this.frontendService) {
      const frontendConfig: AIConfig = {
        provider: this.config.provider,
        openaiModel: this.config.openaiModel,
        groqModel: this.config.groqModel,
        openaiApiKey: this.config.openaiApiKey,
        groqApiKey: this.config.groqApiKey,
        useEnvironmentKeys: false, // Always false for frontend service
      };
      this.frontendService = new AIService(frontendConfig);
    }
    return this.frontendService;
  }

  private getBackendService(): BackendAIService {
    if (!this.backendService) {
      this.backendService = new BackendAIService({
        provider: this.config.provider,
        openaiModel: this.config.openaiModel,
        groqModel: this.config.groqModel,
        useEnvironmentKeys: this.config.useEnvironmentKeys,
        // API keys are never sent to backend - backend uses its own environment keys
      });
    }
    return this.backendService;
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
    // Use frontend service if user has provided their own API keys
    if (this.shouldUseFrontend()) {
      const frontendService = this.getFrontendService();
      return frontendService.generateText(prompt, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        provider: options?.provider,
        systemContext: options?.systemContext,
      });
    }

    // Otherwise use backend service (for shared/environment keys)
    const backendService = this.getBackendService();
    return backendService.generateText(prompt, options);
  }

  public async getConfiguration(): Promise<AIConfigResponse> {
    if (this.shouldUseFrontend()) {
      const frontendService = this.getFrontendService();
      return frontendService.getCurrentConfig();
    }
    const backendService = this.getBackendService();
    return backendService.getConfiguration();
  }

  public async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    aiConfigured: boolean;
  }> {
    // Health check only available via backend
    const backendService = this.getBackendService();
    return backendService.checkHealth();
  }

  public isConfigured(): boolean {
    if (this.shouldUseFrontend()) {
      const frontendService = this.getFrontendService();
      return frontendService.isConfigured();
    }
    const backendService = this.getBackendService();
    return backendService.isConfigured();
  }

  public getCurrentConfig() {
    if (this.shouldUseFrontend()) {
      const frontendService = this.getFrontendService();
      return frontendService.getCurrentConfig();
    }
    const backendService = this.getBackendService();
    return backendService.getCurrentConfig();
  }
}

// get backend service hook (kept for backward compatibility)
export const useBackendAIService = () => {
  const aiConfig = useAppSelector((state) => state.ai);

  return new BackendAIService({
    provider: aiConfig.provider || 'groq',
    openaiModel: aiConfig.openaiModel || 'gpt-4o-mini',
    groqModel: aiConfig.groqModel || 'deepseek-r1-distill-llama-70b',
    useEnvironmentKeys: aiConfig.useEnvironmentKeys || false,
    // API keys are never sent to backend - backend uses its own environment keys
  });
};

// Unified service hook - automatically chooses frontend or backend
export const useAIService = () => {
  const aiConfig = useAppSelector((state) => state.ai);

  return new UnifiedAIService({
    provider: aiConfig.provider || 'groq',
    openaiModel: aiConfig.openaiModel || 'gpt-4o-mini',
    groqModel: aiConfig.groqModel || 'deepseek-r1-distill-llama-70b',
    openaiApiKey: aiConfig.openaiApiKey || '',
    groqApiKey: aiConfig.groqApiKey || '',
    useEnvironmentKeys: aiConfig.useEnvironmentKeys || false,
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

export const createDefaultAIService = () => {
  return new UnifiedAIService({
    provider: 'openai',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'deepseek-r1-distill-llama-70b',
    openaiApiKey: '',
    groqApiKey: '',
    useEnvironmentKeys: true,
  });
};
