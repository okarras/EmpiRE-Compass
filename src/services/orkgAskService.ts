import { apiRequest } from './backendApi';

interface SynthesisResponse {
  uuid: string;
  timestamp: string;
  payload: {
    items_mapping: Record<string, string | number>;
    collection_items_mapping: Record<string, string | number>;
    question: string;
    synthesis: string;
    seed: number;
    reproducibility: any;
  };
}

export const orkgAskService = {
  /**
   * Ask a question using ORKG ASK LLM
   */
  async askQuestion(
    question: string,
    itemIds?: string[]
  ): Promise<SynthesisResponse> {
    return apiRequest('/api/orkg-ask/synthesize', {
      method: 'POST',
      body: JSON.stringify({
        question,
        itemIds,
      }),
    });
  },

  /**
   * Generate a generic LLM response
   */
  async generate(prompt: string): Promise<any> {
    return apiRequest('/api/orkg-ask/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
      }),
    });
  },
};
