import { Router } from 'express';
import { db } from '../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { validateRequiredFields } from '../middleware/validation.js';
import { logRequest } from '../services/requestLogger.js';

const router = Router();

export interface DynamicQuestion {
  id: string;
  name: string;
  timestamp: number;
  isCommunity?: boolean;
  state: {
    question: string;
    sparqlQuery?: string;
    sparqlTranslation?: string;
    queryResults?: any[];
    chartHtml?: string;
    questionInterpretation?: string;
    dataCollectionInterpretation?: string;
    dataAnalysisInterpretation?: string;
    processingFunctionCode?: string;
    history?: any[];
    templateId?: string;
    templateMapping?: Record<string, any>;
    targetClassId?: string;
  };
}

/**
 * GET /api/dynamic-questions
 * Get all dynamic questions (public read)
 */
/**
 * GET /api/dynamic-questions
 * Get all dynamic questions (public read)
 */
router.get('/', async (req, res) => {
  try {
    const limitCount = parseInt(req.query.limit as string) || 50;
    const questionsRef = db
      .collection('DynamicQuestions')
      .orderBy('timestamp', 'desc')
      .limit(limitCount);

    const snapshot = await questionsRef.get();
    const questions: DynamicQuestion[] = [];

    snapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data(),
      } as DynamicQuestion);
    });

    res.json(questions);
  } catch (error) {
    console.error('Error fetching dynamic questions:', error);
    res.status(500).json({ error: 'Failed to fetch dynamic questions' });
  }
});

/**
 * GET /api/dynamic-questions/community
 * Get community dynamic questions (public read)
 */
router.get('/community', async (req, res) => {
  try {
    const limitCount = parseInt(req.query.limit as string) || 50;
    const questionsRef = db
      .collection('DynamicQuestions')
      .where('isCommunity', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(limitCount);

    const snapshot = await questionsRef.get();
    const questions: DynamicQuestion[] = [];

    snapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data(),
      } as DynamicQuestion);
    });

    res.json(questions);
  } catch (error) {
    console.error('Error fetching community questions:', error);
    res.status(500).json({ error: 'Failed to fetch community questions' });
  }
});

/**
 * GET /api/dynamic-questions/:questionId
 * Get a single dynamic question by ID (public read)
 */
router.get('/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const questionRef = db.collection('DynamicQuestions').doc(questionId);
    const questionDoc = await questionRef.get();

    if (!questionDoc.exists) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      id: questionDoc.id,
      ...questionDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching dynamic question:', error);
    res.status(500).json({ error: 'Failed to fetch dynamic question' });
  }
});

/**
 * POST /api/dynamic-questions
 * Create or update a dynamic question (admin only)
 */
router.post(
  '/',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['name', 'state']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const questionData: DynamicQuestion = req.body;

      // Validate required fields in state
      if (!questionData.state || !questionData.state.question) {
        return res.status(400).json({
          error: 'state.question is required',
        });
      }

      const questionId =
        questionData.id ||
        `question_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const questionRef = db.collection('DynamicQuestions').doc(questionId);

      // Prepare data (exclude id from document data, use it as document ID)
      const { id: _id, ...questionDocData } = questionData;

      await questionRef.set(
        {
          ...questionDocData,
          timestamp: questionData.timestamp || Date.now(),
        },
        { merge: true }
      );

      await logRequest(
        'write',
        'DynamicQuestions',
        questionId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'POST' },
        questionDocData
      );

      res.json({ id: questionId, ...questionDocData });
    } catch (error) {
      console.error('Error saving dynamic question:', error);

      await logRequest(
        'write',
        'DynamicQuestions',
        req.body.id || 'unknown',
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to save dynamic question' });
    }
  }
);

/**
 * PUT /api/dynamic-questions/:questionId
 * Update a dynamic question (admin only)
 */
router.put(
  '/:questionId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { questionId } = req.params;
      const questionData: Partial<DynamicQuestion> = req.body;

      const questionRef = db.collection('DynamicQuestions').doc(questionId);
      const questionDoc = await questionRef.get();

      if (!questionDoc.exists) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Remove id from update data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...updateData } = questionData;

      await questionRef.set(updateData, { merge: true });

      await logRequest(
        'update',
        'DynamicQuestions',
        questionId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        updateData
      );

      res.json({ id: questionId, ...updateData });
    } catch (error) {
      console.error('Error updating dynamic question:', error);

      await logRequest(
        'update',
        'DynamicQuestions',
        req.params.questionId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to update dynamic question' });
    }
  }
);

/**
 * DELETE /api/dynamic-questions/:questionId
 * Delete a dynamic question (admin only)
 */
router.delete(
  '/:questionId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { questionId } = req.params;
      const questionRef = db.collection('DynamicQuestions').doc(questionId);
      const questionDoc = await questionRef.get();

      if (!questionDoc.exists) {
        return res.status(404).json({ error: 'Question not found' });
      }

      await questionRef.delete();

      await logRequest(
        'delete',
        'DynamicQuestions',
        questionId,
        true,
        req.userId,
        req.userEmail
      );

      res.json({ success: true, id: questionId });
    } catch (error) {
      console.error('Error deleting dynamic question:', error);

      await logRequest(
        'delete',
        'DynamicQuestions',
        req.params.questionId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to delete dynamic question' });
    }
  }
);

export default router;
