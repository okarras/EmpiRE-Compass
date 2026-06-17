import { Router } from 'express';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../../middleware/auth.js';
import {
  validateSPARQLQuery,
  validateRequiredFields,
} from '../../middleware/validation.js';
import { logRequest } from '../../services/requestLogger.js';
import {
  createStatistic,
  deleteStatistic,
  getStatistics,
  updateStatistic,
} from '../../services/templateService.js';
import type { StatisticData } from './swaggerSchemas.js';

const router = Router();

/**
 * @swagger
 * /api/templates/{templateId}/statistics:
 *   get:
 *     summary: Get all statistics for a template
 *     tags:
 *       - Statistics
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template
 *     responses:
 *       '200':
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Statistic'
 *       '500':
 *         description: Failed to fetch statistics
 */
router.get('/:templateId/statistics', async (req, res) => {
  try {
    const { templateId } = req.params;
    const statistics = await getStatistics(templateId);
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * @swagger
 * /api/templates/{templateId}/statistics:
 *   post:
 *     summary: Create statistic
 *     description: Validates SPARQL query syntax
 *     tags:
 *       - Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Statistic'
 *     responses:
 *       '200':
 *         description: Statistic created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Statistic'
 *       '400':
 *         description: Missing required fields or invalid SPARQL query
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to create statistic
 */
router.post(
  '/:templateId/statistics',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['id', 'name', 'sparqlQuery']),
  validateSPARQLQuery,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId } = req.params;
      const statisticData: StatisticData = req.body;
      const created = await createStatistic(templateId, statisticData);

      await logRequest(
        'write',
        `Templates/${templateId}/Statistics`,
        statisticData.id,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'POST' },
        statisticData
      );

      res.json(created);
    } catch (error) {
      console.error('Error creating statistic:', error);

      await logRequest(
        'write',
        `Templates/${req.params.templateId}/Statistics`,
        req.body.id,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to create statistic' });
    }
  }
);

/**
 * @swagger
 * /api/templates/{templateId}/statistics/{statisticId}:
 *   put:
 *     summary: Update statistic
 *     description: Validates SPARQL query syntax if provided
 *     tags:
 *       - Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template
 *       - in: path
 *         name: statisticId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the statistic to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial statistic data to update
 *     responses:
 *       '200':
 *         description: Statistic updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Statistic'
 *       '400':
 *         description: Invalid SPARQL query
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Statistic not found
 *       '500':
 *         description: Failed to update statistic
 */
router.put(
  '/:templateId/statistics/:statisticId',
  validateKeycloakToken,
  requireAdmin,
  validateSPARQLQuery,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId, statisticId } = req.params;
      const result = await updateStatistic(templateId, statisticId, req.body);

      if (!result.ok) {
        return res.status(404).json({ error: 'Statistic not found' });
      }

      await logRequest(
        'update',
        `Templates/${templateId}/Statistics`,
        statisticId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        req.body
      );

      res.json({ id: statisticId, ...req.body });
    } catch (error) {
      console.error('Error updating statistic:', error);

      await logRequest(
        'update',
        `Templates/${req.params.templateId}/Statistics`,
        req.params.statisticId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to update statistic' });
    }
  }
);

/**
 * @swagger
 * /api/templates/{templateId}/statistics/{statisticId}:
 *   delete:
 *     summary: Delete statistic
 *     tags:
 *       - Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template
 *       - in: path
 *         name: statisticId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the statistic to delete
 *     responses:
 *       '200':
 *         description: Statistic deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Statistic not found
 *       '500':
 *         description: Failed to delete statistic
 */
router.delete(
  '/:templateId/statistics/:statisticId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId, statisticId } = req.params;
      const result = await deleteStatistic(templateId, statisticId);

      if (!result.ok) {
        return res.status(404).json({ error: 'Statistic not found' });
      }

      await logRequest(
        'delete',
        `Templates/${templateId}/Statistics`,
        statisticId,
        true,
        req.userId,
        req.userEmail
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting statistic:', error);

      await logRequest(
        'delete',
        `Templates/${req.params.templateId}/Statistics`,
        req.params.statisticId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to delete statistic' });
    }
  }
);

export default router;
