import { Router } from 'express';
import { db } from '../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/request-logs
 * Get request logs (admin only)
 * Query params:
 *   - limit: number of logs to return (default: 200)
 *   - collection: filter by collection
 *   - operation: filter by operation (read, write, update, delete, query)
 *   - success: filter by success status (true/false)
 */
router.get(
  '/',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 200;
      const collectionFilter = req.query.collection as string;
      const operationFilter = req.query.operation as string;
      const successFilter = req.query.success as string;

      let query = db
        .collection('FirebaseRequestLogs')
        .orderBy('timestamp', 'desc')
        .limit(limit);

      // Apply filters
      if (collectionFilter) {
        query = query.where('collection', '==', collectionFilter);
      }
      if (operationFilter) {
        query = query.where('operation', '==', operationFilter);
      }
      if (successFilter === 'true' || successFilter === 'false') {
        query = query.where('success', '==', successFilter === 'true');
      }

      const snapshot = await query.get();
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp:
          doc.data().timestamp?.toDate?.()?.toISOString() ||
          doc.data().timestamp,
      }));

      res.json({
        logs,
        count: logs.length,
        filters: {
          collection: collectionFilter,
          operation: operationFilter,
          success: successFilter,
        },
      });
    } catch (error) {
      console.error('Error fetching request logs:', error);
      res.status(500).json({ error: 'Failed to fetch request logs' });
    }
  }
);

export default router;
