import { apiRequest } from './client';

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
