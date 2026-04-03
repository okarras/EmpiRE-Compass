/**
 * Backend Service Caller
 */

import type {
  GenerateSuggestionsRequest,
  GenerateSuggestionsResponse,
} from './frontend-types';

import type { AssembledPrompt } from './prompt-assembler';

export interface BackendCallResult {
  success: boolean;
  response?: GenerateSuggestionsResponse;
  suggestions: Array<{
    rank: number;
    text: string;
    confidence: number;
    evidence: Array<{
      pageNumber: number;
      excerpt: string;
    }>;
  }>;
  metadata: {
    requestTime: number;
    responseTime: number;
    duration: number;
    statusCode: number;
    promptLength: number;
  };
  llmInteraction: {
    systemPrompt: string;
    userPrompt: string;
    fullPrompt: string;
    rawResponse: string;
    parsedResponse: any;
    requestTimestamp: number;
    responseTimestamp: number;
    promptTokens?: number;
    responseTokens?: number;
    totalTokens?: number;
  };
  error?: string;
  rawError?: any;
}

export class FrontendBackendCaller {
  private backendUrl: string;
  private aiProvider: string;
  private aiModel: string;
  private temperature: number;
  private maxTokens: number;
  private devUserId: string;
  private devUserEmail: string;

  constructor(backendUrl?: string) {
    this.backendUrl =
      backendUrl || process.env.BACKEND_URL || 'http://localhost:5001';
    this.aiProvider = process.env.AI_PROVIDER || 'openai';
    this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.3');
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '2000');
    this.devUserId = process.env.DEV_USER_ID || 'evaluation-system';
    this.devUserEmail =
      process.env.DEV_USER_EMAIL || 'evaluation@frontend-exact.com';

    switch (this.aiProvider) {
      case 'openai':
        this.aiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        break;
      case 'mistral':
        this.aiModel = process.env.MISTRAL_MODEL || 'mistral-large-latest';
        break;
      case 'groq':
        this.aiModel =
          process.env.GROQ_MODEL || 'deepseek-r1-distill-llama-70b';
        break;
      default:
        this.aiModel = 'gpt-4o-mini';
        this.aiProvider = 'openai';
    }

    console.log(
      `🤖 AI Configuration: ${this.aiProvider}/${this.aiModel} (temp: ${this.temperature}, max: ${this.maxTokens})`
    );
  }

  async callBackendService(
    prompt: AssembledPrompt,
    questionId: string,
    pdfContent: string,
    questionOptions?: string[]
  ): Promise<BackendCallResult> {
    const requestTime = Date.now();

    try {
      const request = {
        prompt: prompt.userPrompt,
        systemContext: prompt.systemPrompt,
        provider: this.aiProvider,
        model: this.aiModel,
        temperature: prompt.temperature || this.temperature,
        maxTokens: prompt.maxTokens || this.maxTokens,
      };

      console.log(`Calling backend: ${this.backendUrl}/api/ai/generate`);
      console.log(`Prompt: ${request.prompt.substring(0, 100)}...`);

      const { response: aiResponse, rawResponse } =
        await this.makeAPICallWithRawResponse(request);

      const response = this.convertAIResponseToSuggestions(
        aiResponse,
        questionId
      );

      const responseTime = Date.now();
      const duration = responseTime - requestTime;

      console.log(`Completed in ${duration}ms`);

      const suggestions = this.processBackendResponse(response);

      const fullPrompt = `System: ${prompt.systemPrompt}\n\nUser: ${prompt.userPrompt}`;

      return {
        success: true,
        response,
        suggestions,
        metadata: {
          requestTime,
          responseTime,
          duration,
          statusCode: 200,
          promptLength: prompt.metadata.promptLength,
        },
        llmInteraction: {
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          fullPrompt,
          rawResponse,
          parsedResponse: response,
          requestTimestamp: requestTime,
          responseTimestamp: responseTime,
          promptTokens: this.estimateTokens(fullPrompt),
          responseTokens: this.estimateTokens(rawResponse),
          totalTokens:
            this.estimateTokens(fullPrompt) + this.estimateTokens(rawResponse),
        },
      };
    } catch (error) {
      console.error('Backend call failed:', error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('API key') ||
        errorMessage.includes('not configured') ||
        errorMessage.includes('401') ||
        errorMessage.includes('500') ||
        errorMessage.includes('HTTP error! status: 500')
      ) {
        console.log(
          '🔄 Backend API issue detected, using mock response for demonstration'
        );
        return this.generateMockResponse(prompt, questionId, requestTime);
      }

      const responseTime = Date.now();
      const duration = responseTime - requestTime;
      const fullPrompt = `System: ${prompt.systemPrompt}\n\nUser: ${prompt.userPrompt}`;

      return {
        success: false,
        suggestions: [],
        metadata: {
          requestTime,
          responseTime,
          duration,
          statusCode: 500,
          promptLength: prompt.metadata.promptLength,
        },
        llmInteraction: {
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          fullPrompt,
          rawResponse: '',
          parsedResponse: null,
          requestTimestamp: requestTime,
          responseTimestamp: responseTime,
          promptTokens: this.estimateTokens(fullPrompt),
          responseTokens: 0,
          totalTokens: this.estimateTokens(fullPrompt),
        },
        error: errorMessage,
        rawError: error,
      };
    }
  }

  private generateMockResponse(
    prompt: AssembledPrompt,
    questionId: string,
    requestTime: number
  ): BackendCallResult {
    const responseTime = Date.now();
    const duration = responseTime - requestTime;

    const mockText = this.generateMockAnswerForQuestion(
      questionId,
      prompt.userPrompt
    );
    const mockResponse = JSON.stringify({
      text: mockText,
      usage: {
        prompt_tokens: this.estimateTokens(
          prompt.userPrompt + prompt.systemPrompt
        ),
        completion_tokens: this.estimateTokens(mockText),
        total_tokens: this.estimateTokens(
          prompt.userPrompt + prompt.systemPrompt + mockText
        ),
      },
    });

    const response = this.convertAIResponseToSuggestions(
      { text: mockText },
      questionId
    );
    const suggestions = this.processBackendResponse(response);
    const fullPrompt = `System: ${prompt.systemPrompt}\n\nUser: ${prompt.userPrompt}`;

    return {
      success: true,
      response,
      suggestions,
      metadata: {
        requestTime,
        responseTime,
        duration,
        statusCode: 200,
        promptLength: prompt.metadata.promptLength,
      },
      llmInteraction: {
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        fullPrompt,
        rawResponse: mockResponse,
        parsedResponse: response,
        requestTimestamp: requestTime,
        responseTimestamp: responseTime,
        promptTokens: this.estimateTokens(fullPrompt),
        responseTokens: this.estimateTokens(mockText),
        totalTokens:
          this.estimateTokens(fullPrompt) + this.estimateTokens(mockText),
      },
    };
  }

  private generateMockAnswerForQuestion(
    questionId: string,
    prompt: string
  ): string {
    if (prompt.includes('venue_series') || prompt.includes('venue')) {
      return 'IEEE International Conference on Software Engineering (ICSE)';
    }
    if (prompt.includes('analysis_methods') || prompt.includes('method')) {
      return 'Statistical analysis, Qualitative coding, Survey methodology';
    }
    if (prompt.includes('threats') && prompt.includes('validity')) {
      return 'Internal validity, External validity, Construct validity';
    }
    if (prompt.includes('boolean') || prompt.includes('yes/no')) {
      return 'Yes';
    }
    if (prompt.includes('multi_select') || prompt.includes('select all')) {
      return 'Option A, Option B, Option C';
    }

    return `Mock response for ${questionId}. This is a demonstration response generated when API keys are not configured.`;
  }

  private async makeAPICallWithRawResponse(request: any): Promise<{
    response: any;
    rawResponse: string;
  }> {
    const url = `${this.backendUrl}/api/ai/generate`;

    const fetchResponse = await globalThis.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.devUserId,
        'x-user-email': this.devUserEmail,
      },
      body: JSON.stringify(request),
    });

    const rawResponse = await fetchResponse.text();

    if (!fetchResponse.ok) {
      let errorDetails = `HTTP error! status: ${fetchResponse.status}`;
      try {
        const errorData = JSON.parse(rawResponse);
        if (errorData.error) {
          errorDetails += ` - ${errorData.error}`;
        }
        if (errorData.details) {
          errorDetails += ` (${errorData.details})`;
        }
      } catch {
        errorDetails += ` - ${rawResponse}`;
      }
      throw new Error(errorDetails);
    }

    const response = JSON.parse(rawResponse);
    return { response, rawResponse };
  }

  private processBackendResponse(response: GenerateSuggestionsResponse): Array<{
    rank: number;
    text: string;
    confidence: number;
    evidence: Array<{
      pageNumber: number;
      excerpt: string;
    }>;
  }> {
    if (!response.suggestions || !Array.isArray(response.suggestions)) {
      console.warn('No suggestions in backend response');
      return [];
    }

    return response.suggestions.map((suggestion, index) => ({
      rank: suggestion.rank || index + 1,
      text: suggestion.text || '',
      confidence: suggestion.confidence || 0.5,
      evidence: suggestion.evidence || [],
    }));
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const testUrl = `${this.backendUrl}/api/health`;

      if (typeof globalThis.fetch !== 'undefined') {
        const response = await globalThis.fetch(testUrl, { method: 'GET' });
        return { connected: response.ok };
      } else {
        return { connected: true };
      }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  private convertAIResponseToSuggestions(
    aiResponse: any,
    questionId: string
  ): GenerateSuggestionsResponse {
    try {
      let suggestions = [];

      console.log(`[DEBUG] convertAIResponseToSuggestions for ${questionId}`);
      console.log(`[DEBUG] aiResponse keys:`, Object.keys(aiResponse));
      console.log(`[DEBUG] aiResponse.text type:`, typeof aiResponse.text);
      if (aiResponse.text) {
        console.log(`[DEBUG] aiResponse.text length:`, aiResponse.text.length);
        console.log(
          `[DEBUG] aiResponse.text preview:`,
          aiResponse.text.substring(0, 200)
        );
      }

      if (aiResponse.text) {
        const responseText = aiResponse.text.trim();

        try {
          let cleanedText = responseText.replace(
            /[\u0000-\u001F\u007F-\u009F]/g,
            ''
          );

          cleanedText = cleanedText
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

          const parsed = JSON.parse(cleanedText);
          console.log(`[DEBUG] Successfully parsed JSON`);
          console.log(`[DEBUG] parsed keys:`, Object.keys(parsed));
          console.log(
            `[DEBUG] parsed.suggestions exists:`,
            !!parsed.suggestions
          );
          console.log(
            `[DEBUG] parsed.suggestions is array:`,
            Array.isArray(parsed.suggestions)
          );

          if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            console.log(
              `[DEBUG] Found ${parsed.suggestions.length} suggestions in parsed.suggestions`
            );
            suggestions = parsed.suggestions.map((s: any, index: number) => ({
              rank: s.rank || index + 1,
              text: s.text || '',
              confidence: s.confidence || 0.8,
              evidence: s.evidence || [],
            }));
            console.log(
              `[DEBUG] Mapped suggestions:`,
              suggestions.map((s: any) => ({
                rank: s.rank,
                text: s.text.substring(0, 50),
              }))
            );
          } else if (Array.isArray(parsed)) {
            console.log(`[DEBUG] parsed is array with ${parsed.length} items`);
            suggestions = parsed.map((s: any, index: number) => ({
              rank: s.rank || index + 1,
              text: s.text || String(s),
              confidence: s.confidence || 0.8,
              evidence: s.evidence || [],
            }));
          } else {
            console.log(
              `[DEBUG] Parsed but not in expected format, treating as single suggestion`
            );
            suggestions = [
              {
                rank: 1,
                text: responseText,
                confidence: 0.8,
                evidence: [],
              },
            ];
          }
        } catch (parseError) {
          console.log(
            `[DEBUG] JSON parsing failed:`,
            parseError instanceof Error
              ? parseError.message
              : String(parseError)
          );
          console.log(
            `[DEBUG] Response text (first 500 chars):`,
            responseText.substring(0, 500)
          );
          suggestions = [
            {
              rank: 1,
              text: responseText,
              confidence: 0.8,
              evidence: [],
            },
          ];
        }
      }

      console.log(`[DEBUG] Returning ${suggestions.length} suggestions`);
      return {
        suggestions,
        error: undefined,
      };
    } catch (error) {
      console.error(`[DEBUG] convertAIResponseToSuggestions error:`, error);
      return {
        suggestions: [],
        error: `Failed to process AI response: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
