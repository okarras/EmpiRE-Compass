import { apiRequest } from './client';

export const getDynamicQuestions = async (limit?: number) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  const queryString = params.toString();
  const endpoint = `/api/dynamic-questions${queryString ? `?${queryString}` : ''}`;
  return apiRequest(endpoint);
};

export const getCommunityQuestions = async (limit?: number) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  const queryString = params.toString();
  const endpoint = `/api/dynamic-questions/community${queryString ? `?${queryString}` : ''}`;
  return apiRequest(endpoint);
};

export const getDynamicQuestion = async (questionId: string) => {
  return apiRequest(`/api/dynamic-questions/${questionId}`);
};

export const createDynamicQuestion = async (
  questionData: any,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/dynamic-questions', {
    method: 'POST',
    body: JSON.stringify(questionData),
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};

export const updateDynamicQuestion = async (
  questionId: string,
  questionData: any,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/dynamic-questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(questionData),
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};

export const deleteDynamicQuestion = async (
  questionId: string,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/dynamic-questions/${questionId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};

export const toggleDynamicQuestionLike = async (
  questionId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/dynamic-questions/${questionId}/toggle-like`, {
    method: 'PATCH',
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};
