import { apiRequest } from './client';

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
