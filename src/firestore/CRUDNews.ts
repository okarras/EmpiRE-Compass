/**
 * CRUD operations for News collection
 * News items are announcements and updates stored in Firebase via backend API
 */

import {
  getAllNews as getAllNewsApi,
  getNewsItem as getNewsItemApi,
  createNewsItem as createNewsItemApi,
  updateNewsItem as updateNewsItemApi,
  deleteNewsItem as deleteNewsItemApi,
  NewsItem as ApiNewsItem,
} from '../services/backendApi';
import { getKeycloakToken } from '../auth/keycloakStore';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  author?: string;
  authorId?: string;
  createdAt: Date | string | number;
  updatedAt?: Date | string | number;
  published: boolean;
  publishedAt?: Date | string | number;
  tags?: string[];
  imageUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  showOnHome?: boolean;
}

// Helper to convert API NewsItem to local NewsItem format
const convertApiNewsItem = (apiItem: ApiNewsItem): NewsItem => {
  return {
    ...apiItem,
    id: apiItem.id || '',
  } as NewsItem;
};

// Helper to get auth info
const getAuthInfo = () => {
  try {
    const token = getKeycloakToken();
    // Note: We'll need to get userId and userEmail from auth context
    // For now, we'll pass undefined and let the backend handle it
    return { token, userId: undefined, userEmail: undefined };
  } catch {
    return { token: undefined, userId: undefined, userEmail: undefined };
  }
};

/**
 * Get all news items from backend API
 * @param publishedOnly - If true, only return published news items
 */
export const getAllNews = async (
  publishedOnly = false
): Promise<NewsItem[]> => {
  try {
    const { token, userId, userEmail } = getAuthInfo();
    const apiItems = await getAllNewsApi(
      publishedOnly,
      userId,
      userEmail,
      token || undefined
    );
    return apiItems.map(convertApiNewsItem);
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

/**
 * Get a single news item by ID from backend API
 * @param newsId - The ID of the news item to fetch
 */
export const getNewsItem = async (newsId: string): Promise<NewsItem | null> => {
  try {
    const { token, userId, userEmail } = getAuthInfo();
    const apiItem = await getNewsItemApi(
      newsId,
      userId,
      userEmail,
      token || undefined
    );
    return convertApiNewsItem(apiItem);
  } catch (error) {
    console.error('Error fetching news item:', error);
    // Return null if 404, throw for other errors
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

/**
 * Create a new news item via backend API
 * @param newsData - The news item data (without id, or with id for custom ID)
 * @param userId - User ID for authentication
 * @param userEmail - User email for authentication
 * @param keycloakToken - Optional Keycloak token
 */
export const createNewsItem = async (
  newsData: Omit<NewsItem, 'id'> & { id?: string },
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<string> => {
  if (!userId || !userEmail) {
    throw new Error('User ID and email are required to create news items.');
  }

  try {
    const { token } = getAuthInfo();
    const itemToCreate: Omit<ApiNewsItem, 'id'> = {
      ...newsData,
      createdAt: newsData.createdAt
        ? typeof newsData.createdAt === 'string'
          ? newsData.createdAt
          : newsData.createdAt instanceof Date
            ? newsData.createdAt.toISOString()
            : new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: newsData.updatedAt
        ? typeof newsData.updatedAt === 'string'
          ? newsData.updatedAt
          : newsData.updatedAt instanceof Date
            ? newsData.updatedAt.toISOString()
            : new Date().toISOString()
        : new Date().toISOString(),
      publishedAt: newsData.publishedAt
        ? typeof newsData.publishedAt === 'string'
          ? newsData.publishedAt
          : newsData.publishedAt instanceof Date
            ? newsData.publishedAt.toISOString()
            : undefined
        : undefined,
    };

    // Include id if provided in newsData
    const itemWithId = newsData.id
      ? { ...itemToCreate, id: newsData.id }
      : itemToCreate;

    const result = await createNewsItemApi(
      itemWithId,
      userId,
      userEmail,
      keycloakToken || token || undefined
    );
    return result.id || '';
  } catch (error) {
    console.error('Error creating news item:', error);
    throw error;
  }
};

/**
 * Update an existing news item via backend API
 * @param newsId - The ID of the news item to update
 * @param updates - Partial news item data to update
 * @param userId - User ID for authentication
 * @param userEmail - User email for authentication
 * @param keycloakToken - Optional Keycloak token
 */
export const updateNewsItem = async (
  newsId: string,
  updates: Partial<Omit<NewsItem, 'id' | 'createdAt'>>,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<void> => {
  if (!userId || !userEmail) {
    throw new Error('User ID and email are required to update news items.');
  }

  try {
    const { token } = getAuthInfo();
    const updateData: Partial<Omit<ApiNewsItem, 'id' | 'createdAt'>> = {
      ...updates,
      updatedAt: updates.updatedAt
        ? typeof updates.updatedAt === 'string'
          ? updates.updatedAt
          : updates.updatedAt instanceof Date
            ? updates.updatedAt.toISOString()
            : new Date().toISOString()
        : new Date().toISOString(),
      publishedAt: updates.publishedAt
        ? typeof updates.publishedAt === 'string'
          ? updates.publishedAt
          : updates.publishedAt instanceof Date
            ? updates.publishedAt.toISOString()
            : undefined
        : undefined,
    };

    await updateNewsItemApi(
      newsId,
      updateData,
      userId,
      userEmail,
      keycloakToken || token || undefined
    );
  } catch (error) {
    console.error('Error updating news item:', error);
    throw error;
  }
};

/**
 * Delete a news item via backend API
 * @param newsId - The ID of the news item to delete
 * @param userId - User ID for authentication
 * @param userEmail - User email for authentication
 * @param keycloakToken - Optional Keycloak token
 */
export const deleteNewsItem = async (
  newsId: string,
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<void> => {
  if (!userId || !userEmail) {
    throw new Error('User ID and email are required to delete news items.');
  }

  try {
    const { token } = getAuthInfo();
    await deleteNewsItemApi(
      newsId,
      userId,
      userEmail,
      keycloakToken || token || undefined
    );
  } catch (error) {
    console.error('Error deleting news item:', error);
    throw error;
  }
};

export default {
  getAllNews,
  getNewsItem,
  createNewsItem,
  updateNewsItem,
  deleteNewsItem,
};
