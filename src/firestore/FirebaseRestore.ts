import { db } from '../firebase';
import {
  doc,
  setDoc,
  writeBatch,
  Firestore,
  DocumentData,
} from 'firebase/firestore';

/**
 * Firebase Restore Service
 * Restores collections from backup JSON (same structure as FirebaseBackup export)
 * Supports restoring to the currently connected Firebase database
 */

const TEMPLATES_NESTED_SUBCOLLECTIONS = ['Questions', 'Statistics'];
const BATCH_SIZE = 400; // Firestore limit is 500 per batch

export interface RestoreProgress {
  currentCollection: string;
  collectionsProcessed: number;
  totalCollections: number;
  documentsProcessed: number;
  totalDocuments: number;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  collectionsRestored?: number;
  documentsRestored?: number;
  timestamp?: string;
}

export interface BackupFileStructure {
  metadata?: {
    timestamp?: string;
    collectionsCount?: number;
    documentsCount?: number;
    projectId?: string;
  };
  data?: Record<string, DocumentData[]>;
}

/**
 * Parse backup file content - handles both formats:
 * 1. { metadata: {...}, data: {...} } - full backup with metadata
 * 2. Record<string, DocumentData[]> - raw collection data
 */
export const parseBackupFile = (
  content: string
): Record<string, DocumentData[]> => {
  const parsed = JSON.parse(content) as
    | BackupFileStructure
    | Record<string, DocumentData[]>;

  // Check if it has metadata wrapper
  if (
    parsed &&
    typeof parsed === 'object' &&
    'data' in parsed &&
    !Array.isArray((parsed as BackupFileStructure).data)
  ) {
    const withMetadata = parsed as BackupFileStructure;
    if (withMetadata.data && typeof withMetadata.data === 'object') {
      return withMetadata.data;
    }
  }

  // Raw format: direct Record<string, DocumentData[]>
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, DocumentData[]>;
  }

  throw new Error('Invalid backup file format');
};

/**
 * Remove fields that should not be written to Firestore document
 */
const prepareDocumentForWrite = (
  docData: DocumentData,
  excludeFields: string[] = []
): DocumentData => {
  const { id: _id, ...rest } = docData;
  const result = { ...rest };

  for (const field of excludeFields) {
    delete result[field];
  }

  return result;
};

/**
 * Restore a single collection (flat, no nested)
 */
const restoreFlatCollection = async (
  firestoreDb: Firestore,
  collectionName: string,
  documents: DocumentData[],
  onProgress?: (progress: RestoreProgress) => void
): Promise<number> => {
  let totalRestored = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestoreDb);
    const batchDocs = documents.slice(i, i + BATCH_SIZE);

    for (const docData of batchDocs) {
      const docId = docData.id as string;
      if (!docId) continue;

      const docRef = doc(firestoreDb, collectionName, docId);
      const dataToWrite = prepareDocumentForWrite(docData);
      batch.set(docRef, dataToWrite);
      totalRestored++;
    }

    await batch.commit();

    if (onProgress) {
      onProgress({
        currentCollection: collectionName,
        collectionsProcessed: 0,
        totalCollections: 0,
        documentsProcessed: totalRestored,
        totalDocuments: documents.length,
      });
    }
  }

  return totalRestored;
};

/**
 * Restore Templates collection with nested Questions and Statistics
 */
const restoreTemplatesCollection = async (
  firestoreDb: Firestore,
  documents: DocumentData[],
  onProgress?: (progress: RestoreProgress) => void
): Promise<number> => {
  let totalRestored = 0;

  for (const templateData of documents) {
    const templateId = templateData.id as string;
    if (!templateId) continue;

    // Extract nested collections before writing
    const nestedData: Record<string, DocumentData[]> = {};
    for (const subName of TEMPLATES_NESTED_SUBCOLLECTIONS) {
      if (Array.isArray(templateData[subName])) {
        nestedData[subName] = templateData[subName] as DocumentData[];
      }
    }

    // Write main template document (without nested arrays)
    const templateRef = doc(firestoreDb, 'Templates', templateId);
    const templateFieldsToExclude = ['id', ...TEMPLATES_NESTED_SUBCOLLECTIONS];
    const templateDataToWrite = prepareDocumentForWrite(
      templateData,
      templateFieldsToExclude
    );
    await setDoc(templateRef, templateDataToWrite);
    totalRestored++;

    // Write Questions subcollection
    const questions = nestedData['Questions'] || [];
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = writeBatch(firestoreDb);
      const batchQuestions = questions.slice(i, i + BATCH_SIZE);

      batchQuestions.forEach((q, idx) => {
        const questionId = String(q.id ?? q.uid ?? `query_${i + idx}`);
        const questionRef = doc(
          firestoreDb,
          'Templates',
          templateId,
          'Questions',
          questionId
        );
        const qData = prepareDocumentForWrite(q);
        batch.set(questionRef, qData);
        totalRestored++;
      });

      await batch.commit();
    }

    // Write Statistics subcollection
    const statistics = nestedData['Statistics'] || [];
    for (let i = 0; i < statistics.length; i += BATCH_SIZE) {
      const batch = writeBatch(firestoreDb);
      const batchStats = statistics.slice(i, i + BATCH_SIZE);

      batchStats.forEach((stat, idx) => {
        const statId = String(stat.id ?? stat.uid ?? `stat_${i + idx}`);
        const statRef = doc(
          firestoreDb,
          'Templates',
          templateId,
          'Statistics',
          statId
        );
        const statData = prepareDocumentForWrite(stat);
        batch.set(statRef, statData);
        totalRestored++;
      });

      await batch.commit();
    }

    if (onProgress) {
      onProgress({
        currentCollection: 'Templates',
        collectionsProcessed: 0,
        totalCollections: 0,
        documentsProcessed: totalRestored,
        totalDocuments: documents.length,
      });
    }
  }

  return totalRestored;
};

/**
 * Restore all collections from backup data to Firestore
 * Uses the currently connected Firebase database from firebase.ts
 */
export const restoreFromBackup = async (
  backupData: Record<string, DocumentData[]>,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> => {
  if (!db) {
    return {
      success: false,
      error:
        'Firebase is not initialized. Please configure Firebase environment variables.',
    };
  }

  const firestoreDb = db;
  const collectionNames = Object.keys(backupData).filter((k) =>
    Array.isArray(backupData[k])
  );
  const totalCollections = collectionNames.length;
  const totalDocuments = collectionNames.reduce(
    (sum, name) => sum + (backupData[name] as DocumentData[]).length,
    0
  );

  let documentsRestored = 0;
  let collectionsRestored = 0;

  try {
    for (let i = 0; i < collectionNames.length; i++) {
      const collectionName = collectionNames[i];
      const documents = backupData[collectionName] as DocumentData[];

      if (onProgress) {
        onProgress({
          currentCollection: collectionName,
          collectionsProcessed: i,
          totalCollections,
          documentsProcessed: documentsRestored,
          totalDocuments,
        });
      }

      if (!documents || documents.length === 0) {
        continue;
      }

      if (collectionName === 'Templates') {
        documentsRestored += await restoreTemplatesCollection(
          firestoreDb,
          documents,
          (p) =>
            onProgress?.({ ...p, collectionsProcessed: i, totalCollections })
        );
      } else {
        documentsRestored += await restoreFlatCollection(
          firestoreDb,
          collectionName,
          documents,
          (p) =>
            onProgress?.({ ...p, collectionsProcessed: i, totalCollections })
        );
      }

      collectionsRestored++;
    }

    return {
      success: true,
      collectionsRestored,
      documentsRestored,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Restore failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Restore from uploaded file
 */
export const restoreFromFile = async (
  file: File,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> => {
  try {
    const content = await file.text();
    const backupData = parseBackupFile(content);
    return await restoreFromBackup(backupData, onProgress);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to parse backup file',
    };
  }
};

/**
 * Get preview stats from backup file without restoring
 */
export const getBackupPreview = (
  backupData: Record<string, DocumentData[]>
): { collection: string; documentCount: number }[] => {
  return Object.entries(backupData)
    .filter(([, docs]) => Array.isArray(docs))
    .map(([name, docs]) => ({
      collection: name,
      documentCount:
        name === 'Templates'
          ? (docs as DocumentData[]).reduce(
              (sum, t) =>
                sum +
                1 +
                ((t.Questions as DocumentData[])?.length || 0) +
                ((t.Statistics as DocumentData[])?.length || 0),
              0
            )
          : (docs as DocumentData[]).length,
    }));
};

const FirebaseRestore = {
  parseBackupFile,
  restoreFromBackup,
  restoreFromFile,
  getBackupPreview,
};

export default FirebaseRestore;
