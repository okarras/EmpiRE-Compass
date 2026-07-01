import { apiRequest } from './client';

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
