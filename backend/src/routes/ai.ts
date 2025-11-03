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
// Helper function to sanitize environment variables (remove quotes)
const sanitizeEnvVar = (
  value: string | undefined,
  defaultValue: string
): string => {
  if (!value) return defaultValue;
  // Remove surrounding quotes if present
  return value.trim().replace(/^["']|["']$/g, '');
};

const getAIService = (): AIService => {
  if (!aiService) {
    // Fallback initialization if not already initialized
    const fallbackConfig: AIConfig = {
      provider:
        (sanitizeEnvVar(process.env.AI_PROVIDER, 'groq') as
          | 'openai'
          | 'groq') || 'groq',
      openaiModel:
        (sanitizeEnvVar(process.env.OPENAI_MODEL, 'gpt-4o-mini') as
          | 'gpt-4o-mini'
          | 'gpt-4o'
          | 'gpt-4-turbo') || 'gpt-4o-mini',
      groqModel:
        (sanitizeEnvVar(
          process.env.GROQ_MODEL,
          'deepseek-r1-distill-llama-70b'
        ) as
          | 'deepseek-r1-distill-llama-70b'
          | 'llama-3-70b-8192'
          | 'mixtral-8x7b-32768') || 'deepseek-r1-distill-llama-70b',
      openaiApiKey: sanitizeEnvVar(process.env.OPENAI_API_KEY, ''),
      groqApiKey: sanitizeEnvVar(process.env.GROQ_API_KEY, ''),
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
    const service = getAIService();
    const config = service.getCurrentConfig();
    const isConfigured = service.isConfigured();

    res.json({
      ...config,
      apiKeyConfigured: isConfigured,
      // Include diagnostic info in development
      ...(process.env.NODE_ENV !== 'production' && {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasGroqKey: !!process.env.GROQ_API_KEY,
        provider: process.env.AI_PROVIDER || 'groq',
      }),
    });
  } catch (error) {
    console.error('Error getting AI config:', error);
    res.status(500).json({
      error: 'Failed to get AI configuration',
      details: error instanceof Error ? error.message : String(error),
    });
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
      console.error('Error generating text:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body,
      });

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes('api key') ||
          errorMessage.includes('not configured')
        ) {
          return res.status(500).json({
            error:
              'AI service not properly configured. Please check environment variables.',
          });
        }

        if (
          errorMessage.includes('rate limit') ||
          errorMessage.includes('429')
        ) {
          return res
            .status(429)
            .json({ error: 'Rate limit exceeded. Please try again later.' });
        }

        if (
          errorMessage.includes('invalid api key') ||
          errorMessage.includes('authentication')
        ) {
          return res.status(500).json({
            error: 'Invalid API key. Please check backend configuration.',
          });
        }

        // Return more detailed error in development
        if (process.env.NODE_ENV !== 'production') {
          return res.status(500).json({
            error: 'Failed to generate text',
            details: error.message,
          });
        }
      }

      // Return error message even in production for debugging
      // TODO: Remove error details in production after fixing the issue
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      res.status(500).json({
        error: 'Failed to generate text. Please try again later.',
        // Temporarily include error details for debugging
        details: errorMessage,
      });
    }
  }
);

export default router;
