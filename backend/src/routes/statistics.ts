import { Router } from 'express';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import {
  updateStatistics,
  updateEmpireStatistics,
  updateNlp4reStatistics,
  type TemplateKey,
} from '../services/orkgStatisticsService.js';
import { logRequest } from '../services/requestLogger.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StatisticsUpdateRequest:
 *       type: object
 *       properties:
 *         template:
 *           type: string
 *           enum: [empire, nlp4re]
 *           description: Template to update statistics for
 *         limit:
 *           type: integer
 *           description: Optional limit on number of papers to process
 *         updateFirebase:
 *           type: boolean
 *           default: true
 *           description: Whether to update Firebase with the results
 *     StatisticsUpdateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         globalStats:
 *           type: object
 *           properties:
 *             totalStatements:
 *               type: integer
 *             totalResources:
 *               type: integer
 *             totalLiterals:
 *               type: integer
 *             totalPredicates:
 *               type: integer
 *             globalDistinctResources:
 *               type: integer
 *             globalDistinctLiterals:
 *               type: integer
 *             globalDistinctPredicates:
 *               type: integer
 *             paperCount:
 *               type: integer
 *         firebaseUpdated:
 *           type: boolean
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/statistics/update:
 *   post:
 *     summary: Update statistics for a template
 *     description: |
 *       Fetches papers from ORKG, calculates RPL metrics, and updates Firebase.
 *       This endpoint replicates the functionality of the Python orkg-statistics.py script.
 *       Requires admin authentication.
 *     tags:
 *       - Statistics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatisticsUpdateRequest'
 *           example:
 *             template: empire
 *             limit: null
 *             updateFirebase: true
 *     responses:
 *       '200':
 *         description: Statistics updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatisticsUpdateResponse'
 *       '400':
 *         description: Invalid request body
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to update statistics
 */
router.post(
  '/update',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { template, limit, updateFirebase = true } = req.body;

      // Validate template
      if (!template || !['empire', 'nlp4re'].includes(template)) {
        return res.status(400).json({
          error: 'Invalid template. Must be "empire" or "nlp4re"',
        });
      }

      // Validate limit if provided
      if (limit !== undefined && (typeof limit !== 'number' || limit < 1)) {
        return res.status(400).json({
          error: 'Limit must be a positive integer if provided',
        });
      }

      console.log(
        `📊 Admin ${req.userEmail} (${req.userId}) requested statistics update for template: ${template}`
      );

      // Update statistics
      const result = await updateStatistics(template as TemplateKey, {
        limit,
        updateFirebase,
      });

      // Log the request
      await logRequest(
        'write',
        'Statistics',
        `update-${template}`,
        result.success,
        req.userId,
        req.userEmail,
        result.error,
        { method: 'POST', template, limit, updateFirebase },
        result.globalStats
      );

      if (result.success) {
        res.json({
          success: true,
          globalStats: result.globalStats,
          firebaseUpdated: result.firebaseUpdated,
          message: `Statistics updated successfully for ${template}`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error updating statistics:', error);

      await logRequest(
        'write',
        'Statistics',
        `update-${req.body.template || 'unknown'}`,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update statistics',
      });
    }
  }
);

/**
 * @swagger
 * /api/statistics/update/empire:
 *   post:
 *     summary: Update KG-EmpiRE statistics
 *     description: Convenience endpoint for updating KG-EmpiRE statistics
 *     tags:
 *       - Statistics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *               updateFirebase:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       '200':
 *         description: Statistics updated successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to update statistics
 */
router.post(
  '/update/empire',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { limit, updateFirebase = true } = req.body;

      console.log(
        `📊 Admin ${req.userEmail} (${req.userId}) requested KG-EmpiRE statistics update`
      );

      const result = await updateEmpireStatistics({ limit, updateFirebase });

      await logRequest(
        'write',
        'Statistics',
        'update-empire',
        result.success,
        req.userId,
        req.userEmail,
        result.error,
        { method: 'POST', limit, updateFirebase },
        result.globalStats
      );

      if (result.success) {
        res.json({
          success: true,
          globalStats: result.globalStats,
          firebaseUpdated: result.firebaseUpdated,
          message: 'KG-EmpiRE statistics updated successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error updating KG-EmpiRE statistics:', error);

      await logRequest(
        'write',
        'Statistics',
        'update-empire',
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update KG-EmpiRE statistics',
      });
    }
  }
);

/**
 * @swagger
 * /api/statistics/update/nlp4re:
 *   post:
 *     summary: Update NLP4RE statistics
 *     description: Convenience endpoint for updating NLP4RE statistics
 *     tags:
 *       - Statistics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *               updateFirebase:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       '200':
 *         description: Statistics updated successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to update statistics
 */
router.post(
  '/update/nlp4re',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { limit, updateFirebase = true } = req.body;

      console.log(
        `📊 Admin ${req.userEmail} (${req.userId}) requested NLP4RE statistics update`
      );

      const result = await updateNlp4reStatistics({ limit, updateFirebase });

      await logRequest(
        'write',
        'Statistics',
        'update-nlp4re',
        result.success,
        req.userId,
        req.userEmail,
        result.error,
        { method: 'POST', limit, updateFirebase },
        result.globalStats
      );

      if (result.success) {
        res.json({
          success: true,
          globalStats: result.globalStats,
          firebaseUpdated: result.firebaseUpdated,
          message: 'NLP4RE statistics updated successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error updating NLP4RE statistics:', error);

      await logRequest(
        'write',
        'Statistics',
        'update-nlp4re',
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update NLP4RE statistics',
      });
    }
  }
);

export default router;
