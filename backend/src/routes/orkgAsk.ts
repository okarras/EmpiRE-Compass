import { Router, Response } from 'express';
import {
  askOrkg,
  synthesizeAbstracts,
  type OrkgAskRequest,
} from '../services/orkgAskService.js';
import {
  validateKeycloakToken,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import { createUserRateLimiter } from '../middleware/aiRateLimit.js';

const router = Router();

/**
 * @swagger
 * /api/orkg-ask:
 *   post:
 *     summary: Ask ORKG ASK a research question
 *     description: Uses ORKG ASK LLM API to generate an answer with citations
 *     tags: [ORKG ASK]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: The research question to ask
 *               max_results:
 *                 type: number
 *                 description: Maximum number of citations to return (default: 10)
 *                 default: 10
 *               temperature:
 *                 type: number
 *                 description: Temperature for LLM generation (default: 0.3)
 *                 default: 0.3
 *     responses:
 *       200:
 *         description: Successful response with answer and citations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 citations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       authors:
 *                         type: array
 *                         items:
 *                           type: string
 *                       year:
 *                         type: number
 *                       venue:
 *                         type: string
 *                       url:
 *                         type: string
 *                       abstract:
 *                         type: string
 *                       relevance_score:
 *                         type: number
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  validateKeycloakToken,
  createUserRateLimiter(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { question, max_results, temperature } = req.body;

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({
          error: 'Question is required and must be a non-empty string',
        });
      }

      const request: OrkgAskRequest = {
        question: question.trim(),
        max_results: max_results || 10,
        temperature: temperature || 0.3,
      };

      const result = await askOrkg(request);

      res.json(result);
    } catch (error) {
      console.error('ORKG ASK error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * @swagger
 * /api/orkg-ask/synthesize:
 *   get:
 *     summary: Synthesize abstracts for a research question
 *     description: Get relevant paper abstracts for a question
 *     tags: [ORKG ASK]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: question
 *         required: true
 *         schema:
 *           type: string
 *         description: The research question
 *       - in: query
 *         name: max_items
 *         schema:
 *           type: number
 *           default: 10
 *         description: Maximum number of items to return
 *     responses:
 *       200:
 *         description: Successful response with citations
 */
router.get(
  '/synthesize',
  validateKeycloakToken,
  createUserRateLimiter(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { question, max_items } = req.query;

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({
          error: 'Question query parameter is required',
        });
      }

      const citations = await synthesizeAbstracts(
        question.trim(),
        max_items ? parseInt(max_items as string, 10) : 10
      );

      res.json({ citations });
    } catch (error) {
      console.error('ORKG ASK synthesize error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
