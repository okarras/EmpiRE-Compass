import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import {
  validateKeycloakToken,
  AuthenticatedRequest,
  requireAdmin,
} from '../middleware/auth.js';

const router = express.Router();

export interface AiEvaluation {
  targetType: 'chart' | 'question' | 'sparql';
  targetId: string; // The query being evaluated, or some ID.
  rating: number; // e.g. 1-5 or -1, 1 for thumbs up/down
  comment?: string;
  userId: string;
  userEmail?: string;
  createdAt: number;
}

// POST a new AI evaluation
router.post(
  '/',
  validateKeycloakToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { targetType, targetId, rating, comment } = req.body;

      // We already have headers via validateKeycloakToken/AuthenticatedRequest
      const userId = req.userId;
      const userEmail = req.userEmail;

      if (!userId) {
        return res.status(401).json({ error: 'User ID is required' });
      }

      if (!targetType || !targetId || rating === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const db = getFirestore();
      const evaluationCollection = db.collection('aiEvaluations');

      const newEvaluation: AiEvaluation = {
        targetType,
        targetId,
        rating,
        comment: comment || '',
        userId,
        userEmail,
        createdAt: Date.now(),
      };

      const result = await evaluationCollection.add(newEvaluation);

      return res.status(201).json({
        id: result.id,
        message: 'Evaluation submitted successfully',
        evaluation: newEvaluation,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET evaluations (Admin only)
router.get(
  '/',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { limit = '50', targetType } = req.query;

      const db = getFirestore();
      let query: FirebaseFirestore.Query = db
        .collection('aiEvaluations')
        .orderBy('createdAt', 'desc');

      if (targetType) {
        query = query.where('targetType', '==', targetType);
      }

      const snapshot = await query.limit(parseInt(limit as string, 10)).get();

      const evaluations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.json(evaluations);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
