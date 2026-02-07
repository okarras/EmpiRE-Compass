/**
 * CRUD operations for Static Question Overrides
 * Allows admins to edit "static" questions and maintains a version history.
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface QuestionVersion {
  versionId: string;
  timestamp: number;
  authorId: string;
  authorName?: string;
  changeDescription?: string;
  // Content fields that can be overridden
  title?: string;
  dataAnalysisInformation?: {
    question?: string;
    questionExplanation?: string;
    dataAnalysis?: string | string[];
    dataInterpretation?: string | string[];
    requiredDataForAnalysis?: string | string[];
  };
  chartSettings?: {
    heading?: string;
    detailedChartHeading?: string;
  };
}

export interface QuestionOverrideDocument {
  id: string; // The query uid (e.g., 'query_1')
  latestVersion: QuestionVersion;
  versions: QuestionVersion[];
}

/**
 * Get the override data for a specific question
 * @param queryUid - The unique ID of the question (e.g., 'query_1')
 */
export const getQuestionOverride = async (
  queryUid: string
): Promise<QuestionOverrideDocument | null> => {
  if (!db) return null;

  try {
    const docRef = doc(db, 'QuestionOverrides', queryUid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as QuestionOverrideDocument;
    }
    return null;
  } catch (error) {
    console.error('Error fetching question override:', error);
    throw error;
  }
};

/**
 * Save a new version of a question override
 * @param queryUid - The unique ID of the question
 * @param versionData - The new content to save
 * @param authorId - ID of the user making the change
 * @param authorName - Name of the user making the change
 * @param changeDescription - Optional description of what changed
 */
export const saveQuestionVersion = async (
  queryUid: string,
  versionData: Partial<QuestionVersion>,
  authorId: string,
  authorName?: string,
  changeDescription?: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');

  try {
    const docRef = doc(db, 'QuestionOverrides', queryUid);
    const docSnap = await getDoc(docRef);

    // Create new version
    const newVersion: QuestionVersion = {
      versionId: `v_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      authorId,
      authorName,
      changeDescription,
      ...versionData,
    };

    let updates: Partial<QuestionOverrideDocument>;

    if (docSnap.exists()) {
      const existingDoc = docSnap.data() as QuestionOverrideDocument;
      updates = {
        latestVersion: newVersion,
        versions: [newVersion, ...(existingDoc.versions || [])].slice(0, 50), // Keep last 50 versions
      };
    } else {
      updates = {
        id: queryUid,
        latestVersion: newVersion,
        versions: [newVersion],
      };
    }

    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    console.error('Error saving question version:', error);
    throw error;
  }
};

/**
 * Restore a specific version of a question
 * @param queryUid - The unique ID of the question
 * @param versionId - The ID of the version to restore
 * @param authorId - ID of the user performing the restore
 */
export const restoreQuestionVersion = async (
  queryUid: string,
  versionId: string,
  authorId: string,
  authorName?: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');

  const docRef = doc(db, 'QuestionOverrides', queryUid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Question overrides document not found');
  }

  const data = docSnap.data() as QuestionOverrideDocument;
  const versionToRestore = data.versions.find((v) => v.versionId === versionId);

  if (!versionToRestore) {
    throw new Error('Version not found');
  }

  // Create a new version that is a copy of the old one, but with new metadata
  // We treat restoration as a new commit so history is linear
  await saveQuestionVersion(
    queryUid,
    {
      ...versionToRestore,
      versionId: undefined, // Let saveQuestionVersion generate a new ID
      timestamp: undefined, // Let saveQuestionVersion generate a new timestamp
    },
    authorId,
    authorName,
    `Restored from version ${versionId}`
  );
};

const CRUDStaticQuestionOverrides = {
  getQuestionOverride,
  saveQuestionVersion,
  restoreQuestionVersion,
};

export default CRUDStaticQuestionOverrides;
