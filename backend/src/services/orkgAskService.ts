const ORKG_ASK_API_BASE = 'https://api.ask.orkg.org';

export const orkgAskService = {
  /**
   * Synthesizes a citable answer for a given research question from the abstracts of the given items.
   * Optionally takes a list of item IDs to narrow down.
   */
  async synthesizeAbstracts(question: string, itemIds?: string[]) {
    try {
      const queryParams = new URLSearchParams({
        question,
        response_language: 'en',
      });

      if (itemIds && itemIds.length > 0) {
        itemIds.forEach((id) => queryParams.append('item_ids', id));
      }

      const response = await fetch(
        `${ORKG_ASK_API_BASE}/llm/synthesize/items/abstracts?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error synthesizing abstracts:', error);
      throw new Error('Failed to synthesize abstracts from ORKG ASK.');
    }
  },

  /**
   * Generates a generic LLM response from ORKG Ask
   */
  async generate(prompt: string) {
    try {
      const response = await fetch(`${ORKG_ASK_API_BASE}/llm/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          system: 'You are a helpful assistant about research and ORKG.',
          model: null,
          stream: false,
          temperature: 0.5,
          top_k: 10,
          top_n: 5,
          top_p: 0.95,
          truncate: 150,
          context_size: 0,
          context: [],
          seed: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating from ORKG ASK:', error);
      throw new Error('Failed to generate from ORKG ASK.');
    }
  },
};
