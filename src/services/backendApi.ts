/**
 * Backend API Client
 * Centralized service for all backend API calls
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getKeycloakToken as getKeycloakTokenFromStore } from '../auth/keycloakStore';

// Determine backend URL based on frontend domain
const getBackendUrl = () => {
  // Check if we're on Vercel deployment
  const isVercel =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('.vercel.app') ||
      window.location.hostname.includes('.vercel'));

  if (isVercel) {
    return (
      import.meta.env.VITE_BACKEND_FEATURE_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      'https://empirecompassbackend.vercel.app'
    );
  }

  return (
    import.meta.env.VITE_BACKEND_URL ||
    'https://empirecompassbackend.vercel.app'
  );
};

const BACKEND_URL = getBackendUrl();

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

// ORKG Statistics Update (fetches from ORKG, computes RPL metrics, updates Firebase)
export interface StatisticsProgress {
  templateKey: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  totalPapers: number;
  processedCount: number;
  currentPaper?: string;
  error?: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  globalStats?: Record<string, number>;
}

export const getStatisticsProgress = async (
  template: 'empire' | 'nlp4re',
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<StatisticsProgress | null> => {
  return apiRequest(`/api/statistics/progress/${template}`, {
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateOrkgStatistics = async (
  template: 'empire' | 'nlp4re',
  options: {
    limit?: number;
    updateFirebase?: boolean;
    resume?: boolean;
  } = {},
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/statistics/update', {
    method: 'POST',
    body: JSON.stringify({ template, ...options }),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export type StatisticsStreamEvent =
  | {
      type: 'progress';
      status?: string;
      totalPapers: number;
      processedCount: number;
      currentPaper?: string;
    }
  | {
      type: 'complete';
      success: boolean;
      globalStats?: Record<string, number>;
      firebaseUpdated?: boolean;
      error?: string;
    }
  | { type: 'error'; error: string };

export const updateOrkgStatisticsStream = async (
  template: 'empire' | 'nlp4re',
  options: {
    limit?: number;
    updateFirebase?: boolean;
    resume?: boolean;
  } = {},
  onEvent: (event: StatisticsStreamEvent) => void,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  const token = keycloakToken || getKeycloakToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userId) headers['x-user-id'] = userId;
  if (userEmail) headers['x-user-email'] = userEmail;

  const response = await fetch(`${BACKEND_URL}/api/statistics/update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ template, ...options, stream: true }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(data);
        } catch {
          // skip invalid JSON
        }
      }
    }
  }
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

// ========== News API ==========

export interface NewsItem {
  id?: string;
  title: string;
  content: string;
  author?: string;
  authorId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  published: boolean;
  publishedAt?: string | Date;
  tags?: string[];
  imageUrl?: string;
  priority?: 'low' | 'normal' | 'high';
}

export const getAllNews = async (
  publishedOnly = false,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest<NewsItem[]>(`/api/news?publishedOnly=${publishedOnly}`, {
    method: 'GET',
    userId,
    userEmail,
    requiresAuth: false,
    keycloakToken,
  });
};

export const getNewsItem = async (
  newsId: string,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest<NewsItem>(`/api/news/${newsId}`, {
    method: 'GET',
    userId,
    userEmail,
    requiresAuth: false,
    keycloakToken,
  });
};

export const createNewsItem = async (
  newsData: Omit<NewsItem, 'id'>,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest<NewsItem>('/api/news', {
    method: 'POST',
    body: JSON.stringify(newsData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateNewsItem = async (
  newsId: string,
  updates: Partial<Omit<NewsItem, 'id' | 'createdAt'>>,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest<NewsItem>(`/api/news/${newsId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deleteNewsItem = async (
  newsId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/news/${newsId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

// ========== Papers API ==========

export interface Paper {
  id?: string;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  link?: string;
  description?: string;
  priority?: number;
  showOnTeam?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const getPapers = async (
  showOnTeamOnly = false,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest<Paper[]>(`/api/papers?showOnTeamOnly=${showOnTeamOnly}`, {
    method: 'GET',
    userId,
    userEmail,
    requiresAuth: false,
    keycloakToken,
  });
};

export const getPaper = async (
  paperId: string,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest<Paper>(`/api/papers/${paperId}`, {
    method: 'GET',
    userId,
    userEmail,
    requiresAuth: false,
    keycloakToken,
  });
};

export const createPaper = async (
  paperData: Omit<Paper, 'id'>,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest<Paper>('/api/papers', {
    method: 'POST',
    body: JSON.stringify(paperData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updatePaper = async (
  paperId: string,
  updates: Partial<Omit<Paper, 'id' | 'createdAt'>>,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest<Paper>(`/api/papers/${paperId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deletePaper = async (
  paperId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/papers/${paperId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};
