import { apiRequest } from './client';

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
