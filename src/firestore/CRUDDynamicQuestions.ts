/**
 * CRUD operations for Dynamic Questions through backend API.
 * Frontend never accesses Firestore directly.
 */

import BackupService from '../services/BackupService';
import {
  createDynamicQuestion,
  deleteDynamicQuestion as deleteDynamicQuestionApi,
  getCommunityQuestions as getCommunityQuestionsApi,
  getDynamicQuestion as getDynamicQuestionApi,
  getDynamicQuestions as getDynamicQuestionsApi,
  toggleDynamicQuestionLike,
  updateDynamicQuestion,
} from '../services/backendApi';
import { getKeycloakToken } from '../auth/keycloakStore';

export interface DynamicQuestion {
  id: string;
  name: string;
  timestamp: number;
  templateId?: string;
  isCommunity?: boolean;
  createdBy?: string;
  creatorName?: string;
  state: {
    question: string;
    sparqlQuery: string;
    sparqlTranslation?: string | null;
    queryResults?: any[] | null;
    chartHtml?: string | null;
    questionInterpretation?: string | null;
    dataCollectionInterpretation?: string | null;
    dataAnalysisInterpretation?: string | null;
    processingFunctionCode?: string | null;
    history?: any[] | null;
    templateId?: string | null;
    templateMapping?: Record<string, any> | null;
    targetClassId?: string | null;
  };
  status?: 'pending' | 'published' | 'rejected';
  publishedAt?: number;
  reviewerId?: string;
  likes?: number;
  likedBy?: string[];
}

const sortByTimestampDesc = (items: DynamicQuestion[]) =>
  [...items].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

export const toggleLike = async (
  questionId: string,
  userId: string,
  _isCommunity: boolean = true
): Promise<DynamicQuestion | null> => {
  try {
    const updated = (await toggleDynamicQuestionLike(
      questionId,
      userId,
      '',
      getKeycloakToken() || undefined
    )) as DynamicQuestion;
    return updated || null;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

export const getCommunityQuestions = async (
  limitCount = 50
): Promise<DynamicQuestion[]> => {
  try {
    const questions = (await getCommunityQuestionsApi(limitCount)) as
      | DynamicQuestion[]
      | null;
    return Array.isArray(questions) ? sortByTimestampDesc(questions) : [];
  } catch (error) {
    console.error('Error fetching community questions:', error);
    throw error;
  }
};

export const getDynamicQuestion = async (
  questionId: string
): Promise<DynamicQuestion | null> => {
  if (BackupService.isExplicitlyUsingBackup()) {
    try {
      const questions = await BackupService.getDynamicQuestions();
      const question = questions.find((q: any) => q.id === questionId);
      return question ? (question as DynamicQuestion) : null;
    } catch {
      // fall through to backend
    }
  }

  try {
    const question = (await getDynamicQuestionApi(
      questionId
    )) as DynamicQuestion | null;
    return question || null;
  } catch (error) {
    console.warn('Backend failed, falling back to backup:', error);
    try {
      const questions = await BackupService.getDynamicQuestions();
      const question = questions.find((q: any) => q.id === questionId);
      return question ? (question as DynamicQuestion) : null;
    } catch {
      return null;
    }
  }
};

export const getCommunityQuestion = async (
  questionId: string
): Promise<DynamicQuestion | null> => {
  const question = await getDynamicQuestion(questionId);
  if (!question || !question.isCommunity) {
    return null;
  }
  return question;
};

export const saveDynamicQuestion = async (
  question: DynamicQuestion,
  questionId?: string
): Promise<void> => {
  const id = questionId || question.id;
  const payload = {
    ...question,
    id,
    templateId: question.state?.templateId || question.templateId || null,
    ...(question.isCommunity && !question.status
      ? { status: 'pending' as const }
      : {}),
  };

  // Remove undefined values before sending.
  const cleanData = JSON.parse(JSON.stringify(payload));
  const token = getKeycloakToken() || undefined;

  if (questionId) {
    await updateDynamicQuestion(id, cleanData, undefined, undefined, token);
  } else {
    await createDynamicQuestion(cleanData, undefined, undefined, token);
  }
};

export const importDynamicQuestions = async (
  questions: DynamicQuestion[]
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const question of questions) {
    try {
      await saveDynamicQuestion(question, question.id);
      success++;
    } catch (error) {
      console.error(`Failed to import question ${question.id}:`, error);
      failed++;
    }
  }

  return { success, failed };
};

export const getDynamicQuestionsByTemplate = async (
  templateId: string,
  limitCount = 50
): Promise<DynamicQuestion[]> => {
  if (BackupService.isExplicitlyUsingBackup()) {
    try {
      const questions = await BackupService.getDynamicQuestions();
      return sortByTimestampDesc(
        questions.filter((q: any) => {
          const tId = q.templateId || q.state?.templateId;
          return tId === templateId;
        }) as DynamicQuestion[]
      ).slice(0, limitCount);
    } catch {
      // fall through
    }
  }

  try {
    const questions = (await getDynamicQuestionsApi(limitCount)) as
      | DynamicQuestion[]
      | null;
    if (!Array.isArray(questions)) return [];
    return questions.filter((q) => {
      const tId = q.templateId || q.state?.templateId;
      return tId === templateId;
    });
  } catch (error) {
    console.warn('Backend failed, falling back to backup:', error);
    const questions = await BackupService.getDynamicQuestions();
    return sortByTimestampDesc(
      questions.filter((q: any) => {
        const tId = q.templateId || q.state?.templateId;
        return tId === templateId;
      }) as DynamicQuestion[]
    ).slice(0, limitCount);
  }
};

export const deleteDynamicQuestion = async (
  questionId: string,
  _isCommunity: boolean = false
): Promise<void> => {
  await deleteDynamicQuestionApi(
    questionId,
    undefined,
    undefined,
    getKeycloakToken() || undefined
  );
};

export const getDynamicQuestions = async (
  limitCount = 50
): Promise<DynamicQuestion[]> => {
  if (BackupService.isExplicitlyUsingBackup()) {
    try {
      const questions = await BackupService.getDynamicQuestions();
      return sortByTimestampDesc(questions as DynamicQuestion[]).slice(
        0,
        limitCount
      );
    } catch {
      // fall through
    }
  }

  try {
    const questions = (await getDynamicQuestionsApi(limitCount)) as
      | DynamicQuestion[]
      | null;
    return Array.isArray(questions) ? questions : [];
  } catch (error) {
    console.warn('Backend failed, falling back to backup:', error);
    const questions = await BackupService.getDynamicQuestions();
    return sortByTimestampDesc(questions as DynamicQuestion[]).slice(
      0,
      limitCount
    );
  }
};

const CRUDDynamicQuestions = {
  getDynamicQuestions,
  getCommunityQuestions,
  getCommunityQuestion,
  getDynamicQuestion,
  getDynamicQuestionsByTemplate,
  saveDynamicQuestion,
  deleteDynamicQuestion,
  importDynamicQuestions,
  toggleLike,
};

export default CRUDDynamicQuestions;
