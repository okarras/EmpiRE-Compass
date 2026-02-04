import {
  getQuestions as getQuestionsApi,
  createQuestion as createQuestionApi,
} from '../services/backendApi';
import BackupService from '../services/BackupService';
import { queries } from '../constants/queries_chart_info.js';

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
    console.warn('Backend API failed, falling back to local backup:', error);
    try {
      return await BackupService.getQuestions(templateId);
    } catch (backupError) {
      console.error('Error fetching questions from backup:', backupError);
      throw backupError;
    }
  }
};

const CRUDQuestions = {
  addQuestion,
  getQuestions,
};

export default CRUDQuestions;
