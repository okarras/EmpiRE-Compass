import { Router, Request, Response } from 'express';
import { AIService } from '../aiService.js';

const router = Router();

// Store reference to AI service for health check
let aiService: AIService | null = null;

/**
 * Set AI service instance for health check
 * Should be called during server initialization
 */
export const setAIServiceForHealth = (service: AIService): void => {
  aiService = service;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *         timestamp:
 *           type: string
 *           format: date-time
 *         aiConfigured:
 *           type: boolean
 *           description: Whether AI service is configured
 *
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       '200':
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: aiService ? aiService.isConfigured() : false,
  });
});

export default router;
