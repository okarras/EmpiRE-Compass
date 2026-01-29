/**
 * CRUD operations for Dynamic Questions collection
 * Dynamic Questions are example questions stored in Firebase for users to reference
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';

export interface DynamicQuestion {
  id: string;
  name: string;
  timestamp: number;
  templateId?: string; // Stored at root level for Firestore indexing
  isCommunity?: boolean; // Flag to indicate if this is a community question
  createdBy?: string; // User ID of creator (for community questions)
  creatorName?: string; // Display name of creator
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
}

/**
 * Get all dynamic questions (examples) from Firebase
 * @param limitCount - Maximum number of questions to return (default: 50)
 */
export const getDynamicQuestions = async (
  limitCount = 50
): Promise<DynamicQuestion[]> => {
  if (!db) {
    console.warn(
      'Firebase is not initialized. Cannot fetch dynamic questions.'
    );
    return [];
  }

  try {
    const questionsRef = collection(db, 'DynamicQuestions');
    // We filter OUT community questions from the main list if needed, or keeping them separate?
    // The requirement says "Community Questions should be something like the dashboard... to show questions of CommunityQuestions"
    // Usually "Examples" are curated, "Community" are user submitted.
    // For now, let's assume getDynamicQuestions fetches ALL or just curated ones?
    // Let's rely on isCommunity flag. If undefined/false, it might be a system example.

    // For backward compatibility, we just order by timestamp.
    // But maybe we want to filter OUT community questions here if this function is used for "System Examples"?
    // The DynamicQuestionExamples component uses this.
    // Let's assume this returns EVERYTHING for now unless we want to filter.
    // Actually, usually "Examples" are mixed. But let's add a specific getter for Community ones.

    const q = query(
      questionsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const questions: DynamicQuestion[] = [];
    querySnapshot.forEach((docSnapshot) => {
      questions.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as DynamicQuestion);
    });

    return questions;
  } catch (error) {
    console.error('Error fetching dynamic questions:', error);
    throw error;
  }
};

/**
 * Get community questions from Firebase
 * @param limitCount - Maximum number of questions to return (default: 50)
 */
export const getCommunityQuestions = async (
  limitCount = 50
): Promise<DynamicQuestion[]> => {
  if (!db) {
    console.warn(
      'Firebase is not initialized. Cannot fetch community questions.'
    );
    return [];
  }

  try {
    const questionsRef = collection(db, 'CommunityQuestions');
    const q = query(
      questionsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const questions: DynamicQuestion[] = [];
    querySnapshot.forEach((docSnapshot) => {
      questions.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as DynamicQuestion);
    });

    return questions;
  } catch (error) {
    console.error('Error fetching community questions:', error);
    throw error;
  }
};

/**
 * Get a single dynamic question by ID
 * @param questionId - The ID of the question to fetch
 */
export const getDynamicQuestion = async (
  questionId: string
): Promise<DynamicQuestion | null> => {
  if (!db) {
    console.warn('Firebase is not initialized. Cannot fetch dynamic question.');
    return null;
  }

  try {
    const questionRef = doc(db, 'DynamicQuestions', questionId);
    const questionSnap = await getDoc(questionRef);

    if (questionSnap.exists()) {
      return {
        id: questionSnap.id,
        ...questionSnap.data(),
      } as DynamicQuestion;
    }

    return null;
  } catch (error) {
    console.error('Error fetching dynamic question:', error);
    throw error;
  }
};

/**
 * Create or update a dynamic question
 * @param question - The dynamic question data
 * @param questionId - Optional ID, if not provided uses question.id
 */
export const saveDynamicQuestion = async (
  question: DynamicQuestion,
  questionId?: string
): Promise<void> => {
  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please configure Firebase environment variables.'
    );
  }

  try {
    const id = questionId || question.id;
    const collectionName = question.isCommunity
      ? 'CommunityQuestions'
      : 'DynamicQuestions';
    const questionRef = doc(db, collectionName, id);

    // Remove id from data before saving (it's the document ID)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...questionData } = question;

    // Ensure templateId is at root level for Firestore indexing
    const dataToSave = {
      ...questionData,
      templateId: question.state?.templateId || question.templateId || null,
    };

    // Remove undefined values to prevent Firestore errors
    const cleanData = JSON.parse(JSON.stringify(dataToSave));

    await setDoc(questionRef, cleanData, { merge: true });
  } catch (error) {
    console.error('Error saving dynamic question:', error);
    throw error;
  }
};

/**
 * Import multiple dynamic questions from JSON array
 * @param questions - Array of dynamic questions to import
 */
export const importDynamicQuestions = async (
  questions: DynamicQuestion[]
): Promise<{ success: number; failed: number }> => {
  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please configure Firebase environment variables.'
    );
  }

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

/**
 * Get dynamic questions filtered by template ID
 * @param templateId - Template ID to filter by
 * @param limitCount - Maximum number of questions to return (default: 50)
 */
export const getDynamicQuestionsByTemplate = async (
  templateId: string,
  limitCount = 50
): Promise<DynamicQuestion[]> => {
  if (!db) {
    console.warn(
      'Firebase is not initialized. Cannot fetch dynamic questions.'
    );
    return [];
  }

  try {
    const questionsRef = collection(db, 'DynamicQuestions');
    const q = query(
      questionsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const questions: DynamicQuestion[] = [];
    querySnapshot.forEach((docSnapshot) => {
      // Check for templateId in root or state
      const data = docSnapshot.data();
      const tId = data.templateId || data.state?.templateId;

      if (tId === templateId) {
        questions.push({
          id: docSnapshot.id,
          ...data,
        } as DynamicQuestion);
      }
    });

    return questions;
  } catch (error) {
    console.error('Error fetching dynamic questions by template:', error);
    throw error;
  }
};

/**
 * Delete a dynamic question by ID
 * @param questionId - The ID of the question to delete
 */
export const deleteDynamicQuestion = async (
  questionId: string,
  isCommunity: boolean = false
): Promise<void> => {
  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please configure Firebase environment variables.'
    );
  }

  try {
    const collectionName = isCommunity
      ? 'CommunityQuestions'
      : 'DynamicQuestions';
    const questionRef = doc(db, collectionName, questionId);
    await deleteDoc(questionRef);
  } catch (error) {
    console.error('Error deleting dynamic question:', error);
    throw error;
  }
};

const CRUDDynamicQuestions = {
  getDynamicQuestions,
  getCommunityQuestions,
  getDynamicQuestion,
  getDynamicQuestionsByTemplate,
  saveDynamicQuestion,
  deleteDynamicQuestion,
  importDynamicQuestions,
};

export default CRUDDynamicQuestions;
