import { Router } from 'express';
import { db } from '../config/firebase.js';
import { requireAdmin, validateKeycloakToken } from '../middleware/auth.js';

const router = Router();

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

const backupNestedCollections = async (
  parentCollection: string,
  documentId: string,
  subcollections: string[]
) => {
  const nestedData: Record<string, Record<string, unknown>[]> = {};

  for (const subcollectionName of subcollections) {
    try {
      const snapshot = await db
        .collection(parentCollection)
        .doc(documentId)
        .collection(subcollectionName)
        .get();
      nestedData[subcollectionName] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error(`Error backing up nested ${subcollectionName}:`, error);
      nestedData[subcollectionName] = [];
    }
  }

  return nestedData;
};

const backupCollection = async (collectionName: string) => {
  const snapshot = await db.collection(collectionName).get();
  const docs: Record<string, unknown>[] = [];

  for (const doc of snapshot.docs) {
    const data: Record<string, unknown> = {
      id: doc.id,
      ...doc.data(),
    };

    if (collectionName === 'Templates') {
      const nestedData = await backupNestedCollections(collectionName, doc.id, [
        'Questions',
        'Statistics',
      ]);
      Object.assign(data, nestedData);
    }

    docs.push(data);
  }

  return docs;
};

type BackupMetadata = {
  id: string;
  fileName: string;
  displayName?: string;
  description?: string;
  includesQuestions?: boolean;
  includesStatistics?: boolean;
  includesHomeContent?: boolean;
  includesUsers?: boolean;
  includesNews?: boolean;
  includesPapers?: boolean;
};

type BackupMetadataUpdate = {
  displayName?: string;
  description?: string;
  includesQuestions?: boolean;
  includesStatistics?: boolean;
  includesHomeContent?: boolean;
  includesUsers?: boolean;
  includesNews?: boolean;
  includesPapers?: boolean;
};

router.get('/', validateKeycloakToken, requireAdmin, async (_req, res) => {
  try {
    const backup: Record<string, Record<string, unknown>[]> = {};
    let totalDocuments = 0;
    let successfulCollections = 0;

    for (const collectionName of COLLECTIONS_TO_BACKUP) {
      try {
        const docs = await backupCollection(collectionName);
        backup[collectionName] = docs;
        totalDocuments += docs.length;
        successfulCollections++;
      } catch (error) {
        console.error(`Error backing up ${collectionName}:`, error);
        backup[collectionName] = [];
      }
    }

    return res.json({
      success: true,
      data: backup,
      timestamp: new Date().toISOString(),
      collectionsCount: successfulCollections,
      documentsCount: totalDocuments,
    });
  } catch (error) {
    console.error('Backup failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Backup failed',
    });
  }
});

router.get('/metadata', async (req, res) => {
  try {
    const filesQuery = req.query.files;
    const requestedFiles: string[] =
      typeof filesQuery === 'string'
        ? filesQuery
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean)
        : Array.isArray(filesQuery)
          ? (filesQuery as string[])
              .flatMap((f) => f.split(','))
              .map((f) => f.trim())
              .filter(Boolean)
          : [];

    const collectionRef = db.collection('BackupFiles');
    const snapshot = await collectionRef.get();

    // Build a set of existing identifiers (by doc ID and fileName field)
    const existingIds = new Set<string>();
    snapshot.docs.forEach((doc) => {
      existingIds.add(doc.id);
      const data = doc.data() as Record<string, unknown>;
      if (typeof data.fileName === 'string') {
        existingIds.add(data.fileName);
      }
    });

    // Automatically create minimal metadata docs for any known backup filenames
    if (requestedFiles.length > 0) {
      const batch = db.batch();
      let hasWrites = false;

      requestedFiles.forEach((fileName) => {
        if (!existingIds.has(fileName)) {
          const docRef = collectionRef.doc(fileName);
          batch.set(
            docRef,
            {
              fileName,
            },
            { merge: true }
          );
          hasWrites = true;
        }
      });

      if (hasWrites) {
        await batch.commit();
      }
    }

    const finalSnapshot = await collectionRef.get();

    const items: BackupMetadata[] = finalSnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const fileName =
        (data.fileName as string | undefined) || (doc.id as string);
      return {
        id: doc.id,
        fileName,
        displayName:
          (data.displayName as string | undefined) ||
          (data.name as string | undefined) ||
          fileName,
        description: data.description as string | undefined,
        includesQuestions: Boolean(data.includesQuestions),
        includesStatistics: Boolean(data.includesStatistics),
        includesHomeContent: Boolean(data.includesHomeContent),
        includesUsers: Boolean(data.includesUsers),
        includesNews: Boolean(data.includesNews),
        includesPapers: Boolean(data.includesPapers),
      };
    });

    return res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching backup metadata:', error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to load backup metadata',
    });
  }
});

router.get(
  '/:collectionName',
  validateKeycloakToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { collectionName } = req.params;
      if (!COLLECTIONS_TO_BACKUP.includes(collectionName)) {
        return res.status(400).json({ error: 'Unsupported collection' });
      }

      const docs = await backupCollection(collectionName);
      return res.json({
        success: true,
        data: { [collectionName]: docs },
        timestamp: new Date().toISOString(),
        collectionsCount: 1,
        documentsCount: docs.length,
      });
    } catch (error) {
      console.error('Single collection backup failed:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Backup failed',
      });
    }
  }
);

router.put(
  '/metadata/:fileName',
  validateKeycloakToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { fileName } = req.params;
      const updates = req.body as BackupMetadataUpdate;

      if (!fileName) {
        return res
          .status(400)
          .json({ success: false, error: 'fileName is required' });
      }

      const docRef = db.collection('BackupFiles').doc(fileName);
      await docRef.set(
        {
          fileName,
          ...updates,
        },
        { merge: true }
      );

      const snapshot = await docRef.get();
      const data = snapshot.data() as Record<string, unknown> | undefined;
      if (!data) {
        return res.status(500).json({
          success: false,
          error: 'Failed to load updated metadata',
        });
      }

      const result: BackupMetadata = {
        id: snapshot.id,
        fileName:
          (data.fileName as string | undefined) || (snapshot.id as string),
        displayName:
          (data.displayName as string | undefined) ||
          (data.name as string | undefined) ||
          (fileName as string),
        description: data.description as string | undefined,
        includesQuestions: Boolean(data.includesQuestions),
        includesStatistics: Boolean(data.includesStatistics),
        includesHomeContent: Boolean(data.includesHomeContent),
        includesUsers: Boolean(data.includesUsers),
        includesNews: Boolean(data.includesNews),
        includesPapers: Boolean(data.includesPapers),
      };

      return res.json({ success: true, item: result });
    } catch (error) {
      console.error('Error updating backup metadata:', error);
      return res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update metadata',
      });
    }
  }
);

export default router;
