import { apiRequest } from './client';
import type { ContributionPaper } from './contributions';

export interface CreateVerificationResult {
  id: string;
  token: string;
  link: string;
  paper: ContributionPaper;
  unmappedNotes: string[];
  expiresAt: string;
}

export interface VerificationData {
  paper: ContributionPaper;
  answers: Record<string, unknown>;
  unmappedNotes: string[];
  templateId: string;
  templateVersion: string;
}

export interface SubmitVerificationPayload {
  answers: Record<string, unknown>;
  confirmedAsIs: boolean;
  authorName?: string;
  authorEmail?: string;
}

/** Admin-only: builds an author-verification invite for an ORKG paper already cached from KG-EmpiRE. */
export const createVerification = async (
  paperId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string,
  expiresInDays?: number
) =>
  apiRequest<CreateVerificationResult>('/api/verifications', {
    method: 'POST',
    body: JSON.stringify({ paperId, expiresInDays }),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });

/** Public: no auth, gated only by the unguessable token in the link. */
export const getVerification = async (token: string) =>
  apiRequest<VerificationData>(`/api/verifications/${encodeURIComponent(token)}`, {
    method: 'GET',
  });

/** Public: no auth, single-use — the backend rejects a second submit for the same token. */
export const submitVerification = async (
  token: string,
  payload: SubmitVerificationPayload
) =>
  apiRequest<{ contributionId: string }>(
    `/api/verifications/${encodeURIComponent(token)}/submit`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
