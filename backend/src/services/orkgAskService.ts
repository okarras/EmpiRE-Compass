/**
 * ORKG ASK Service
 * Service for interacting with the ORKG ASK API
 * Documentation: https://api.ask.orkg.org/docs
 */

const ORKG_ASK_API_BASE = 'https://api.ask.orkg.org';

export interface OrkgAskRequest {
  question: string;
  max_results?: number;
  temperature?: number;
}

export interface OrkgAskCitation {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  venue?: string;
  url?: string;
  abstract?: string;
  relevance_score?: number;
}

export interface OrkgAskResponse {
  answer: string;
  citations: OrkgAskCitation[];
  query?: string;
  metadata?: {
    total_results?: number;
    processing_time?: number;
  };
}

/**
 * Call ORKG ASK API to generate an answer for a research question
 * @param request - The ORKG ASK request parameters
 * @returns The ORKG ASK response with answer and citations
 */
export async function askOrkg(
  request: OrkgAskRequest
): Promise<OrkgAskResponse> {
  const { question, max_results = 10, temperature = 0.3 } = request;

  if (!question || !question.trim()) {
    throw new Error('Question is required');
  }

  try {
    // Call the ORKG ASK LLM generate endpoint
    // Based on: https://api.ask.orkg.org/llm/generate
    const response = await fetch(`${ORKG_ASK_API_BASE}/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        question: question.trim(),
        max_results,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `ORKG ASK API error: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();

    // Normalize the response format
    // The actual API response structure may vary, so we normalize it
    return {
      answer: data.answer || data.response || data.text || '',
      citations: Array.isArray(data.citations)
        ? data.citations.map((citation: any) => ({
            id: citation.id || citation.paper_id || '',
            title: citation.title || citation.paper_title || '',
            authors: Array.isArray(citation.authors)
              ? citation.authors
              : citation.authors
                ? [citation.authors]
                : [],
            year: citation.year || citation.publication_year,
            venue: citation.venue || citation.publication_venue,
            url: citation.url || citation.link || citation.doi,
            abstract: citation.abstract || citation.summary,
            relevance_score: citation.relevance_score || citation.score,
          }))
        : [],
      query: data.query,
      metadata: {
        total_results: data.total_results || data.metadata?.total_results,
        processing_time: data.processing_time || data.metadata?.processing_time,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to call ORKG ASK API');
  }
}

/**
 * Alternative endpoint: Synthesize abstracts for a question
 * This might be useful for getting more detailed context
 */
export async function synthesizeAbstracts(
  question: string,
  max_items: number = 10
): Promise<OrkgAskCitation[]> {
  try {
    const response = await fetch(
      `${ORKG_ASK_API_BASE}/llm/synthesize_items_abstracts?question=${encodeURIComponent(question)}&max_items=${max_items}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `ORKG ASK synthesis error: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();

    // Normalize citations format
    return Array.isArray(data)
      ? data.map((item: any) => ({
          id: item.id || item.paper_id || '',
          title: item.title || item.paper_title || '',
          authors: Array.isArray(item.authors)
            ? item.authors
            : item.authors
              ? [item.authors]
              : [],
          year: item.year || item.publication_year,
          venue: item.venue || item.publication_venue,
          url: item.url || item.link || item.doi,
          abstract: item.abstract || item.summary,
          relevance_score: item.relevance_score || item.score,
        }))
      : [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to synthesize abstracts from ORKG ASK');
  }
}
