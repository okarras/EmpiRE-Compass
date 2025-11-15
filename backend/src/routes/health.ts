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
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: aiService ? aiService.isConfigured() : false,
  });
});

export default router;
