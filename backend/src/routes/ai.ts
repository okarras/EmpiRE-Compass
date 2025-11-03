import { Router, Request, Response } from 'express';
import { AIService, type AIConfig } from '../aiService.js';
import { validateApiKey, validateGenerateTextRequest } from '../middleware.js';

const router = Router();

// Initialize AI service (singleton pattern)
let aiService: AIService | null = null;

/**
 * Initialize AI service with configuration
 * Should be called once during server startup
 */
export const initializeAIService = (config: AIConfig): void => {
  aiService = new AIService(config);
};

/**
 * Get the AI service instance
 */
const getAIService = (): AIService => {
  if (!aiService) {
    // Fallback initialization if not already initialized
    const fallbackConfig: AIConfig = {
      provider: (process.env.AI_PROVIDER as 'openai' | 'groq') || 'groq',
      openaiModel:
        (process.env.OPENAI_MODEL as
          | 'gpt-4o-mini'
          | 'gpt-4o'
          | 'gpt-4-turbo') || 'gpt-4o-mini',
      groqModel:
        (process.env.GROQ_MODEL as
          | 'deepseek-r1-distill-llama-70b'
          | 'llama-3-70b-8192'
          | 'mixtral-8x7b-32768') || 'deepseek-r1-distill-llama-70b',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      groqApiKey: process.env.GROQ_API_KEY || '',
    };
    aiService = new AIService(fallbackConfig);
  }
  return aiService;
};

/**
 * GET /api/ai/config
 * Get current AI configuration
 */
router.get('/config', validateApiKey, (req: Request, res: Response) => {
  try {
    const config = getAIService().getCurrentConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting AI config:', error);
    res.status(500).json({ error: 'Failed to get AI configuration' });
  }
});

/**
 * POST /api/ai/generate
 * Generate text using AI
 */
router.post(
  '/generate',
  validateApiKey,
  validateGenerateTextRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        provider,
        model,
        temperature,
        maxTokens,
        systemContext,
        // NOTE: API keys from request body are IGNORED for security
        // Backend always uses its own environment keys
      } = req.body;

      const result = await getAIService().generateText({
        prompt,
        provider,
        model,
        temperature,
        maxTokens,
        systemContext,
        // Backend uses environment keys only - never accepts user keys
      });

      res.json(result);
    } catch (error) {
      console.error('Error generating text:', error);

      if (error instanceof Error) {
        if (error.message.includes('API key is not configured')) {
          return res
            .status(500)
            .json({ error: 'AI service not properly configured' });
        }
        if (error.message.includes('rate limit')) {
          return res.status(429).json({ error: 'Rate limit exceeded' });
        }
      }

      res.status(500).json({ error: 'Failed to generate text' });
    }
  }
);

export default router;
