import { apiRequest } from './backendApi';

export interface SemanticSearchItem {
  id: string;
  doi?: string;
  title?: string;
  abstract?: string;
  year?: number;
  [key: string]: unknown;
}

export interface SemanticSearchResponse {
  uuid: string;
  timestamp: string;
  payload: {
    items: SemanticSearchItem[];
    total_hits: number;
    has_more: boolean;
    offset: number;
  };
}

export interface OrkgGenerateResponse {
  text: string;
  reasoning?: string;
}

export interface GenerateResponse {
  text: string;
  reasoning?: string;
}

export const orkgAskService = {
  /**
   * Search ORKG Ask by paper: fetches paper title from ORKG, runs semantic search,
   * returns results. Use payload.items[0].id to open in ORKG Ask.
   */
  async searchByPaper(resourceId: string): Promise<SemanticSearchResponse> {
    return apiRequest('/api/orkg-ask/search-by-paper', {
      method: 'POST',
      body: JSON.stringify({ resourceId }),
    });
  },

  /**
   * Synthesize an answer from paper abstracts (ORKG Ask /llm/synthesize/items/abstracts).
   * @param question - The research question
   * @param itemIds - ORKG Ask item IDs (e.g. from searchByPaper payload.items[0].id, or ORKG resource IDs)
   * @returns Response with payload.synthesis
   */
  async askQuestion(
    question: string,
    itemIds: string[]
  ): Promise<{ payload?: { synthesis?: string }; synthesis?: string }> {
    return apiRequest('/api/orkg-ask/synthesize', {
      method: 'POST',
      body: JSON.stringify({ question, itemIds }),
    });
  },

  /**
   * Generate text using ORKG Ask LLM. Returns { text, reasoning? }.
   */
  async generate(
    prompt: string,
    options?: { systemContext?: string }
  ): Promise<OrkgGenerateResponse> {
    const res = await apiRequest<{ text: string; reasoning?: string }>(
      '/api/orkg-ask/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          systemContext: options?.systemContext,
        }),
      }
    );
    return {
      text: res?.text ?? '',
      reasoning: res?.reasoning,
    };
  },
};
