// DocumentData no longer needed - using backend API types
import {
  getQuestions as getQuestionsApi,
  createQuestion as createQuestionApi,
} from '../services/backendApi';
import { queries } from '../constants/queries_chart_info.js';

/**
 * UPDATED: Now uses backend API instead of direct Firestore access
 * Questions are stored in: Templates/{templateId}/Questions/{questionId}
 */

/**
 * Add multiple questions via backend API (legacy function - use createQuestion from backendApi directly)
 * @deprecated Use createQuestion from backendApi directly instead
 */
const addQuestion = async (
  templateId = 'R186491',
  userId?: string,
  userEmail?: string,
  keycloakToken?: string
) => {
  if (!userId || !userEmail) {
    throw new Error('UserId and userEmail are required for creating questions');
  }

  try {
    for (const query of queries) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { dataProcessingFunction, chartSettings, ...rest } = query;
      await createQuestionApi(
        templateId,
        { ...rest, uid: query.uid },
        userId,
        userEmail,
        keycloakToken
      );
    }
  } catch (e) {
    console.error('Error adding questions:', e);
    throw e;
  }
};

/**
 * Get questions from backend API
 * @param templateId - Template ID (defaults to R186491)
 */
const getQuestions = async (templateId = 'R186491') => {
  try {
    const questions = await getQuestionsApi(templateId);
    return Array.isArray(questions) ? questions : [];
  } catch (error) {
    console.error('Error fetching questions from backend:', error);
    throw error;
  }
};

const CRUDQuestions = {
  addQuestion,
  getQuestions,
};

export default CRUDQuestions;
