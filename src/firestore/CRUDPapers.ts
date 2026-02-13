/**
 * CRUD operations for Papers collection
 * Papers are published papers stored in Firebase via backend API
 */

import {
  getPapers as getPapersApi,
  getPaper as getPaperApi,
  createPaper as createPaperApi,
  updatePaper as updatePaperApi,
  deletePaper as deletePaperApi,
  Paper as ApiPaper,
} from '../services/backendApi';
import { getKeycloakToken } from '../auth/keycloakStore';

export interface Paper {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  link?: string;
  description?: string;
  priority?: number;
  showOnTeam?: boolean;
  createdAt?: Date | string | number;
  updatedAt?: Date | string | number;
}

const convertApiPaper = (apiItem: ApiPaper): Paper => {
  return {
    ...apiItem,
    id: apiItem.id || '',
  } as Paper;
};

const getAuthInfo = () => {
  try {
    const token = getKeycloakToken();
    return { token, userId: undefined, userEmail: undefined };
  } catch {
    return { token: undefined, userId: undefined, userEmail: undefined };
  }
};

/**
 * Get papers from backend API
 * @param showOnTeamOnly - If true, only return papers marked to show on Team page
 */
export const getPapers = async (showOnTeamOnly = false): Promise<Paper[]> => {
  try {
    const { token, userId, userEmail } = getAuthInfo();
    const apiItems = await getPapersApi(
      showOnTeamOnly,
      userId,
      userEmail,
      token || undefined
    );
    return apiItems.map(convertApiPaper);
  } catch (error) {
    console.error('Error fetching papers:', error);
    throw error;
  }
};

export const getPaper = async (paperId: string): Promise<Paper | null> => {
  try {
    const { token, userId, userEmail } = getAuthInfo();
    const apiItem = await getPaperApi(
      paperId,
      userId,
      userEmail,
      token || undefined
    );
    return convertApiPaper(apiItem);
  } catch (error) {
    console.error('Error fetching paper:', error);
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

export const createPaper = async (
  paperData: Omit<Paper, 'id'> & { id?: string },
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<string> => {
  if (!userId || !userEmail) {
    throw new Error('User ID and email are required to create papers.');
  }

  try {
    const { token } = getAuthInfo();
    const itemToCreate: Omit<ApiPaper, 'id'> = {
      ...paperData,
      createdAt: paperData.createdAt
        ? typeof paperData.createdAt === 'string'
          ? paperData.createdAt
          : paperData.createdAt instanceof Date
            ? paperData.createdAt.toISOString()
            : new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await createPaperApi(
      itemToCreate,
      userId,
      userEmail,
      keycloakToken || token || undefined
    );
    return result.id || '';
  } catch (error) {
    console.error('Error creating paper:', error);
    throw error;
  }
};

export const updatePaper = async (
  paperId: string,
  updates: Partial<Omit<Paper, 'id' | 'createdAt'>>,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<void> => {
  if (!userId || !userEmail) {
    throw new Error('User ID and email are required to update papers.');
  }

  try {
    const { token } = getAuthInfo();
    const updateData: Partial<Omit<ApiPaper, 'id' | 'createdAt'>> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updatePaperApi(
      paperId,
      updateData,
      userId,
      userEmail,
      keycloakToken || token || undefined
    );
  } catch (error) {
    console.error('Error updating paper:', error);
    throw error;
  }
};

export const deletePaper = async (
  paperId: string,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<void> => {
  if (!userId || !userEmail) {
    throw new Error('User ID and email are required to delete papers.');
  }

  try {
    const { token } = getAuthInfo();
    await deletePaperApi(
      paperId,
      userId,
      userEmail,
      keycloakToken || token || undefined
    );
  } catch (error) {
    console.error('Error deleting paper:', error);
    throw error;
  }
};

export default {
  getPapers,
  getPaper,
  createPaper,
  updatePaper,
  deletePaper,
};
