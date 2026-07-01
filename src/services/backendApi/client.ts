/* eslint-disable @typescript-eslint/no-explicit-any */

import { getKeycloakToken as getKeycloakTokenFromStore } from '../../auth/keycloakStore';

const getBackendUrl = () => {
  const isVercel =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('.vercel.app') ||
      window.location.hostname.includes('.vercel'));

  if (isVercel) {
    return (
      import.meta.env.VITE_BACKEND_FEATURE_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      'https://empirecompassbackend.vercel.app'
    );
  }

  return (
    import.meta.env.VITE_BACKEND_URL ||
    'https://empirecompassbackend.vercel.app'
  );
};

export const BACKEND_URL = getBackendUrl();

export interface ApiRequestOptions extends RequestInit {
  userId?: string;
  userEmail?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  keycloakToken?: string;
}

export const getKeycloakToken = (): string | null => {
  try {
    return getKeycloakTokenFromStore();
  } catch (error) {
    console.warn('Failed to get Keycloak token:', error);
    return null;
  }
};

export const apiRequest = async <T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const {
    userId,
    userEmail,
    requiresAuth = false,
    requiresAdmin = false,
    keycloakToken,
    headers = {},
    ...fetchOptions
  } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const token = keycloakToken || getKeycloakToken();
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (requiresAuth || requiresAdmin) {
    if (userId) {
      requestHeaders['x-user-id'] = userId;
    }
    if (userEmail) {
      requestHeaders['x-user-email'] = userEmail;
    }
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};
