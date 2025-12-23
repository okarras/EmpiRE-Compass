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
} from 'firebase/firestore';

export interface DynamicQuestion {
  id: string;
  name: string;
  timestamp: number;
  templateId?: string; // Stored at root level for Firestore indexing
  state: {
    question: string;
    sparqlQuery: string;
    sparqlTranslation?: string;
    queryResults?: any[];
    chartHtml?: string;
    questionInterpretation?: string;
    dataCollectionInterpretation?: string;
    dataAnalysisInterpretation?: string;
    processingFunctionCode?: string;
    history?: any[];
    templateId?: string;
    templateMapping?: Record<string, any>;
    targetClassId?: string;
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
    const questionRef = doc(db, 'DynamicQuestions', id);

    // Remove id from data before saving (it's the document ID)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...questionData } = question;

    // Ensure templateId is at root level for Firestore indexing
    const dataToSave = {
      ...questionData,
      templateId: question.state?.templateId || question.templateId,
    };

    await setDoc(questionRef, dataToSave, { merge: true });
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
      if (docSnapshot.data().templateId === templateId) {
        questions.push({
          id: docSnapshot.id,
          ...docSnapshot.data(),
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
  questionId: string
): Promise<void> => {
  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please configure Firebase environment variables.'
    );
  }

  try {
    const questionRef = doc(db, 'DynamicQuestions', questionId);
    await deleteDoc(questionRef);
  } catch (error) {
    console.error('Error deleting dynamic question:', error);
    throw error;
  }
};

const CRUDDynamicQuestions = {
  getDynamicQuestions,
  getDynamicQuestion,
  getDynamicQuestionsByTemplate,
  saveDynamicQuestion,
  deleteDynamicQuestion,
  importDynamicQuestions,
};

export default CRUDDynamicQuestions;
