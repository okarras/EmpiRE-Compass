import { Router } from 'express';
import { db } from '../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import {
  validateSPARQLQuery,
  validateRequiredFields,
} from '../middleware/validation.js';
import { logRequest } from '../services/requestLogger.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Template:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - collectionName
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         collectionName:
 *           type: string
 *         description:
 *           type: string
 *     Question:
 *       type: object
 *       required:
 *         - id
 *         - uid
 *         - title
 *         - dataAnalysisInformation
 *       properties:
 *         id:
 *           type: integer
 *         uid:
 *           type: string
 *         uid_2:
 *           type: string
 *         uid_2_merge:
 *           type: string
 *         title:
 *           type: string
 *         chartType:
 *           type: string
 *           enum: [bar, pie]
 *         dataAnalysisInformation:
 *           type: object
 *           properties:
 *             question:
 *               type: string
 *             questionExplanation:
 *               type: array
 *               items:
 *                 type: string
 *             dataAnalysis:
 *               type: array
 *               items:
 *                 type: string
 *             dataInterpretation:
 *               type: array
 *               items:
 *                 type: string
 *             requiredDataForAnalysis:
 *               type: array
 *               items:
 *                 type: string
 *         sparqlQuery:
 *           type: string
 *         sparqlQuery2:
 *           type: string
 *         chartSettings:
 *           type: object
 *         chartSettings2:
 *           type: object
 *         dataProcessingFunctionName:
 *           type: string
 *         dataProcessingFunctionName2:
 *           type: string
 *         tabs:
 *           type: object
 *           properties:
 *             tab1_name:
 *               type: string
 *             tab2_name:
 *               type: string
 *         gridOptions:
 *           type: object
 *           properties:
 *             defaultColumns:
 *               type: array
 *               items:
 *                 type: string
 *             defaultGroupBy:
 *               type: string
 *     Statistic:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - sparqlQuery
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         sparqlQuery:
 *           type: string
 *         description:
 *           type: string
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 */

export interface TemplateData {
  id: string;
  title: string;
  collectionName: string;
  description?: string;
}

export interface QuestionData {
  id: number;
  uid: string;
  uid_2?: string;
  uid_2_merge?: string;
  title: string;
  chartType?: 'bar' | 'pie';
  dataAnalysisInformation: {
    question: string;
    questionExplanation?: string | string[];
    dataAnalysis?: string | string[];
    dataInterpretation?: string | string[];
    requiredDataForAnalysis?: string | string[];
  };
  sparqlQuery?: string;
  sparqlQuery2?: string;
  chartSettings?: unknown;
  chartSettings2?: unknown;
  dataProcessingFunctionName?: string;
  dataProcessingFunctionName2?: string;
  tabs?: {
    tab1_name: string;
    tab2_name: string;
  };
  gridOptions?: {
    defaultColumns?: string[];
    defaultGroupBy?: string;
  };
}

export interface StatisticData {
  id: string;
  name: string;
  sparqlQuery: string;
  description?: string;
}

// ========== Templates Routes ==========

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
    const templatesSnapshot = await db.collection('Templates').get();
    const templates: Record<string, TemplateData> = {};

    templatesSnapshot.forEach((doc) => {
      templates[doc.id] = { id: doc.id, ...doc.data() } as TemplateData;
    });

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
    const templateDoc = await db.collection('Templates').doc(templateId).get();

    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ id: templateDoc.id, ...templateDoc.data() });
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
      const templateRef = db.collection('Templates').doc(templateData.id);

      await templateRef.set(templateData);

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

      res.json({ ...templateData, id: templateRef.id });
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
      const templateRef = db.collection('Templates').doc(templateId);

      const doc = await templateRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await templateRef.update(req.body);

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
      const templateRef = db.collection('Templates').doc(templateId);

      const doc = await templateRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await templateRef.delete();

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

// ========== Questions Routes (Nested) ==========

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
    const questionsSnapshot = await db
      .collection('Templates')
      .doc(templateId)
      .collection('Questions')
      .get();

    const questions: QuestionData[] = [];
    questionsSnapshot.forEach((doc) => {
      questions.push(doc.data() as QuestionData);
    });

    questions.sort((a, b) => a.id - b.id);
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
    const questionDoc = await db
      .collection('Templates')
      .doc(templateId)
      .collection('Questions')
      .doc(questionId)
      .get();

    if (!questionDoc.exists) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(questionDoc.data());
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
      const questionDocId =
        questionData.uid && questionData.uid.trim().length > 0
          ? questionData.uid
          : String(questionData.id);

      const questionRef = db
        .collection('Templates')
        .doc(templateId)
        .collection('Questions')
        .doc(questionDocId);

      await questionRef.set(questionData);

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

      res.json({ ...questionData, id: questionRef.id });
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
      const questionRef = db
        .collection('Templates')
        .doc(templateId)
        .collection('Questions')
        .doc(questionId);

      const doc = await questionRef.get();
      if (!doc.exists) {
        // Fallback: try to locate question by numeric id for backward compatibility
        const questionsCollection = db
          .collection('Templates')
          .doc(templateId)
          .collection('Questions');
        const legacyDoc = await questionsCollection
          .where('id', '==', Number(questionId))
          .limit(1)
          .get();

        if (!legacyDoc.empty) {
          const legacyDocRef = legacyDoc.docs[0].ref;
          await legacyDocRef.update(req.body);

          await logRequest(
            'update',
            `Templates/${templateId}/Questions`,
            legacyDocRef.id,
            true,
            req.userId,
            req.userEmail,
            undefined,
            { method: 'PUT' },
            req.body
          );

          return res.json({ id: legacyDocRef.id, ...req.body });
        }

        return res.status(404).json({ error: 'Question not found' });
      }

      await questionRef.update(req.body);

      await logRequest(
        'update',
        `Templates/${templateId}/Questions`,
        questionId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        req.body
      );

      res.json({ id: questionId, ...req.body });
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
      const questionRef = db
        .collection('Templates')
        .doc(templateId)
        .collection('Questions')
        .doc(questionId);

      const doc = await questionRef.get();
      if (!doc.exists) {
        // Fallback for legacy numeric IDs
        const questionsCollection = db
          .collection('Templates')
          .doc(templateId)
          .collection('Questions');
        const legacyDoc = await questionsCollection
          .where('id', '==', Number(questionId))
          .limit(1)
          .get();

        if (!legacyDoc.empty) {
          const legacyDocRef = legacyDoc.docs[0].ref;
          await legacyDocRef.delete();

          await logRequest(
            'delete',
            `Templates/${templateId}/Questions`,
            legacyDocRef.id,
            true,
            req.userId,
            req.userEmail
          );

          return res.json({ success: true });
        }

        return res.status(404).json({ error: 'Question not found' });
      }

      await questionRef.delete();

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

// ========== Statistics Routes (Nested) ==========

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
    const statisticsSnapshot = await db
      .collection('Templates')
      .doc(templateId)
      .collection('Statistics')
      .get();

    const statistics: StatisticData[] = [];
    statisticsSnapshot.forEach((doc) => {
      statistics.push({ id: doc.id, ...doc.data() } as StatisticData);
    });

    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
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
      const statisticRef = db
        .collection('Templates')
        .doc(templateId)
        .collection('Statistics')
        .doc(statisticData.id);

      await statisticRef.set(statisticData);

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

      res.json({ ...statisticData, id: statisticRef.id });
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
      const statisticRef = db
        .collection('Templates')
        .doc(templateId)
        .collection('Statistics')
        .doc(statisticId);

      const doc = await statisticRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Statistic not found' });
      }

      await statisticRef.update(req.body);

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
      const statisticRef = db
        .collection('Templates')
        .doc(templateId)
        .collection('Statistics')
        .doc(statisticId);

      const doc = await statisticRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Statistic not found' });
      }

      await statisticRef.delete();

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
