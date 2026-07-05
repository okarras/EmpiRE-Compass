import {
  submitAiEvaluation as submitApi,
  AiEvaluationPayload,
} from '../services/backendApi';
import { getKeycloakToken } from '../auth/keycloakStore';

export const submitAiEvaluation = async (
  payload: AiEvaluationPayload,
  userId: string,
  userEmail: string = ''
): Promise<{ id: string; message: string }> => {
  try {
    const token = getKeycloakToken() || undefined;
    const response = await submitApi(payload, userId, userEmail, token);
    return response;
  } catch (error) {
    console.error('Error submitting AI evaluation:', error);
    throw error;
  }
};

const CRUDAiEvaluations = {
  submitAiEvaluation,
};

export default CRUDAiEvaluations;
