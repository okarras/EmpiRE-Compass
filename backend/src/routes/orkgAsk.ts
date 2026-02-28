import { Router, Response } from 'express';
import { orkgAskService } from '../services/orkgAskService.js';
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
 *                 description: Maximum number of citations to return (default = 10)
 *                 default: 10
 *               temperature:
 *                 type: number
 *                 description: Temperature for LLM generation (default = 0.3)
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
  '/synthesize',
  validateKeycloakToken,
  createUserRateLimiter(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { question, itemIds } = req.body;

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({
          error: 'Question is required and must be a non-empty string',
        });
      }

      const result = await orkgAskService.synthesizeAbstracts(
        question.trim(),
        itemIds
      );

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
 * /api/orkg-ask/generate:
 *   post:
 *     summary: Generate an LLM response from a prompt
 *     description: Pass an arbitrary prompt to the ORKG Ask API
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
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The prompt
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post(
  '/generate',
  validateKeycloakToken,
  createUserRateLimiter(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
          error: 'Prompt is required and must be a non-empty string',
        });
      }

      const result = await orkgAskService.generate(prompt.trim());

      res.json(result);
    } catch (error) {
      console.error('ORKG ASK generate error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
