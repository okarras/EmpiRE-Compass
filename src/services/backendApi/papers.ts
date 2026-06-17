import { apiRequest } from './client';

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
