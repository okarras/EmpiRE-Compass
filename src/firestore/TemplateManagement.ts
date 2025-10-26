import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import RequestLogger from './RequestLogger';

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
 */
export const createTemplate = async (
  templateId: string,
  templateData: TemplateData
): Promise<void> => {
  const templateRef = doc(db, 'Templates', templateId);
  await setDoc(templateRef, templateData);
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
  updates: Partial<TemplateData>
): Promise<void> => {
  const templateRef = doc(db, 'Templates', templateId);
  await updateDoc(templateRef, updates);
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  const templateRef = doc(db, 'Templates', templateId);
  await deleteDoc(templateRef);
};

/**
 * Question CRUD Operations (Nested under Templates)
 */
export const createQuestion = async (
  templateId: string,
  questionId: string,
  questionData: QuestionData,
  userId?: string,
  userEmail?: string
): Promise<void> => {
  const questionRef = doc(db, 'Templates', templateId, 'Questions', questionId);
  try {
    await setDoc(questionRef, questionData);
    await RequestLogger.withLogging.logWrite(
      `Templates/${templateId}/Questions`,
      questionId,
      true,
      userId,
      userEmail,
      undefined,
      questionData
    );
  } catch (error) {
    await RequestLogger.withLogging.logWrite(
      `Templates/${templateId}/Questions`,
      questionId,
      false,
      userId,
      userEmail,
      error instanceof Error ? error.message : 'Unknown error',
      questionData
    );
    throw error;
  }
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
  userId?: string,
  userEmail?: string
): Promise<void> => {
  const questionRef = doc(db, 'Templates', templateId, 'Questions', questionId);
  try {
    await updateDoc(questionRef, updates);
    await RequestLogger.withLogging.logUpdate(
      `Templates/${templateId}/Questions`,
      questionId,
      true,
      userId,
      userEmail,
      undefined,
      updates
    );
  } catch (error) {
    await RequestLogger.withLogging.logUpdate(
      `Templates/${templateId}/Questions`,
      questionId,
      false,
      userId,
      userEmail,
      error instanceof Error ? error.message : 'Unknown error',
      updates
    );
    throw error;
  }
};

export const deleteQuestion = async (
  templateId: string,
  questionId: string,
  userId?: string,
  userEmail?: string
): Promise<void> => {
  const questionRef = doc(db, 'Templates', templateId, 'Questions', questionId);
  try {
    await deleteDoc(questionRef);
    await RequestLogger.withLogging.logDelete(
      `Templates/${templateId}/Questions`,
      questionId,
      true,
      userId,
      userEmail
    );
  } catch (error) {
    await RequestLogger.withLogging.logDelete(
      `Templates/${templateId}/Questions`,
      questionId,
      false,
      userId,
      userEmail,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
};

/**
 * Statistics CRUD Operations (Nested under Templates)
 */
export const createStatistic = async (
  templateId: string,
  statisticId: string,
  statisticData: StatisticData,
  userId?: string,
  userEmail?: string
): Promise<void> => {
  const statisticRef = doc(
    db,
    'Templates',
    templateId,
    'Statistics',
    statisticId
  );
  try {
    await setDoc(statisticRef, statisticData);
    await RequestLogger.withLogging.logWrite(
      `Templates/${templateId}/Statistics`,
      statisticId,
      true,
      userId,
      userEmail,
      undefined,
      statisticData
    );
  } catch (error) {
    await RequestLogger.withLogging.logWrite(
      `Templates/${templateId}/Statistics`,
      statisticId,
      false,
      userId,
      userEmail,
      error instanceof Error ? error.message : 'Unknown error',
      statisticData
    );
    throw error;
  }
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
  userId?: string,
  userEmail?: string
): Promise<void> => {
  const statisticRef = doc(
    db,
    'Templates',
    templateId,
    'Statistics',
    statisticId
  );
  try {
    await updateDoc(statisticRef, updates);
    await RequestLogger.withLogging.logUpdate(
      `Templates/${templateId}/Statistics`,
      statisticId,
      true,
      userId,
      userEmail,
      undefined,
      updates
    );
  } catch (error) {
    await RequestLogger.withLogging.logUpdate(
      `Templates/${templateId}/Statistics`,
      statisticId,
      false,
      userId,
      userEmail,
      error instanceof Error ? error.message : 'Unknown error',
      updates
    );
    throw error;
  }
};

export const deleteStatistic = async (
  templateId: string,
  statisticId: string,
  userId?: string,
  userEmail?: string
): Promise<void> => {
  const statisticRef = doc(
    db,
    'Templates',
    templateId,
    'Statistics',
    statisticId
  );
  try {
    await deleteDoc(statisticRef);
    await RequestLogger.withLogging.logDelete(
      `Templates/${templateId}/Statistics`,
      statisticId,
      true,
      userId,
      userEmail
    );
  } catch (error) {
    await RequestLogger.withLogging.logDelete(
      `Templates/${templateId}/Statistics`,
      statisticId,
      false,
      userId,
      userEmail,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
};

/**
 * Batch Operations
 */
export const importTemplateWithQuestions = async (
  templateId: string,
  templateData: TemplateData,
  questions: QuestionData[],
  statistics: StatisticData[]
): Promise<void> => {
  const batch = writeBatch(db);

  // Create template
  const templateRef = doc(db, 'Templates', templateId);
  batch.set(templateRef, templateData);

  // Create questions
  questions.forEach((question) => {
    const questionRef = doc(
      db,
      'Templates',
      templateId,
      'Questions',
      question.uid
    );
    batch.set(questionRef, question);
  });

  // Create statistics
  statistics.forEach((statistic) => {
    const statisticRef = doc(
      db,
      'Templates',
      templateId,
      'Statistics',
      statistic.id
    );
    batch.set(statisticRef, statistic);
  });

  await batch.commit();
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
