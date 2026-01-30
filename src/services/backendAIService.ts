import type {
  AIProvider,
  OpenAIModel,
  GroqModel,
  MistralModel,
} from '../store/slices/aiSlice';
import { useAppSelector } from '../store/hooks';
import { AIService, type AIConfig } from './aiService';
import { getKeycloakToken as getKeycloakTokenFromStore } from '../auth/keycloakStore';
import {
  isAuthError,
  isRateLimitError,
  isConfigError,
  type AppError,
  type GenerateSuggestionsRequest,
  type GenerateSuggestionsResponse,
} from '../utils/suggestions';

export interface BackendAIConfig {
  provider: AIProvider;
  openaiModel: OpenAIModel;
  groqModel: GroqModel;
  mistralModel: MistralModel;
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

export interface VerificationEvidence {
  pageNumber: number;
  excerpt: string;
  supportsAnswer: boolean;
}

export interface AIVerificationResult {
  questionId: string;
  status: 'verified' | 'needs_improvement' | 'error';
  feedback?: string;
  suggestions?: string[];
  confidence: number;
  qualityScore?: number;
  evidence?: VerificationEvidence[];
}

export interface VerifyAnswerRequest {
  questionId: string;
  questionText: string;
  currentAnswer: string;
  questionType?: string;
  context?: string;
  pdfContent?: string;
}

export interface VerifyAnswerResponse {
  result: AIVerificationResult;
}

export interface BatchVerifyRequest {
  verifications: VerifyAnswerRequest[];
}

export interface BatchVerifyResponse {
  results: AIVerificationResult[];
}

/**
 * Get Keycloak token if available
 * Uses the global Keycloak store
 */
const getKeycloakToken = (): string | null => {
  try {
    return getKeycloakTokenFromStore();
  } catch (error) {
    console.warn('Failed to get Keycloak token:', error);
    return null;
  }
};

/**
 * Decode JWT token to extract user info (without verification)
 * This is safe because the backend will verify the token signature
 */
const decodeJWT = (token: string): { userId?: string; userEmail?: string } => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {};
    }

    // Decode the payload (base64url)
    const payload = parts[1];
    // Replace URL-safe base64 characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);

    return {
      userId: parsed.sub || parsed.userId,
      userEmail: parsed.email || parsed.preferred_username,
    };
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return {};
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

    const isDev = import.meta.env.DEV;

    // Add Authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;

      // Extract user info from token for development mode header-based auth
      if (isDev) {
        const userInfo = decodeJWT(token);
        if (userInfo.userId) {
          headers['x-user-id'] = userInfo.userId;
        }
        if (userInfo.userEmail) {
          headers['x-user-email'] = userInfo.userEmail;
        }
      }
    } else {
      // No token available - try to get user info from other sources in development
      if (isDev && typeof window !== 'undefined') {
        // Try localStorage as fallback
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
          console.warn('Error getting user info from localStorage:', error);
        }

        // Log warning if no authentication available
        if (!headers['x-user-id'] && !headers['x-user-email']) {
          console.warn(
            '⚠️  No authentication token or headers available. Backend request may fail. Please log in to use backend AI service.'
          );
        }
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
        const errorMessage =
          errorData.error ||
          errorData.message ||
          'Authentication required. Please log in to use the backend AI service.';
        const error = new Error(errorMessage) as Error & {
          status: number;
          requiresAuth: boolean;
          details?: string;
        };
        error.status = 401;
        error.requiresAuth = true;
        if (errorData.details) {
          error.details = errorData.details;
        }
        console.error('Authentication failed:', {
          status: 401,
          error: errorMessage,
          hasToken: !!token,
          isDev: import.meta.env.DEV,
        });
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
      model?: string;
      systemContext?: string;
    }
  ): Promise<{ text: string; reasoning?: string }> {
    const request: GenerateTextRequest = {
      prompt,
      provider: options?.provider || this.config.provider,
      model: options?.model,
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

  /**
   * Verify a single answer for quality and completeness
   */
  public async verifyAnswer(
    request: VerifyAnswerRequest
  ): Promise<AIVerificationResult> {
    try {
      const systemContext = `You are an expert research methodology reviewer. Your task is to verify if answers to research questionnaire questions are supported by evidence from the provided research paper.

Your evaluation should:
1. Check if the answer is supported by evidence in the paper
2. Identify specific evidence (with page numbers and excerpts) that supports or contradicts the answer
3. Assess the quality and completeness of the answer
4. Provide constructive suggestions for improvement if needed

Respond in JSON format with the following structure:
{
  "qualityScore": <number 0-100>,
  "status": "<verified|needs_improvement|incomplete>",
  "feedback": "<constructive feedback about the answer and its alignment with the paper>",
  "suggestions": ["<specific suggestion 1>", "<specific suggestion 2>", ...],
  "evidence": [
    {
      "pageNumber": <number>,
      "excerpt": "<relevant text from the paper>",
      "supportsAnswer": <true|false>
    }
  ]
}`;

      const pdfSection = request.pdfContent
        ? `\n\nResearch Paper Content:\n${request.pdfContent}\n\nPlease verify the answer against the evidence in this paper.`
        : '\n\nNote: No PDF content provided. Evaluate based on general research methodology standards.';

      const prompt = `Question: ${request.questionText}

Current Answer: ${request.currentAnswer}

${request.context ? `Additional Context: ${request.context}\n` : ''}${pdfSection}

Please evaluate this answer and provide your assessment in JSON format with supporting evidence from the paper.`;

      const result = await this.generateText(prompt, {
        systemContext,
        temperature: 0.3,
        maxTokens: 2000,
      });

      let verification;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          verification = JSON.parse(jsonMatch[0]);
        } else {
          verification = {
            qualityScore: 50,
            status: 'needs_improvement',
            feedback: result.text,
            suggestions: [],
            evidence: [],
          };
        }
      } catch (parseError) {
        console.error('Error parsing AI verification response:', parseError);
        verification = {
          qualityScore: 50,
          status: 'needs_improvement',
          feedback: result.text,
          suggestions: [],
          evidence: [],
        };
      }

      return {
        questionId: request.questionId,
        status:
          verification.status === 'incomplete'
            ? 'needs_improvement'
            : verification.status,
        feedback: verification.feedback || 'Unable to verify answer',
        suggestions: verification.suggestions || [],
        confidence: (verification.qualityScore || 50) / 100,
        qualityScore: (verification.qualityScore || 50) / 100,
        evidence: verification.evidence || [],
      };
    } catch (error) {
      console.error('Error verifying answer:', error);
      return {
        questionId: request.questionId,
        status: 'error',
        feedback:
          error instanceof Error ? error.message : 'Verification failed',
        confidence: 0,
      };
    }
  }

  /**
   * Verify multiple answers in batch
   */
  public async verifyAnswersBatch(
    requests: VerifyAnswerRequest[]
  ): Promise<AIVerificationResult[]> {
    const results: AIVerificationResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.verifyAnswer(request);
        results.push(result);
        if (requests.indexOf(request) < requests.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(
          `Error verifying answer for question ${request.questionId}:`,
          error
        );
        results.push({
          questionId: request.questionId,
          status: 'error',
          feedback:
            error instanceof Error ? error.message : 'Verification failed',
          confidence: 0,
        });
      }
    }

    return results;
  }

  /**
   * Get relevant PDF chunks using backend semantic chunking
   */
  public async getSemanticChunks(
    question: string,
    pages: Array<{ pageNumber: number; text: string; wordCount: number }>,
    maxTokens: number = 4000
  ): Promise<{
    chunks: Array<{
      text: string;
      pageNumber: number;
      similarity: number;
      tokenEstimate: number;
    }>;
    totalTokens: number;
    totalChunks: number;
  }> {
    try {
      const token = getKeycloakToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${this.baseUrl}/api/ai/semantic-chunks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          pages,
          maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        throw new Error(
          errorData.error || `Semantic chunking failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[BackendAIService] Semantic chunking error:', error);
      throw error;
    }
  }

  public async generateSuggestions(
    request: GenerateSuggestionsRequest
  ): Promise<GenerateSuggestionsResponse> {
    try {
      if (!request.questionText || typeof request.questionText !== 'string') {
        throw new Error('questionText is required and must be a string');
      }

      if (!request.pdfContent || typeof request.pdfContent !== 'string') {
        throw new Error('pdfContent is required and must be a string');
      }

      if (!request.questionType || typeof request.questionType !== 'string') {
        throw new Error('questionType is required and must be a string');
      }

      // Format parent context
      const parentContextSection = request.parentContext
        ? `

PARENT QUESTION CONTEXT:
Question: ${request.parentContext.questionText}
Answer: ${
            typeof request.parentContext.answer === 'string'
              ? request.parentContext.answer
              : JSON.stringify(request.parentContext.answer)
          }

IMPORTANT: The current question is a sub-question of the parent above.
Your suggestions should:
- Be consistent with the parent answer
- Build upon the parent context
- Provide specific details related to the parent question
- Avoid contradicting or repeating the parent answer
`
        : '';

      // Format sibling context
      const siblingContextSection =
        request.siblingContext && request.siblingContext.length > 0
          ? `

SIBLING QUESTIONS (Already Answered):
${request.siblingContext
  .map(
    (s, idx) => `
${idx + 1}. ${s.questionText}
   Answer: "${typeof s.answer === 'string' ? s.answer : JSON.stringify(s.answer)}"`
  )
  .join('\n')}

IMPORTANT: Generate suggestions that:
- Are CONSISTENT and ALIGNED with sibling answers
- Complement and build upon the information in sibling answers
- Maintain the same level of detail and perspective as siblings
- Ensure coherence across all questions at this level
- Avoid contradicting information provided in sibling answers
`
          : '';

      // Format previous entry context
      const previousEntryContextSection =
        request.previousEntryContext && request.previousEntryContext.length > 0
          ? `

PREVIOUS ENTRIES IN THIS GROUP:
${request.previousEntryContext
  .map(
    (entry) => `
Entry #${entry.entryNumber}:
${entry.questions.map((q) => `  - ${q.questionText}: "${typeof q.answer === 'string' ? q.answer : JSON.stringify(q.answer)}"`).join('\n')}`
  )
  .join('\n')}

IMPORTANT: Generate suggestions that:
- Are DIFFERENT from previous entries
- Complement but don't duplicate previous content
- Explore new aspects or variations
- Provide fresh perspectives not covered in earlier entries
`
          : '';

      // Build the AI prompt for suggestion generation
      const systemPrompt = `You are an AI assistant helping researchers extract information from academic papers.
Your task is to analyze the provided PDF content and suggest answers to specific questions.

The PDF content is organized by chunks and pages (e.g., [PAGE 1], [PAGE 3], [PAGE 4]).
Use these markers to identify the exact source of your evidence.

For each suggestion:
1. Provide a clear, concise answer
2. Include supporting evidence with exact page numbers and text excerpts
3. Rank suggestions by relevance and confidence
${request.contextHistory && request.contextHistory.length > 0 ? '4. Learn from previous suggestions and feedback to generate BETTER and DIFFERENT suggestions' : ''}

CRITICAL INSTRUCTIONS FOR EVIDENCE EXCERPTS:
- Extract EXACT text from the PDF - copy it word-for-word as it appears
- Use the exact page numbers from the chunks headers (e.g., [PAGE 3] means content is from page 3)
- DO NOT add punctuation (periods, commas) that isn't in the original text
- DO NOT paraphrase or summarize - use the exact wording
- Keep excerpts between 10-50 words for best highlighting results
- Include enough context to be meaningful but not too much
- If the text has references like [1] or [Smith 2020], include them as they appear
- The excerpt will be used to highlight text in the PDF, so accuracy is critical

Generate exactly 3 suggestions in the following JSON format:
{
  "suggestions": [
    {
      "rank": 1,
      "text": "suggested answer",
      "confidence": 0.95,
      "evidence": [
        {
          "lineNumber": 4,
          "pageNumber": 3,
          "excerpt": "exact text copied from page 3 without modifications"
        }
      ]
    }
  ]
}`;

      const optionsText =
        request.questionOptions &&
        Array.isArray(request.questionOptions) &&
        request.questionOptions.length > 0
          ? `\nAvailable Options: ${request.questionOptions.join(', ')}`
          : '';

      const metadataText = request.pdfMetadata
        ? `\nPDF Filename: ${request.pdfMetadata.filename}\nTotal Pages: ${request.pdfMetadata.totalPages}`
        : '';

      // Build context history section - unified list with feedback included
      const contextHistorySection =
        request.contextHistory && request.contextHistory.length > 0
          ? `

PREVIOUS SUGGESTIONS - Learn from History:
${request.contextHistory
  .map(
    (item, idx) => `
${idx + 1}. Previous Suggestion:
   Content: "${item.content}"
   ${item.metadata?.feedback ? `User Feedback: ${item.metadata.feedback.rating === 'positive' ? '👍 HELPFUL' : '👎 NOT HELPFUL'}${item.metadata.feedback.comment ? ` - "${item.metadata.feedback.comment}"` : ''}` : 'No feedback provided'}
   Generated: ${new Date(item.timestamp).toLocaleString()}`
  )
  .join('\n')}

IMPORTANT Instructions:
- DO NOT repeat any of the suggestions above - generate completely NEW ones
- If a suggestion was rated 👍 HELPFUL, build upon that approach with new variations
- If a suggestion was rated 👎 NOT HELPFUL, understand why and avoid similar approaches
- Pay attention to user comments for specific guidance
- Learn from what worked and what didn't to provide better suggestions this time`
          : '';

      const userPrompt = `${metadataText}
${parentContextSection}
${siblingContextSection}
${previousEntryContextSection}

Question: ${request.questionText}
Question Type: ${request.questionType}${optionsText}${contextHistorySection}

PDF Content:
${request.pdfContent}

Generate exactly 3 ${request.contextHistory && request.contextHistory.length > 0 ? 'NEW and IMPROVED' : ''} suggestions with supporting evidence from the PDF content above.

REMEMBER: For evidence excerpts, copy the EXACT text from the PDF without correcting typos, errors, adding or removing any punctuation. The excerpts and the page number will be used to highlight text in the PDF viewer, so they must match exactly.`;

      const result = await this.generateText(userPrompt, {
        provider: (request.provider as AIProvider) || this.config.provider,
        model: request.model,
        temperature: 0.3,
        maxTokens: 2000,
        systemContext: systemPrompt,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);

      if (
        !parsedResponse.suggestions ||
        !Array.isArray(parsedResponse.suggestions)
      ) {
        throw new Error('Expected suggestions array in response');
      }

      const suggestions = parsedResponse.suggestions
        .slice(0, 3)
        .map((suggestion: any, index: number) => ({
          id: `suggestion-${Date.now()}-${index}`,
          rank: suggestion.rank || index + 1,
          text: suggestion.text || '',
          confidence: suggestion.confidence || 0.5,
          evidence: Array.isArray(suggestion.evidence)
            ? suggestion.evidence
            : [],
          createdAt: Date.now(),
        }));

      return {
        suggestions,
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error('Error generating suggestions:', error);

      if (isAuthError(error)) {
        const authError = new Error(
          'Authentication required. Please log in to generate suggestions.'
        ) as AppError;
        authError.status = 401;
        authError.requiresAuth = true;
        throw authError;
      }

      if (isRateLimitError(error)) {
        const err = error as AppError;
        const rateLimitError = new Error(
          'Rate limit exceeded. Please try again later.'
        ) as AppError;
        rateLimitError.status = 429;
        if (err.resetIn) rateLimitError.resetIn = err.resetIn;
        if (err.resetAt) rateLimitError.resetAt = err.resetAt;
        throw rateLimitError;
      }

      if (isConfigError(error)) {
        throw new Error(
          'AI service is not properly configured. Please check your settings.'
        );
      }

      throw error;
    }
  }

  public isConfigured(): boolean {
    // for backend service, assume its configured if we can reach backend
    // actual config is handled in backend
    return true;
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
    mistralModel: MistralModel;
    openaiApiKey: string;
    groqApiKey: string;
    mistralApiKey: string;
    useEnvironmentKeys: boolean;
  };

  constructor(config: {
    provider: AIProvider;
    openaiModel: OpenAIModel;
    groqModel: GroqModel;
    mistralModel: MistralModel;
    openaiApiKey: string;
    groqApiKey: string;
    mistralApiKey: string;
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
    const hasMistralKey =
      this.config.mistralApiKey && this.config.mistralApiKey.trim().length > 0;

    // Use frontend if user has provided keys for the selected provider
    if (this.config.provider === 'openai' && hasOpenAIKey) {
      return true;
    }
    if (this.config.provider === 'groq' && hasGroqKey) {
      return true;
    }
    if (this.config.provider === 'mistral' && hasMistralKey) {
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
        mistralModel: this.config.mistralModel,
        openaiApiKey: this.config.openaiApiKey,
        groqApiKey: this.config.groqApiKey,
        mistralApiKey: this.config.mistralApiKey,
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
        mistralModel: this.config.mistralModel,
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
      model?: string;
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
        model: options?.model,
        systemContext: options?.systemContext,
      });
    }

    // Otherwise use backend service (for shared/environment keys)
    const backendService = this.getBackendService();
    return backendService.generateText(prompt, options);
  }

  public async generateSuggestions(
    request: GenerateSuggestionsRequest
  ): Promise<GenerateSuggestionsResponse> {
    return this.getBackendService().generateSuggestions(request);
  }

  public async getSemanticChunks(
    question: string,
    pages: Array<{ pageNumber: number; text: string; wordCount: number }>,
    maxTokens: number = 4000
  ): Promise<{
    chunks: Array<{
      text: string;
      pageNumber: number;
      similarity: number;
      tokenEstimate: number;
    }>;
    totalTokens: number;
    totalChunks: number;
  }> {
    return this.getBackendService().getSemanticChunks(
      question,
      pages,
      maxTokens
    );
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

  public async verifyAnswer(
    request: VerifyAnswerRequest
  ): Promise<AIVerificationResult> {
    const backendService = this.getBackendService();
    return backendService.verifyAnswer(request);
  }

  public async verifyAnswersBatch(
    requests: VerifyAnswerRequest[]
  ): Promise<AIVerificationResult[]> {
    const backendService = this.getBackendService();
    return backendService.verifyAnswersBatch(requests);
  }
}

// get backend service hook (kept for backward compatibility)
export const useBackendAIService = () => {
  const aiConfig = useAppSelector((state) => state.ai);

  return new BackendAIService({
    provider: aiConfig.provider || 'mistral',
    openaiModel: aiConfig.openaiModel || 'gpt-4o-mini',
    groqModel: aiConfig.groqModel || 'deepseek-r1-distill-llama-70b',
    mistralModel: aiConfig.mistralModel || 'mistral-large-latest',
    useEnvironmentKeys: aiConfig.useEnvironmentKeys || false,
    // API keys are never sent to backend - backend uses its own environment keys
  });
};

// Unified service hook - automatically chooses frontend or backend
export const useAIService = () => {
  const aiConfig = useAppSelector((state) => state.ai);

  return new UnifiedAIService({
    provider: aiConfig.provider || 'mistral',
    openaiModel: aiConfig.openaiModel || 'gpt-4o-mini',
    groqModel: aiConfig.groqModel || 'deepseek-r1-distill-llama-70b',
    mistralModel: aiConfig.mistralModel || 'mistral-large-latest',
    openaiApiKey: aiConfig.openaiApiKey || '',
    groqApiKey: aiConfig.groqApiKey || '',
    mistralApiKey: aiConfig.mistralApiKey || '',
    useEnvironmentKeys: aiConfig.useEnvironmentKeys || false,
  });
};

// for components that dont use hooks
export const createDefaultBackendAIService = () => {
  return new BackendAIService({
    provider: 'mistral',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'deepseek-r1-distill-llama-70b',
    mistralModel: 'mistral-large-latest',
    useEnvironmentKeys: true,
  });
};

export const createDefaultAIService = () => {
  return new UnifiedAIService({
    provider: 'mistral',
    openaiModel: 'gpt-4o-mini',
    groqModel: 'deepseek-r1-distill-llama-70b',
    mistralModel: 'mistral-large-latest',
    openaiApiKey: '',
    groqApiKey: '',
    mistralApiKey: '',
    useEnvironmentKeys: true,
  });
};
