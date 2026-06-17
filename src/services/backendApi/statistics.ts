import { apiRequest, BACKEND_URL, getKeycloakToken } from './client';

export const getStatistics = async (templateId: string) => {
  return apiRequest(`/api/templates/${templateId}/statistics`);
};

export const createStatistic = async (
  templateId: string,
  statisticData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/statistics`, {
    method: 'POST',
    body: JSON.stringify(statisticData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateStatistic = async (
  templateId: string,
  statisticId: string,
  statisticData: any,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/statistics/${statisticId}`, {
    method: 'PUT',
    body: JSON.stringify(statisticData),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const deleteStatistic = async (
  templateId: string,
  statisticId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/templates/${templateId}/statistics/${statisticId}`, {
    method: 'DELETE',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export interface StatisticsProgress {
  templateKey: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  totalPapers: number;
  processedCount: number;
  currentPaper?: string;
  error?: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  globalStats?: Record<string, number>;
}

export const getStatisticsProgress = async (
  template: 'empire' | 'nlp4re',
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<StatisticsProgress | null> => {
  return apiRequest(`/api/statistics/progress/${template}`, {
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const updateOrkgStatistics = async (
  template: 'empire' | 'nlp4re',
  options: {
    limit?: number;
    updateFirebase?: boolean;
    resume?: boolean;
  } = {},
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/statistics/update', {
    method: 'POST',
    body: JSON.stringify({ template, ...options }),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export type StatisticsStreamEvent =
  | {
      type: 'progress';
      status?: string;
      totalPapers: number;
      processedCount: number;
      currentPaper?: string;
    }
  | {
      type: 'complete';
      success: boolean;
      globalStats?: Record<string, number>;
      firebaseUpdated?: boolean;
      error?: string;
    }
  | { type: 'error'; error: string };

export const updateOrkgStatisticsStream = async (
  template: 'empire' | 'nlp4re',
  options: {
    limit?: number;
    updateFirebase?: boolean;
    resume?: boolean;
  } = {},
  onEvent: (event: StatisticsStreamEvent) => void,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  const token = keycloakToken || getKeycloakToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userId) headers['x-user-id'] = userId;
  if (userEmail) headers['x-user-email'] = userEmail;

  const response = await fetch(`${BACKEND_URL}/api/statistics/update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ template, ...options, stream: true }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(data);
        } catch {
          // skip invalid JSON
        }
      }
    }
  }
};
