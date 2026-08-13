import { apiRequest } from './client';

export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export interface ContributionPaper {
  title: string;
  doi?: string;
  authors?: string;
  year?: number;
  venue?: string;
}

export interface Contribution {
  id?: string;
  status: ContributionStatus;
  templateId?: string;
  templateVersion?: string;
  paper: ContributionPaper;
  /** Raw ScidQuest answers, keyed by questionnaire question id. */
  answers: Record<string, unknown>;
  submittedByUserId?: string;
  submittedByEmail?: string;
  submittedAt?: string;
  reviewedByUserId?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Fields the submitter supplies; status and identity are set server-side. */
export type ContributionSubmission = Pick<
  Contribution,
  'paper' | 'answers' | 'templateId' | 'templateVersion'
>;

/**
 * Admins receive every contribution, submitters only their own — the backend
 * decides which, so no client-side filtering is needed here.
 */
export const getContributions = async (
  status?: ContributionStatus,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<Contribution[]>(`/api/contributions${query}`, {
    method: 'GET',
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};

export const getContribution = async (
  contributionId: string,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest<Contribution>(`/api/contributions/${contributionId}`, {
    method: 'GET',
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};

export const submitContribution = async (
  submission: ContributionSubmission,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest<Contribution>('/api/contributions', {
    method: 'POST',
    body: JSON.stringify(submission),
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};

export const reviewContribution = async (
  contributionId: string,
  status: Extract<ContributionStatus, 'approved' | 'rejected'>,
  reviewNote: string | undefined,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest<Contribution>(
    `/api/contributions/${contributionId}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNote }),
      userId,
      userEmail,
      requiresAdmin: true,
      keycloakToken,
    }
  );
};

export const deleteContribution = async (
  contributionId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/contributions/${contributionId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};
