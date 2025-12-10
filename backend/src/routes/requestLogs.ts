import { Router } from 'express';
import { db } from '../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RequestLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         collection:
 *           type: string
 *         operation:
 *           type: string
 *           enum: [read, write, update, delete, query]
 *         success:
 *           type: boolean
 *         timestamp:
 *           type: string
 *           format: date-time
 *         userId:
 *           type: string
 *         userEmail:
 *           type: string
 *         error:
 *           type: string
 *     RequestLogsResponse:
 *       type: object
 *       properties:
 *         logs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RequestLog'
 *         count:
 *           type: integer
 *         filters:
 *           type: object
 *           properties:
 *             collection:
 *               type: string
 *             operation:
 *               type: string
 *             success:
 *               type: string
 *
 * /api/request-logs:
 *   get:
 *     summary: Get request logs
 *     description: Admin only. Returns filtered request logs with pagination.
 *     tags:
 *       - Request Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 200
 *         description: Number of logs to return
 *       - in: query
 *         name: collection
 *         schema:
 *           type: string
 *         description: Filter by collection name
 *       - in: query
 *         name: operation
 *         schema:
 *           type: string
 *           enum: [read, write, update, delete, query]
 *         description: Filter by operation type
 *       - in: query
 *         name: success
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by success status
 *     responses:
 *       '200':
 *         description: Request logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RequestLogsResponse'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to fetch request logs
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
