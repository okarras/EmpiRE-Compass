export interface SemanticSearchOptions {
  limit?: number;
  offset?: number | null;
  filter?: string | null;
  focus?: string[] | null;
  fields?: string | null;
}

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

export const orkgAskService = {
  /**
   * Semantic search: searches for similar documents using vector search.
   * @param query - The text to search for
   * @param options - limit (1-100, default 10), offset, filter, focus, fields
   */
  async semanticSearch(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResponse> {
    const baseUrl = process.env.ORKG_ASK_API_BASE ?? '';
    if (!baseUrl) {
      throw new Error('ORKG_ASK_API_BASE is not configured.');
    }

    const params = new URLSearchParams({ query });
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.offset != null) params.set('offset', String(options.offset));
    if (options.filter != null) params.set('filter', options.filter);
    if (options.focus != null && options.focus.length > 0) {
      options.focus.forEach((f) => params.append('focus', f));
    }
    if (options.fields != null) params.set('fields', options.fields);

    const apiKey = process.env.ORKG_ASK_API_KEY;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(
      `${baseUrl}/index/search?${params.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(
        `ORKG ASK semantic search failed: HTTP ${response.status}`
      );
    }

    return response.json();
  },

  /**
   * Fetches paper title from ORKG, then runs semantic search with it.
   * Returns the search response. Use payload.items[0].id to open in ORKG Ask.
   */
  async searchByPaper(resourceId: string): Promise<SemanticSearchResponse> {
    const paperRes = await fetch(
      `${process.env.ORKG_API_BASE}/papers/${resourceId}`
    );
    if (!paperRes.ok) {
      throw new Error(
        `Failed to fetch paper from ORKG: HTTP ${paperRes.status}`
      );
    }
    const paper = (await paperRes.json()) as { title?: string };
    const title = paper?.title?.trim();
    if (!title) {
      throw new Error('Paper has no title in ORKG.');
    }
    return this.semanticSearch(title, { limit: 1 });
  },

  /**
   * Generates a generic LLM response from ORKG Ask via POST /llm/generate.
   * @param prompt - The user prompt
   * @param options - Optional system context (e.g. SPARQL-specific instructions)
   */
  async generate(prompt: string, options?: { system?: string }) {
    const systemPrompt =
      options?.system ?? 'You are a helpful assistant about research and ORKG.';

    const baseUrl = process.env.ORKG_ASK_API_BASE ?? '';
    if (!baseUrl) {
      throw new Error('ORKG_ASK_API_BASE is not configured.');
    }
    const apiKey = process.env.ORKG_ASK_API_KEY;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${baseUrl}/llm/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        system: systemPrompt,
        model: null,
        stream: false,
        temperature: 0.3,
        top_k: 10,
        top_n: 5,
        top_p: 0.95,
        truncate: 8192,
        context_size: 0,
        context: [],
        seed: null,
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      const isHtml =
        /^\s*</.test(responseText) || responseText.includes('</html>');
      const isGatewayError =
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;
      const detail =
        isGatewayError && isHtml
          ? 'Service temporarily unavailable. Try again later or use the local AI provider.'
          : responseText.length > 200
            ? responseText.slice(0, 200) + '…'
            : responseText;
      throw new Error(
        `ORKG ASK HTTP ${response.status}: ${detail || response.statusText}`
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      throw new Error(`ORKG ASK invalid JSON: ${responseText.slice(0, 100)}…`);
    }

    return data;
  },

  /**
   * Synthesizes a citable answer for a research question from the abstracts of given items.
   * @param question - The research question
   * @param itemIds - ORKG Ask item IDs (from semantic search results)
   */
  async synthesizeAbstracts(
    question: string,
    itemIds: (string | number)[]
  ): Promise<Record<string, unknown>> {
    const baseUrl = process.env.ORKG_ASK_API_BASE ?? '';
    if (!baseUrl) {
      throw new Error('ORKG_ASK_API_BASE is not configured.');
    }
    const apiKey = process.env.ORKG_ASK_API_KEY;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const params = new URLSearchParams({ question });
    itemIds.forEach((id) => params.append('item_ids', String(id)));

    const response = await fetch(
      `${baseUrl}/llm/synthesize/items/abstracts?${params.toString()}`,
      { method: 'GET', headers }
    );

    const responseText = await response.text();
    if (!response.ok) {
      const isHtml =
        /^\s*</.test(responseText) || responseText.includes('</html>');
      const isGatewayError =
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;
      const detail =
        isGatewayError && isHtml
          ? 'Service temporarily unavailable. Try again later.'
          : responseText.length > 200
            ? responseText.slice(0, 200) + '…'
            : responseText;
      throw new Error(
        `ORKG ASK synthesize HTTP ${response.status}: ${detail || response.statusText}`
      );
    }

    try {
      return JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      throw new Error(`ORKG ASK invalid JSON: ${responseText.slice(0, 100)}…`);
    }
  },
};
