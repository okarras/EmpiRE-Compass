/**
 * Backend API Client
 * Centralized service for all backend API calls
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getKeycloakToken as getKeycloakTokenFromStore } from '../auth/keycloakStore';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://empirecompassbackend.vercel.app';

export interface ApiRequestOptions extends RequestInit {
  userId?: string;
  userEmail?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  keycloakToken?: string;
}

/**
 * Get Keycloak token if available
 * Uses the global Keycloak store
 */
const getKeycloakToken = (): string | null => {
  try {
    return getKeycloakTokenFromStore();
  } catch (error) {
    console.warn('Failed to get Keycloak token:', error);
    return null;
  }
};

/**
 * Make a request to the backend API
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const {
    userId,
    userEmail,
    requiresAuth = false,
    requiresAdmin = false,
    keycloakToken,
    headers = {},
    ...fetchOptions
  } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Add authentication headers
  if (requiresAuth || requiresAdmin) {
    const token = keycloakToken || getKeycloakToken();

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Always add user headers when available (backend checks these first)
    // This allows authentication to work even when token validation isn't fully implemented
    if (userId) {
      requestHeaders['x-user-id'] = userId;
    }
    if (userEmail) {
      requestHeaders['x-user-email'] = userEmail;
    }
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// ========== User API ==========

export const syncUser = async (
  userData: { id: string; email: string; display_name: string },
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/users/sync', {
    method: 'POST',
    body: JSON.stringify(userData),
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};

export const getUser = async (
  userId: string,
  authUserId: string,
  authUserEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/users/${userId}`, {
    userId: authUserId,
    userEmail: authUserEmail,
    requiresAuth: true,
    keycloakToken,
  });
};

// ========== Team API ==========

export const getTeamMembers = async () => {
  return apiRequest('/api/team');
};

export const createTeamMember = async (
  memberData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/team', {
    method: 'POST',
    body: JSON.stringify(memberData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateTeamMember = async (
  memberId: string,
  memberData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/team/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(memberData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deleteTeamMember = async (
  memberId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/team/${memberId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

// ========== Home Content API ==========

export const getHomeContent = async () => {
  return apiRequest('/api/home-content');
};

export const updateHomeContent = async (
  content: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/home-content', {
    method: 'PUT',
    body: JSON.stringify(content),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

// ========== Templates API ==========

export const getTemplates = async () => {
  return apiRequest('/api/templates');
};

export const getTemplate = async (templateId: string) => {
  return apiRequest(`/api/templates/${templateId}`);
};

export const createTemplate = async (
  templateData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateTemplate = async (
  templateId: string,
  templateData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(templateData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deleteTemplate = async (
  templateId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

// ========== Questions API ==========

export const getQuestions = async (templateId: string) => {
  return apiRequest(`/api/templates/${templateId}/questions`);
};

export const getQuestion = async (templateId: string, questionId: string) => {
  return apiRequest(`/api/templates/${templateId}/questions/${questionId}`);
};

export const createQuestion = async (
  templateId: string,
  questionData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/questions`, {
    method: 'POST',
    body: JSON.stringify(questionData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateQuestion = async (
  templateId: string,
  questionId: string,
  questionData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(questionData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deleteQuestion = async (
  templateId: string,
  questionId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/questions/${questionId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

// ========== Statistics API ==========

export const getStatistics = async (templateId: string) => {
  return apiRequest(`/api/templates/${templateId}/statistics`);
};

export const createStatistic = async (
  templateId: string,
  statisticData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/statistics`, {
    method: 'POST',
    body: JSON.stringify(statisticData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateStatistic = async (
  templateId: string,
  statisticId: string,
  statisticData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/statistics/${statisticId}`, {
    method: 'PUT',
    body: JSON.stringify(statisticData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deleteStatistic = async (
  templateId: string,
  statisticId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/statistics/${statisticId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

// ========== Request Logs API ==========

export interface RequestLog {
  id: string;
  timestamp: string;
  operation: 'read' | 'write' | 'update' | 'delete' | 'query';
  collection: string;
  documentId?: string;
  userId?: string;
  userEmail?: string;
  success: boolean;
  error?: string;
  metadata?: any;
  requestBody?: any;
  responseData?: any;
}

export interface RequestLogsResponse {
  logs: RequestLog[];
  count: number;
  filters: {
    collection?: string;
    operation?: string;
    success?: string;
  };
}

export const getRequestLogs = async (
  options?: {
    limit?: number;
    collection?: string;
    operation?: string;
    success?: boolean;
  },
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<RequestLogsResponse> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.collection) params.append('collection', options.collection);
  if (options?.operation) params.append('operation', options.operation);
  if (options?.success !== undefined)
    params.append('success', options.success.toString());

  const queryString = params.toString();
  const endpoint = `/api/request-logs${queryString ? `?${queryString}` : ''}`;

  return apiRequest(endpoint, {
    method: 'GET',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

// ========== Dynamic Questions API ==========

export const getDynamicQuestions = async (limit?: number) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  const queryString = params.toString();
  const endpoint = `/api/dynamic-questions${queryString ? `?${queryString}` : ''}`;
  return apiRequest(endpoint);
};

export const getDynamicQuestion = async (questionId: string) => {
  return apiRequest(`/api/dynamic-questions/${questionId}`);
};

export const createDynamicQuestion = async (
  questionData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/dynamic-questions', {
    method: 'POST',
    body: JSON.stringify(questionData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateDynamicQuestion = async (
  questionId: string,
  questionData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/dynamic-questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(questionData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deleteDynamicQuestion = async (
  questionId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/dynamic-questions/${questionId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};
