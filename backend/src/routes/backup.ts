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

export default router;
