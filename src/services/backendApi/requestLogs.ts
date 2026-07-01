import { apiRequest } from './client';

export interface RequestLog {
  id: string;
  timestamp: string;
  operation: 'read' | 'write' | 'update' | 'delete' | 'query';
  collection: string;
  documentId?: string;
  userId?: string;
  userEmail?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
  requestBody?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
}

export interface RequestLogsResponse {
  logs: RequestLog[];
  count: number;
  filters: {
    collection?: string;
    operation?: string;
    success?: string;
  };
}

export const getRequestLogs = async (
  options?: {
    limit?: number;
    collection?: string;
    operation?: string;
    success?: boolean;
  },
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
): Promise<RequestLogsResponse> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.collection) params.append('collection', options.collection);
  if (options?.operation) params.append('operation', options.operation);
  if (options?.success !== undefined)
    params.append('success', options.success.toString());

  const queryString = params.toString();
  const endpoint = `/api/request-logs${queryString ? `?${queryString}` : ''}`;

  return apiRequest(endpoint, {
    method: 'GET',
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};
