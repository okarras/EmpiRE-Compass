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
 * GET /api/templates
 * Get all templates (public)
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
 * GET /api/templates/:templateId
 * Get template by ID (public)
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
 * POST /api/templates
 * Create template (admin only)
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
 * PUT /api/templates/:templateId
 * Update template (admin only)
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
 * DELETE /api/templates/:templateId
 * Delete template (admin only)
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
 * GET /api/templates/:templateId/questions
 * Get all questions for a template (public)
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
 * GET /api/templates/:templateId/questions/:questionId
 * Get question by ID (public)
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
 * POST /api/templates/:templateId/questions
 * Create question (admin only)
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
      const questionRef = db
        .collection('Templates')
        .doc(templateId)
        .collection('Questions')
        .doc(String(questionData.id));

      await questionRef.set(questionData);

      await logRequest(
        'write',
        `Templates/${templateId}/Questions`,
        String(questionData.id),
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
 * PUT /api/templates/:templateId/questions/:questionId
 * Update question (admin only)
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
 * DELETE /api/templates/:templateId/questions/:questionId
 * Delete question (admin only)
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
 * GET /api/templates/:templateId/statistics
 * Get all statistics for a template (public)
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
 * POST /api/templates/:templateId/statistics
 * Create statistic (admin only)
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
 * PUT /api/templates/:templateId/statistics/:statisticId
 * Update statistic (admin only)
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
 * DELETE /api/templates/:templateId/statistics/:statisticId
 * Delete statistic (admin only)
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
