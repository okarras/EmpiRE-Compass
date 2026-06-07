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
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestions,
  resolveQuestionDocId,
  updateQuestion,
} from '../../services/templateService.js';
import type { QuestionData } from './swaggerSchemas.js';

const router = Router();

/**
 * @swagger
 * /api/templates/{templateId}/questions:
 *   get:
 *     summary: Get all questions for a template
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template
 *     responses:
 *       '200':
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *       '500':
 *         description: Failed to fetch questions
 */
router.get('/:templateId/questions', async (req, res) => {
  try {
    const { templateId } = req.params;
    const questions = await getQuestions(templateId);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * @swagger
 * /api/templates/{templateId}/questions/{questionId}:
 *   get:
 *     summary: Get question by ID
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the template
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the question to retrieve
 *     responses:
 *       '200':
 *         description: Question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       '404':
 *         description: Question not found
 *       '500':
 *         description: Failed to fetch question
 */
router.get('/:templateId/questions/:questionId', async (req, res) => {
  try {
    const { templateId, questionId } = req.params;
    const question = await getQuestionById(templateId, questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

/**
 * @swagger
 * /api/templates/{templateId}/questions:
 *   post:
 *     summary: Create question
 *     description: Validates SPARQL query syntax if provided
 *     tags:
 *       - Questions
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
 *             $ref: '#/components/schemas/Question'
 *     responses:
 *       '200':
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       '400':
 *         description: Missing required fields or invalid SPARQL query
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to create question
 */
router.post(
  '/:templateId/questions',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['id', 'uid', 'title', 'dataAnalysisInformation']),
  validateSPARQLQuery,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId } = req.params;
      const questionData: QuestionData = req.body;
      const created = await createQuestion(templateId, questionData);
      const questionDocId = resolveQuestionDocId(questionData);

      await logRequest(
        'write',
        `Templates/${templateId}/Questions`,
        questionDocId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'POST' },
        questionData
      );

      res.json(created);
    } catch (error) {
      console.error('Error creating question:', error);

      await logRequest(
        'write',
        `Templates/${req.params.templateId}/Questions`,
        String(req.body.id),
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to create question' });
    }
  }
);

/**
 * @swagger
 * /api/templates/{templateId}/questions/{questionId}:
 *   put:
 *     summary: Update question
 *     description: Validates SPARQL query syntax if provided
 *     tags:
 *       - Questions
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
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the question to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial question data to update
 *     responses:
 *       '200':
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       '400':
 *         description: Invalid SPARQL query
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Question not found
 *       '500':
 *         description: Failed to update question
 */
router.put(
  '/:templateId/questions/:questionId',
  validateKeycloakToken,
  requireAdmin,
  validateSPARQLQuery,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId, questionId } = req.params;
      const result = await updateQuestion(templateId, questionId, req.body);

      if (!result.ok) {
        return res.status(404).json({ error: 'Question not found' });
      }

      await logRequest(
        'update',
        `Templates/${templateId}/Questions`,
        result.id,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        req.body
      );

      res.json({ id: result.id, ...req.body });
    } catch (error) {
      console.error('Error updating question:', error);

      await logRequest(
        'update',
        `Templates/${req.params.templateId}/Questions`,
        req.params.questionId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to update question' });
    }
  }
);

/**
 * @swagger
 * /api/templates/{templateId}/questions/{questionId}:
 *   delete:
 *     summary: Delete question
 *     tags:
 *       - Questions
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
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the question to delete
 *     responses:
 *       '200':
 *         description: Question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Question not found
 *       '500':
 *         description: Failed to delete question
 */
router.delete(
  '/:templateId/questions/:questionId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId, questionId } = req.params;
      const result = await deleteQuestion(templateId, questionId);

      if (!result.ok) {
        return res.status(404).json({ error: 'Question not found' });
      }

      await logRequest(
        'delete',
        `Templates/${templateId}/Questions`,
        questionId,
        true,
        req.userId,
        req.userEmail
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting question:', error);

      await logRequest(
        'delete',
        `Templates/${req.params.templateId}/Questions`,
        req.params.questionId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to delete question' });
    }
  }
);

export default router;
