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
  getStatisticsProgress,
  type TemplateKey,
} from '../services/orkgStatisticsService.js';
import { logRequest } from '../services/requestLogger.js';

const router = Router();

/**
 * @swagger
 * /api/statistics/progress/{template}:
 *   get:
 *     summary: Get current statistics update progress
 *     description: Returns progress for ongoing or completed statistics update. Use for progress bar.
 *     tags:
 *       - Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: template
 *         required: true
 *         schema:
 *           type: string
 *           enum: [empire, nlp4re]
 *     responses:
 *       '200':
 *         description: Progress data
 *       '400':
 *         description: Invalid template
 *       '401':
 *         description: Unauthorized
 */
router.get(
  '/progress/:template',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const template = req.params.template;
      if (!template || !['empire', 'nlp4re'].includes(template)) {
        return res.status(400).json({
          error: 'Invalid template. Must be "empire" or "nlp4re"',
        });
      }
      const progress = await getStatisticsProgress(template as TemplateKey);
      res.json(progress || { status: 'idle' });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to get progress',
      });
    }
  }
);

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
      const {
        template,
        limit,
        updateFirebase = true,
        resume = true,
        stream = false,
      } = req.body;

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

      const templateKey = template as TemplateKey;

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const sendEvent = (data: object) => {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          if (typeof (res as any).flush === 'function') (res as any).flush();
        };

        const result = await updateStatistics(templateKey, {
          limit,
          updateFirebase,
          resume,
          onProgress: (progress) =>
            sendEvent({ type: 'progress', ...progress }),
        });

        await logRequest(
          'write',
          'Statistics',
          `update-${template}`,
          result.success,
          req.userId,
          req.userEmail,
          result.error,
          { method: 'POST', template, limit, updateFirebase, stream: true },
          result.globalStats
        );

        sendEvent({
          type: 'complete',
          success: result.success,
          globalStats: result.globalStats,
          firebaseUpdated: result.firebaseUpdated,
          error: result.error,
        });
        res.end();
      } else {
        const result = await updateStatistics(templateKey, {
          limit,
          updateFirebase,
          resume,
        });

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
      }
    } catch (error) {
      await logRequest(
        'write',
        'Statistics',
        `update-${req.body?.template || 'unknown'}`,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      if (req.body?.stream) {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update statistics',
          })}\n\n`
        );
        res.end();
      } else {
        res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update statistics',
        });
      }
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
      const { limit, updateFirebase = true, resume = true } = req.body;

      const result = await updateEmpireStatistics({
        limit,
        updateFirebase,
        resume,
      });

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
      const { limit, updateFirebase = true, resume = true } = req.body;

      const result = await updateNlp4reStatistics({
        limit,
        updateFirebase,
        resume,
      });

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
