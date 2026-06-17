import { apiRequest } from './client';

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

export const listUsers = async (
  limit = 50,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/users?limit=${limit}`, {
    method: 'GET',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateUserRole = async (
  targetUserId: string,
  isAdmin: boolean,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/users/${targetUserId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ is_admin: isAdmin }),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deleteUser = async (
  targetUserId: string,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/users/${targetUserId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};
