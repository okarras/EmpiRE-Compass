/**
 * ORKG ASK Service
 * Frontend service for interacting with the ORKG ASK API via backend
 */

import { apiRequest } from './backendApi';
import { getKeycloakToken as getKeycloakTokenFromStore } from '../auth/keycloakStore';

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

export interface OrkgAskRequest {
  question: string;
  max_results?: number;
  temperature?: number;
}

/**
 * Ask ORKG ASK a research question
 * @param request - The ORKG ASK request parameters
 * @param userId - Optional user ID for authentication
 * @param userEmail - Optional user email for authentication
 * @param keycloakToken - Optional Keycloak token
 * @returns The ORKG ASK response with answer and citations
 */
export const askOrkg = async (
  request: OrkgAskRequest,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<OrkgAskResponse> => {
  return apiRequest<OrkgAskResponse>('/api/orkg-ask', {
    method: 'POST',
    body: JSON.stringify(request),
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken: keycloakToken || getKeycloakTokenFromStore() || undefined,
  });
};

/**
 * Synthesize abstracts for a research question
 * @param question - The research question
 * @param maxItems - Maximum number of items to return
 * @param userId - Optional user ID for authentication
 * @param userEmail - Optional user email for authentication
 * @param keycloakToken - Optional Keycloak token
 * @returns Array of citations
 */
export const synthesizeAbstracts = async (
  question: string,
  maxItems: number = 10,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<{ citations: OrkgAskCitation[] }> => {
  const params = new URLSearchParams({
    question,
    max_items: maxItems.toString(),
  });

  return apiRequest<{ citations: OrkgAskCitation[] }>(
    `/api/orkg-ask/synthesize?${params.toString()}`,
    {
      method: 'GET',
      userId,
      userEmail,
      requiresAuth: true,
      keycloakToken: keycloakToken || getKeycloakTokenFromStore() || undefined,
    }
  );
};
