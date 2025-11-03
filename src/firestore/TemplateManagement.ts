import { db } from '../firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
  createTemplate as createTemplateApi,
  updateTemplate as updateTemplateApi,
  deleteTemplate as deleteTemplateApi,
  createQuestion as createQuestionApi,
  updateQuestion as updateQuestionApi,
  deleteQuestion as deleteQuestionApi,
  createStatistic as createStatisticApi,
  updateStatistic as updateStatisticApi,
  deleteStatistic as deleteStatisticApi,
} from '../services/backendApi';

/**
 * New Firebase Structure:
 *
 * Templates (collection)
 *   └─ {templateId} (document)
 *       ├─ id: string
 *       ├─ title: string
 *       ├─ collectionName: string
 *       ├─ Questions (subcollection)
 *       │   └─ {questionId} (document)
 *       │       ├─ id: number
 *       │       ├─ uid: string
 *       │       ├─ title: string
 *       │       ├─ dataAnalysisInformation: object
 *       │       └─ sparqlQuery: string
 *       └─ Statistics (subcollection)
 *           └─ {statisticId} (document)
 *               ├─ id: string
 *               ├─ name: string
 *               └─ sparqlQuery: string
 *
 * Users (collection) - remains flat
 */

export interface TemplateData {
  id: string;
  title: string;
  collectionName: string;
  description?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface QuestionData {
  id: number;
  uid: string;
  uid_2?: string;
  uid_2_merge?: string;
  title: string;
  chartType?: 'bar' | 'pie';
  dataAnalysisInformation: {
    question: string;
    questionExplanation?: string | string[];
    dataAnalysis?: string | string[];
    dataInterpretation?: string | string[];
    requiredDataForAnalysis?: string | string[];
  };
  sparqlQuery?: string;
  sparqlQuery2?: string;
  chartSettings?: any; // Complete chart configuration
  chartSettings2?: any; // Second chart configuration for dual queries
  dataProcessingFunctionName?: string; // Reference to processing function
  dataProcessingFunctionName2?: string; // Reference to second processing function
  tabs?: {
    tab1_name: string;
    tab2_name: string;
  };
  gridOptions?: {
    defaultColumns?: string[]; // Default columns to show in grid statistics
    defaultGroupBy?: string; // Default grouping column
  };
}

export interface StatisticData {
  id: string;
  name: string;
  sparqlQuery: string;
  description?: string;
}

/**
 * Template CRUD Operations
 * Write operations now use backend API
 */
export const createTemplate = async (
  templateId: string,
  templateData: TemplateData,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  await createTemplateApi(
    { ...templateData, id: templateId },
    userId,
    userEmail,
    keycloakToken
  );
};

export const getTemplate = async (
  templateId: string
): Promise<TemplateData | null> => {
  const templateRef = doc(db, 'Templates', templateId);
  const templateSnap = await getDoc(templateRef);

  if (templateSnap.exists()) {
    return templateSnap.data() as TemplateData;
  }
  return null;
};

export const getAllTemplates = async (): Promise<
  Record<string, TemplateData>
> => {
  const templatesSnapshot = await getDocs(collection(db, 'Templates'));
  const templates: Record<string, TemplateData> = {};

  templatesSnapshot.forEach((doc) => {
    templates[doc.id] = doc.data() as TemplateData;
  });

  return templates;
};

export const updateTemplate = async (
  templateId: string,
  updates: Partial<TemplateData>,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  await updateTemplateApi(
    templateId,
    updates,
    userId,
    userEmail,
    keycloakToken
  );
};

export const deleteTemplate = async (
  templateId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  await deleteTemplateApi(templateId, userId, userEmail, keycloakToken);
};

/**
 * Question CRUD Operations (Nested under Templates)
 */
export const createQuestion = async (
  templateId: string,
  _questionId: string, // Unused - backend API creates ID from questionData
  questionData: QuestionData,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  await createQuestionApi(
    templateId,
    questionData,
    userId,
    userEmail,
    keycloakToken
  );
};

export const getQuestion = async (
  templateId: string,
  questionId: string
): Promise<QuestionData | null> => {
  const questionRef = doc(db, 'Templates', templateId, 'Questions', questionId);
  const questionSnap = await getDoc(questionRef);

  if (questionSnap.exists()) {
    return questionSnap.data() as QuestionData;
  }
  return null;
};

export const getAllQuestions = async (
  templateId: string
): Promise<QuestionData[]> => {
  const questionsSnapshot = await getDocs(
    collection(db, 'Templates', templateId, 'Questions')
  );
  const questions: QuestionData[] = [];

  questionsSnapshot.forEach((doc) => {
    questions.push(doc.data() as QuestionData);
  });

  return questions.sort((a, b) => a.id - b.id);
};

export const updateQuestion = async (
  templateId: string,
  questionId: string,
  updates: Partial<QuestionData>,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  // Get existing question data and merge with updates
  const existingQuestion = await getQuestion(templateId, questionId);
  const updatedQuestion = { ...existingQuestion, ...updates } as QuestionData;
  await updateQuestionApi(
    templateId,
    questionId,
    updatedQuestion,
    userId,
    userEmail,
    keycloakToken
  );
};

export const deleteQuestion = async (
  templateId: string,
  questionId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  await deleteQuestionApi(
    templateId,
    questionId,
    userId,
    userEmail,
    keycloakToken
  );
};

/**
 * Statistics CRUD Operations (Nested under Templates)
 */
export const createStatistic = async (
  templateId: string,
  _statisticId: string, // Unused - backend API creates ID from statisticData
  statisticData: StatisticData,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  await createStatisticApi(
    templateId,
    statisticData,
    userId,
    userEmail,
    keycloakToken
  );
};

export const getStatistic = async (
  templateId: string,
  statisticId: string
): Promise<StatisticData | null> => {
  const statisticRef = doc(
    db,
    'Templates',
    templateId,
    'Statistics',
    statisticId
  );
  const statisticSnap = await getDoc(statisticRef);

  if (statisticSnap.exists()) {
    return statisticSnap.data() as StatisticData;
  }
  return null;
};

export const getAllStatistics = async (
  templateId: string
): Promise<StatisticData[]> => {
  const statisticsSnapshot = await getDocs(
    collection(db, 'Templates', templateId, 'Statistics')
  );
  const statistics: StatisticData[] = [];

  statisticsSnapshot.forEach((doc) => {
    statistics.push(doc.data() as StatisticData);
  });

  return statistics;
};

export const updateStatistic = async (
  templateId: string,
  statisticId: string,
  updates: Partial<StatisticData>,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  // Get existing statistic data and merge with updates
  const existingStatistic = await getStatistic(templateId, statisticId);
  const updatedStatistic = {
    ...existingStatistic,
    ...updates,
  } as StatisticData;
  await updateStatisticApi(
    templateId,
    statisticId,
    updatedStatistic,
    userId,
    userEmail,
    keycloakToken
  );
};

export const deleteStatistic = async (
  templateId: string,
  statisticId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  await deleteStatisticApi(
    templateId,
    statisticId,
    userId,
    userEmail,
    keycloakToken
  );
};

/**
 * Batch Operations
 */
export const importTemplateWithQuestions = async (
  templateId: string,
  templateData: TemplateData,
  questions: QuestionData[],
  statistics: StatisticData[],
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<void> => {
  // Note: This function should use backend API instead of direct Firestore writes
  // Use individual backend API calls for each operation
  if (!userId || !userEmail) {
    throw new Error(
      'UserId and userEmail are required for importing templates'
    );
  }

  // Create template via backend API
  await createTemplateApi(
    { ...templateData, id: templateId },
    userId,
    userEmail,
    keycloakToken
  );

  // Create questions via backend API
  for (const question of questions) {
    await createQuestionApi(
      templateId,
      question,
      userId,
      userEmail,
      keycloakToken
    );
  }

  // Create statistics via backend API
  for (const statistic of statistics) {
    await createStatisticApi(
      templateId,
      statistic,
      userId,
      userEmail,
      keycloakToken
    );
  }
};

/**
 * Get complete template with all nested data
 */
export const getCompleteTemplate = async (
  templateId: string
): Promise<{
  template: TemplateData | null;
  questions: QuestionData[];
  statistics: StatisticData[];
}> => {
  const template = await getTemplate(templateId);
  const questions = await getAllQuestions(templateId);
  const statistics = await getAllStatistics(templateId);

  return {
    template,
    questions,
    statistics,
  };
};

/**
 * Export template data in the new format
 */
export const exportTemplateData = async (templateId: string) => {
  const data = await getCompleteTemplate(templateId);
  return data;
};

const TemplateManagement = {
  // Template operations
  createTemplate,
  getTemplate,
  getAllTemplates,
  updateTemplate,
  deleteTemplate,

  // Question operations
  createQuestion,
  getQuestion,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,

  // Statistics operations
  createStatistic,
  getStatistic,
  getAllStatistics,
  updateStatistic,
  deleteStatistic,

  // Batch operations
  importTemplateWithQuestions,
  getCompleteTemplate,
  exportTemplateData,
};

export default TemplateManagement;
