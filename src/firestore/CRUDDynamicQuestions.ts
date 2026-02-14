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
import BackupService from '../services/BackupService';

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
  // Community features
  status?: 'pending' | 'published' | 'rejected';
  publishedAt?: number;
  reviewerId?: string;
  likes?: number;
  likedBy?: string[]; // Array of user IDs who liked the question
}

/**
 * Toggle like for a dynamic question
 * @param questionId - The ID of the question
 * @param userId - The ID of the user toggling like
 * @param isCommunity - Whether it's a community question (default true)
 */
export const toggleLike = async (
  questionId: string,
  userId: string,
  isCommunity: boolean = true
): Promise<DynamicQuestion | null> => {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const collectionName = isCommunity
      ? 'CommunityQuestions'
      : 'DynamicQuestions';
    const questionRef = doc(db, collectionName, questionId);

    const snap = await getDoc(questionRef);
    if (!snap.exists()) return null;

    const data = snap.data() as DynamicQuestion;
    const likedBy = data.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    let newLikedBy = [...likedBy];
    let newLikes = data.likes || 0;

    if (hasLiked) {
      newLikedBy = newLikedBy.filter((id) => id !== userId);
      newLikes = Math.max(0, newLikes - 1);
    } else {
      newLikedBy.push(userId);
      newLikes = newLikes + 1;
    }

    const updates = {
      likes: newLikes,
      likedBy: newLikedBy,
    };

    await setDoc(questionRef, updates, { merge: true });

    return {
      ...data,
      ...updates,
      id: snap.id,
      isCommunity, // helper return
    };
  } catch (error) {
    console.error('Error toggling like:', error);
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
  // If user has explicitly selected a backup/offline mode, use that first
  if (BackupService.isExplicitlyUsingBackup()) {
    console.log(
      'CRUDDynamicQuestions: Using explicit backup for dynamic question'
    );
    try {
      const questions = await BackupService.getDynamicQuestions();
      const question = questions.find((q: any) => q.id === questionId);
      return question ? (question as DynamicQuestion) : null;
    } catch (error) {
      console.error('Error fetching dynamic question from backup:', error);
      // Fall through to Firebase
    }
  }

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
    console.warn('Firebase failed, falling back to backup:', error);
    try {
      const questions = await BackupService.getDynamicQuestions();
      const question = questions.find(
        (q) => (q as DynamicQuestion).id === questionId
      );
      return question ? (question as DynamicQuestion) : null;
    } catch (backupError) {
      console.error(
        'Error fetching dynamic question from backup:',
        backupError
      );
      throw error;
    }
  }
};

/**
 * Get a single community question by ID
 * @param questionId - The ID of the question to fetch
 */
export const getCommunityQuestion = async (
  questionId: string
): Promise<DynamicQuestion | null> => {
  if (!db) {
    console.warn(
      'Firebase is not initialized. Cannot fetch community question.'
    );
    return null;
  }

  try {
    const questionRef = doc(db, 'CommunityQuestions', questionId);
    const questionSnap = await getDoc(questionRef);

    if (questionSnap.exists()) {
      return {
        id: questionSnap.id,
        ...questionSnap.data(),
        isCommunity: true, // Ensure flag is set when fetched from this collection
      } as DynamicQuestion;
    }

    return null;
  } catch (error) {
    console.error('Error fetching community question:', error);
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
      // Default status to pending for community questions if missing
      ...(question.isCommunity && !question.status
        ? { status: 'pending' }
        : {}),
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
  // If user has explicitly selected a backup/offline mode, use that first
  if (BackupService.isExplicitlyUsingBackup()) {
    console.log(
      'CRUDDynamicQuestions: Using explicit backup for dynamic questions by template'
    );
    try {
      const questions = await BackupService.getDynamicQuestions();
      const filtered = questions
        .filter((q) => {
          const question = q as DynamicQuestion;
          const tId = question.templateId || question.state?.templateId;
          return tId === templateId;
        })
        .sort(
          (a, b) =>
            ((b as DynamicQuestion).timestamp || 0) -
            ((a as DynamicQuestion).timestamp || 0)
        )
        .slice(0, limitCount);
      return filtered as DynamicQuestion[];
    } catch (error) {
      console.error('Error fetching dynamic questions from backup:', error);
      // Fall through to Firebase
    }
  }

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
    console.warn('Firebase failed, falling back to backup:', error);
    try {
      const questions = await BackupService.getDynamicQuestions();
      const filtered = questions
        .filter((q) => {
          const question = q as DynamicQuestion;
          const tId = question.templateId || question.state?.templateId;
          return tId === templateId;
        })
        .sort(
          (a, b) =>
            ((b as DynamicQuestion).timestamp || 0) -
            ((a as DynamicQuestion).timestamp || 0)
        )
        .slice(0, limitCount);
      return filtered as DynamicQuestion[];
    } catch (backupError) {
      console.error(
        'Error fetching dynamic questions from backup:',
        backupError
      );
      throw error;
    }
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

/**
 * Get all dynamic questions (examples) from Firebase
 * @param limitCount - Maximum number of questions to return (default: 50)
 */
export const getDynamicQuestions = async (
  limitCount = 50
): Promise<DynamicQuestion[]> => {
  // If user has explicitly selected a backup/offline mode, use that first
  if (BackupService.isExplicitlyUsingBackup()) {
    console.log(
      'CRUDDynamicQuestions: Using explicit backup for dynamic questions'
    );
    try {
      const questions = await BackupService.getDynamicQuestions();
      // Sort by timestamp descending and limit
      const sorted = questions
        .sort(
          (a, b) =>
            ((b as DynamicQuestion).timestamp || 0) -
            ((a as DynamicQuestion).timestamp || 0)
        )
        .slice(0, limitCount);
      return sorted as DynamicQuestion[];
    } catch (error) {
      console.error('Error fetching dynamic questions from backup:', error);
      // Fall through to Firebase
    }
  }

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
    console.warn('Firebase failed, falling back to backup:', error);
    try {
      const questions = await BackupService.getDynamicQuestions();
      const sorted = questions
        .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, limitCount);
      return sorted as DynamicQuestion[];
    } catch (backupError) {
      console.error(
        'Error fetching dynamic questions from backup:',
        backupError
      );
      throw error;
    }
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
