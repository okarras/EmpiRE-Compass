import { apiRequest } from './client';

export interface AiEvaluationPayload {
  targetType: 'chart' | 'question' | 'sparql';
  targetId: string;
  rating: number;
  comment?: string;
}

export const submitAiEvaluation = async (
  evaluationData: AiEvaluationPayload,
  userId: string,
  userEmail: string,
  keycloakToken?: string
) => {
  return apiRequest('/api/ai-evaluations', {
    method: 'POST',
    body: JSON.stringify(evaluationData),
    userId,
    userEmail,
    requiresAuth: true,
    keycloakToken,
  });
};
