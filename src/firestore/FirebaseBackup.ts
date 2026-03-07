import { getKeycloakToken } from '../auth/keycloakStore';

export interface BackupResult {
  success: boolean;
  data?: Record<string, any[]>;
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

const COLLECTIONS_TO_BACKUP = [
  'Templates',
  'Users',
  'HomeContent',
  'FirebaseRequestLogs',
  'Team',
  'DynamicQuestions',
  'News',
  'Papers',
  'AIRateLimits',
];

const getBackendUrl = () => {
  return (
    import.meta.env.VITE_BACKEND_URL ||
    'https://empirecompassbackend.vercel.app'
  );
};

const authedFetch = async (path: string) => {
  const token = getKeycloakToken();
  if (!token) {
    throw new Error('You must be logged in to run backup.');
  }

  return fetch(`${getBackendUrl()}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const backupAllCollections = async (
  onProgress?: (progress: BackupProgress) => void
): Promise<BackupResult> => {
  try {
    if (onProgress) {
      onProgress({
        currentCollection: 'Preparing backup...',
        collectionsProcessed: 0,
        totalCollections: COLLECTIONS_TO_BACKUP.length,
        documentsProcessed: 0,
      });
    }

    const response = await authedFetch('/api/backup');
    const result = (await response.json()) as BackupResult;

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
      };
    }

    if (onProgress) {
      onProgress({
        currentCollection: 'Completed',
        collectionsProcessed: COLLECTIONS_TO_BACKUP.length,
        totalCollections: COLLECTIONS_TO_BACKUP.length,
        documentsProcessed: result.documentsCount || 0,
      });
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const backupSingleCollection = async (
  collectionName: string
): Promise<BackupResult> => {
  try {
    const response = await authedFetch(
      `/api/backup/${encodeURIComponent(collectionName)}`
    );
    const result = (await response.json()) as BackupResult;
    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
      };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const downloadBackupAsJSON = (
  backupData: Record<string, any[]>,
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

export const downloadBackupWithMetadata = (result: BackupResult): void => {
  if (!result.success || !result.data) {
    console.error('Cannot download backup: invalid data');
    return;
  }
  downloadBackupAsJSON(result.data as Record<string, any[]>);
};

export const getBackupStatistics = (
  backupData: Record<string, any[]>
): Record<string, number> => {
  const stats: Record<string, number> = {};
  Object.entries(backupData).forEach(([collectionName, documents]) => {
    stats[collectionName] = documents.length;
  });
  return stats;
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
