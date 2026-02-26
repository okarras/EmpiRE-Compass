import { getKeycloakToken } from '../auth/keycloakStore';

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
  data?: Record<string, any[]>;
}

const getBackendUrl = () =>
  import.meta.env.VITE_BACKEND_URL || 'https://empirecompassbackend.vercel.app';

export const parseBackupFile = (content: string): Record<string, any[]> => {
  const parsed = JSON.parse(content) as
    | BackupFileStructure
    | Record<string, any[]>;

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

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, any[]>;
  }

  throw new Error('Invalid backup file format');
};

export const restoreFromBackup = async (
  backupData: Record<string, any[]>,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> => {
  try {
    const token = getKeycloakToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const totalCollections = Object.keys(backupData).length;
    const totalDocuments = Object.values(backupData).reduce(
      (sum, docs) => sum + (Array.isArray(docs) ? docs.length : 0),
      0
    );

    onProgress?.({
      currentCollection: 'Sending to backend...',
      collectionsProcessed: 0,
      totalCollections,
      documentsProcessed: 0,
      totalDocuments,
    });

    const response = await fetch(`${getBackendUrl()}/api/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(backupData),
    });

    const result = (await response.json().catch(() => ({
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }))) as RestoreResult;

    if (!response.ok) {
      return { success: false, error: result.error || 'Restore failed' };
    }

    onProgress?.({
      currentCollection: 'Completed',
      collectionsProcessed: totalCollections,
      totalCollections,
      documentsProcessed: totalDocuments,
      totalDocuments,
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

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

export const getBackupPreview = (
  backupData: Record<string, any[]>
): { collection: string; documentCount: number }[] => {
  return Object.entries(backupData)
    .filter(([, docs]) => Array.isArray(docs))
    .map(([name, docs]) => ({
      collection: name,
      documentCount:
        name === 'Templates'
          ? (docs as any[]).reduce(
              (sum, t) =>
                sum +
                1 +
                ((t.Questions as any[])?.length || 0) +
                ((t.Statistics as any[])?.length || 0),
              0
            )
          : (docs as any[]).length,
    }));
};

const FirebaseRestore = {
  parseBackupFile,
  restoreFromBackup,
  restoreFromFile,
  getBackupPreview,
};

export default FirebaseRestore;
