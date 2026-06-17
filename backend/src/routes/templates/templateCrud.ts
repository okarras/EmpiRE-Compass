import { Router } from 'express';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../../middleware/auth.js';
import { validateRequiredFields } from '../../middleware/validation.js';
import { logRequest } from '../../services/requestLogger.js';
import {
  createTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
} from '../../services/templateService.js';
import type { TemplateData } from './swaggerSchemas.js';

const router = Router();

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all templates
 *     tags:
 *       - Templates
 *     responses:
 *       '200':
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/Template'
 *       '500':
 *         description: Failed to fetch templates
 */
router.get('/', async (req, res) => {
  try {
    const templates = await getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * @swagger
 * /api/templates/{templateId}:
 *   get:
 *     summary: Get template by ID
 *     tags:
 *       - Templates
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template to retrieve
 *     responses:
 *       '200':
 *         description: Template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       '404':
 *         description: Template not found
 *       '500':
 *         description: Failed to fetch template
 */
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await getTemplateById(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Create template
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Template'
 *     responses:
 *       '200':
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       '400':
 *         description: Missing required fields
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to create template
 */
router.post(
  '/',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['id', 'title', 'collectionName']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const templateData: TemplateData = req.body;
      const created = await createTemplate(templateData);

      await logRequest(
        'write',
        'Templates',
        templateData.id,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'POST' },
        templateData
      );

      res.json(created);
    } catch (error) {
      console.error('Error creating template:', error);

      await logRequest(
        'write',
        'Templates',
        req.body.id,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to create template' });
    }
  }
);

/**
 * @swagger
 * /api/templates/{templateId}:
 *   put:
 *     summary: Update template
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial template data to update
 *     responses:
 *       '200':
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Template not found
 *       '500':
 *         description: Failed to update template
 */
router.put(
  '/:templateId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId } = req.params;
      const result = await updateTemplate(templateId, req.body);

      if (!result.ok) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await logRequest(
        'update',
        'Templates',
        templateId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        req.body
      );

      res.json({ id: templateId, ...req.body });
    } catch (error) {
      console.error('Error updating template:', error);

      await logRequest(
        'update',
        'Templates',
        req.params.templateId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to update template' });
    }
  }
);

/**
 * @swagger
 * /api/templates/{templateId}:
 *   delete:
 *     summary: Delete template
 *     tags:
 *       - Templates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template to delete
 *     responses:
 *       '200':
 *         description: Template deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Template not found
 *       '500':
 *         description: Failed to delete template
 */
router.delete(
  '/:templateId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId } = req.params;
      const result = await deleteTemplate(templateId);

      if (!result.ok) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await logRequest(
        'delete',
        'Templates',
        templateId,
        true,
        req.userId,
        req.userEmail
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting template:', error);

      await logRequest(
        'delete',
        'Templates',
        req.params.templateId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to delete template' });
    }
  }
);

export default router;
