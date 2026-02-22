/**
 * Restore Service (Firebase Admin SDK)
 * Restores backup JSON to Firestore. Bypasses security rules.
 */

import { db } from '../config/firebase.js';
import type { Firestore } from 'firebase-admin/firestore';

const TEMPLATES_NESTED_SUBCOLLECTIONS = ['Questions', 'Statistics'];
const BATCH_SIZE = 400;

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

interface BackupFileStructure {
  metadata?: {
    timestamp?: string;
    collectionsCount?: number;
    documentsCount?: number;
    projectId?: string;
  };
  data?: Record<string, unknown[]>;
}

function parseBackupFile(content: string): Record<string, unknown[]> {
  const parsed = JSON.parse(content) as
    | BackupFileStructure
    | Record<string, unknown[]>;

  if (
    parsed &&
    typeof parsed === 'object' &&
    'data' in parsed &&
    !Array.isArray((parsed as BackupFileStructure).data)
  ) {
    const withMetadata = parsed as BackupFileStructure;
    if (withMetadata.data && typeof withMetadata.data === 'object') {
      return withMetadata.data as Record<string, unknown[]>;
    }
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown[]>;
  }

  throw new Error('Invalid backup file format');
}

function prepareDocumentForWrite(
  docData: Record<string, unknown>,
  excludeFields: string[] = []
): Record<string, unknown> {
  const { id: _id, ...rest } = docData;
  const result = { ...rest };
  for (const field of excludeFields) {
    delete result[field];
  }
  return result;
}

async function restoreFlatCollectionAsync(
  firestoreDb: Firestore,
  collectionName: string,
  documents: Record<string, unknown>[],
  onProgress?: (p: RestoreProgress) => void
): Promise<number> {
  let totalRestored = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = firestoreDb.batch();
    const batchDocs = documents.slice(i, i + BATCH_SIZE);

    for (const docData of batchDocs) {
      const docId = docData.id as string;
      if (!docId) continue;

      const ref = firestoreDb.collection(collectionName).doc(docId);
      const dataToWrite = prepareDocumentForWrite(
        docData as Record<string, unknown>
      );
      batch.set(ref, dataToWrite);
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
}

async function restoreTemplatesCollectionAsync(
  firestoreDb: Firestore,
  documents: Record<string, unknown>[],
  onProgress?: (p: RestoreProgress) => void
): Promise<number> {
  let totalRestored = 0;

  for (const templateData of documents) {
    const templateId = templateData.id as string;
    if (!templateId) continue;

    const nestedData: Record<string, Record<string, unknown>[]> = {};
    for (const subName of TEMPLATES_NESTED_SUBCOLLECTIONS) {
      if (Array.isArray(templateData[subName])) {
        nestedData[subName] = templateData[subName] as Record<
          string,
          unknown
        >[];
      }
    }

    const templateRef = firestoreDb.collection('Templates').doc(templateId);
    const templateFieldsToExclude = ['id', ...TEMPLATES_NESTED_SUBCOLLECTIONS];
    const templateDataToWrite = prepareDocumentForWrite(
      templateData as Record<string, unknown>,
      templateFieldsToExclude
    );
    await templateRef.set(templateDataToWrite);
    totalRestored++;

    const questions = nestedData['Questions'] || [];
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = firestoreDb.batch();
      const batchQuestions = questions.slice(i, i + BATCH_SIZE);

      for (let j = 0; j < batchQuestions.length; j++) {
        const q = batchQuestions[j];
        const questionId = String(q.id ?? q.uid ?? `query_${i + j}`);
        const questionRef = firestoreDb
          .collection('Templates')
          .doc(templateId)
          .collection('Questions')
          .doc(questionId);
        const qData = prepareDocumentForWrite(q);
        batch.set(questionRef, qData);
        totalRestored++;
      }

      await batch.commit();
    }

    const statistics = nestedData['Statistics'] || [];
    for (let i = 0; i < statistics.length; i += BATCH_SIZE) {
      const batch = firestoreDb.batch();
      const batchStats = statistics.slice(i, i + BATCH_SIZE);

      for (let j = 0; j < batchStats.length; j++) {
        const stat = batchStats[j];
        const statId = String(stat.id ?? stat.uid ?? `stat_${i + j}`);
        const statRef = firestoreDb
          .collection('Templates')
          .doc(templateId)
          .collection('Statistics')
          .doc(statId);
        const statData = prepareDocumentForWrite(stat);
        batch.set(statRef, statData);
        totalRestored++;
      }

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
}

export async function restoreFromBackup(
  backupContent: string,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> {
  const backupData = parseBackupFile(backupContent);
  const firestoreDb = db;
  const collectionNames = Object.keys(backupData).filter((k) =>
    Array.isArray(backupData[k])
  );
  const totalCollections = collectionNames.length;
  const totalDocuments = collectionNames.reduce(
    (sum, name) => sum + (backupData[name] as unknown[]).length,
    0
  );

  let documentsRestored = 0;
  let collectionsRestored = 0;

  try {
    for (let i = 0; i < collectionNames.length; i++) {
      const collectionName = collectionNames[i];
      const documents = backupData[collectionName] as Record<string, unknown>[];

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
        documentsRestored += await restoreTemplatesCollectionAsync(
          firestoreDb,
          documents,
          (p) =>
            onProgress?.({ ...p, collectionsProcessed: i, totalCollections })
        );
      } else {
        documentsRestored += await restoreFlatCollectionAsync(
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
}
