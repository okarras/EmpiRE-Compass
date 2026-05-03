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

/** ORKG paper for display (matches grid) */
export interface OrkgPaperForDisplay {
  id: string;
  title?: string;
  doi?: string;
  year?: number;
  authors?: Array<{ name?: string }>;
  abstract?: string;
}

/** Raw ORKG paper from GET /papers/{id} */
interface OrkgPaperRaw {
  id?: string;
  title?: string;
  identifiers?: { doi?: string | string[] };
  publication_info?: { published_year?: number };
  authors?: Array<{ name?: string }>;
  [key: string]: unknown;
}

function normalizeOrkgPaper(
  raw: OrkgPaperRaw,
  resourceId: string
): OrkgPaperForDisplay {
  const doiVal = raw.identifiers?.doi;
  const doi = Array.isArray(doiVal)
    ? doiVal[0]
    : typeof doiVal === 'string'
      ? doiVal
      : undefined;
  const year = raw.publication_info?.published_year;
  return {
    id: String(raw.id ?? resourceId),
    title: raw.title?.trim(),
    doi,
    year,
    authors: raw.authors,
    abstract: (raw as { abstract?: string }).abstract,
  };
}

export interface SearchByPaperResponse extends SemanticSearchResponse {
  orkgPaper?: OrkgPaperForDisplay;
}

/** Thrown when ORKG HTTP API returns a non-success status (for correct proxy status codes). */
export class OrkgUpstreamHttpError extends Error {
  constructor(
    message: string,
    public readonly upstreamStatus: number
  ) {
    super(message);
    this.name = 'OrkgUpstreamHttpError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ORKG_PAPER_FETCH_MAX_ATTEMPTS = 3;

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

    const searchText = await response.text();
    if (!response.ok) {
      const message =
        searchText.trim() || response.statusText || String(response.status);
      throw new Error(message);
    }

    try {
      return JSON.parse(searchText) as SemanticSearchResponse;
    } catch {
      throw new Error(
        `ORKG ASK semantic search invalid JSON: ${searchText.slice(0, 200)}…`
      );
    }
  },

  /**
   * Fetches paper from ORKG, runs semantic search by title, returns both.
   * Use orkgPaper for display (title, authors, abstract match the grid). Use payload.items[0].id for ORKG Ask link.
   */
  async searchByPaper(resourceId: string): Promise<SearchByPaperResponse> {
    const base = process.env.ORKG_API_BASE;
    if (!base) {
      throw new Error('ORKG_API_BASE is not configured.');
    }
    const url = `${base}/papers/${resourceId}`;
    let paperText = '';
    for (let attempt = 1; attempt <= ORKG_PAPER_FETCH_MAX_ATTEMPTS; attempt++) {
      const paperRes = await fetch(url);
      paperText = await paperRes.text();
      if (paperRes.ok) {
        break;
      }
      const retryable =
        paperRes.status === 502 ||
        paperRes.status === 503 ||
        paperRes.status === 504;
      if (!retryable || attempt === ORKG_PAPER_FETCH_MAX_ATTEMPTS) {
        const message =
          paperText.trim() || paperRes.statusText || String(paperRes.status);
        throw new OrkgUpstreamHttpError(message, paperRes.status);
      }
      await sleep(400 * Math.pow(2, attempt - 1));
    }
    let paper: OrkgPaperRaw;
    try {
      paper = JSON.parse(paperText) as OrkgPaperRaw;
    } catch {
      throw new Error(
        `ORKG papers response is not valid JSON: ${paperText.slice(0, 100)}…`
      );
    }
    const title = paper?.title?.trim();
    if (!title) {
      throw new Error('Paper has no title in ORKG.');
    }
    const orkgPaper = normalizeOrkgPaper(paper, resourceId);
    const searchResponse = await this.semanticSearch(title, { limit: 10 });
    return {
      ...searchResponse,
      orkgPaper,
    };
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
      const message =
        responseText.trim() || response.statusText || String(response.status);
      throw new Error(message);
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
      const message =
        responseText.trim() || response.statusText || String(response.status);
      throw new Error(message);
    }

    try {
      return JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      throw new Error(`ORKG ASK invalid JSON: ${responseText.slice(0, 100)}…`);
    }
  },
};
