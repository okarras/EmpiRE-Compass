import { db } from '../firebase';
import { collection, getDocs, DocumentData } from 'firebase/firestore';

/**
 * Firebase Backup Service
 * Provides functionality to backup all collections from Firestore
 * Supports both flat and nested collection structures
 */

export interface BackupResult {
  success: boolean;
  data?: Record<string, DocumentData[]>;
  error?: string;
  timestamp?: string;
  collectionsCount?: number;
  documentsCount?: number;
}

export interface BackupProgress {
  currentCollection: string;
  collectionsProcessed: number;
  totalCollections: number;
  documentsProcessed: number;
}

/**
 * List of all collections to backup
 * Add or remove collections as needed
 */
const COLLECTIONS_TO_BACKUP = [
  'Templates',
  'Users',
  'HomeContent',
  'FirebaseRequestLogs',
  'Team',
];

/**
 * Backup nested subcollections for a document
 */
const backupNestedCollections = async (
  parentCollection: string,
  documentId: string,
  subcollections: string[]
): Promise<Record<string, DocumentData[]>> => {
  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please configure Firebase environment variables.'
    );
  }

  const nestedData: Record<string, DocumentData[]> = {};

  for (const subcollectionName of subcollections) {
    try {
      const subcollectionRef = collection(
        db,
        parentCollection,
        documentId,
        subcollectionName
      );
      const querySnapshot = await getDocs(subcollectionRef);
      const documents: DocumentData[] = [];

      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      nestedData[subcollectionName] = documents;
    } catch (error) {
      console.error(
        `Error backing up subcollection ${subcollectionName}:`,
        error
      );
    }
  }

  return nestedData;
};

/**
 * Backup a single collection from Firestore (including nested subcollections)
 */
const backupCollection = async (
  collectionName: string
): Promise<DocumentData[]> => {
  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please configure Firebase environment variables.'
    );
  }

  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    const documents: DocumentData[] = [];

    // If collection is empty, return empty array (not an error)
    if (querySnapshot.empty) {
      return documents;
    }

    for (const docSnapshot of querySnapshot.docs) {
      const docData = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      };

      // Handle nested collections for Templates
      if (collectionName === 'Templates') {
        const nestedData = await backupNestedCollections(
          collectionName,
          docSnapshot.id,
          ['Questions', 'Statistics']
        );

        // Add nested collections to document
        if (Object.keys(nestedData).length > 0) {
          Object.assign(docData, nestedData);
        }
      }

      documents.push(docData);
    }

    return documents;
  } catch (error) {
    console.error(`Error backing up collection ${collectionName}:`, error);
    // Log the error but don't throw - allow backup to continue with other collections
    console.warn(`Skipping collection ${collectionName} due to error`);
    return [];
  }
};

/**
 * Backup all collections from Firestore
 */
export const backupAllCollections = async (
  onProgress?: (progress: BackupProgress) => void
): Promise<BackupResult> => {
  try {
    const backup: Record<string, DocumentData[]> = {};
    let totalDocuments = 0;
    const skippedCollections: string[] = [];
    const successfulCollections: string[] = [];

    for (let i = 0; i < COLLECTIONS_TO_BACKUP.length; i++) {
      const collectionName = COLLECTIONS_TO_BACKUP[i];

      // Report progress
      if (onProgress) {
        onProgress({
          currentCollection: collectionName,
          collectionsProcessed: i,
          totalCollections: COLLECTIONS_TO_BACKUP.length,
          documentsProcessed: totalDocuments,
        });
      }

      try {
        const documents = await backupCollection(collectionName);
        backup[collectionName] = documents;
        totalDocuments += documents.length;

        if (documents.length > 0) {
          successfulCollections.push(collectionName);
        }
      } catch (collectionError) {
        console.error(`✗ Failed to backup ${collectionName}:`, collectionError);
        skippedCollections.push(collectionName);
        // Continue with other collections
        backup[collectionName] = [];
      }
    }

    const timestamp = new Date().toISOString();

    // Build result message
    let resultMessage = `Backed up ${successfulCollections.length} of ${COLLECTIONS_TO_BACKUP.length} collections`;
    if (skippedCollections.length > 0) {
      resultMessage += `. Skipped: ${skippedCollections.join(', ')}`;
    }

    return {
      success: true,
      data: backup,
      timestamp,
      collectionsCount: successfulCollections.length,
      documentsCount: totalDocuments,
      error: skippedCollections.length > 0 ? resultMessage : undefined,
    };
  } catch (error) {
    console.error('Error during backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Download backup as JSON file
 */
export const downloadBackupAsJSON = (
  backupData: Record<string, DocumentData[]>,
  filename?: string
): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFilename = `firebase-backup-${timestamp}.json`;
  const finalFilename = filename || defaultFilename;

  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download backup with metadata
 */
export const downloadBackupWithMetadata = (result: BackupResult): void => {
  if (!result.success || !result.data) {
    console.error('Cannot download backup: invalid data');
    return;
  }

  const backupWithMetadata = {
    metadata: {
      timestamp: result.timestamp,
      collectionsCount: result.collectionsCount,
      documentsCount: result.documentsCount,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    },
    data: result.data,
  };

  downloadBackupAsJSON(
    backupWithMetadata.data as Record<string, DocumentData[]>
  );
};

/**
 * Get backup statistics
 */
export const getBackupStatistics = (
  backupData: Record<string, DocumentData[]>
): Record<string, number> => {
  const stats: Record<string, number> = {};

  Object.entries(backupData).forEach(([collectionName, documents]) => {
    stats[collectionName] = documents.length;
  });

  return stats;
};

/**
 * Backup a specific collection
 */
export const backupSingleCollection = async (
  collectionName: string
): Promise<BackupResult> => {
  try {
    const documents = await backupCollection(collectionName);
    const timestamp = new Date().toISOString();

    return {
      success: true,
      data: { [collectionName]: documents },
      timestamp,
      collectionsCount: 1,
      documentsCount: documents.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

const FirebaseBackup = {
  backupAllCollections,
  backupSingleCollection,
  downloadBackupAsJSON,
  downloadBackupWithMetadata,
  getBackupStatistics,
  COLLECTIONS_TO_BACKUP,
};

export default FirebaseBackup;
