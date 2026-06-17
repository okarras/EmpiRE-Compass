import { apiRequest } from './client';

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
