import { Router, Response } from 'express';
import { AIService, type AIConfig } from '../aiService.js';
import { validateGenerateTextRequest } from '../middleware.js';
import {
  validateKeycloakToken,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import { createUserRateLimiter } from '../middleware/aiRateLimit.js';
import { db } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import { isAdminEmail } from '../config/constants.js';

interface UserRateLimit {
  userId: string;
  count: number;
  resetAt: Timestamp;
}

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
        (sanitizeEnvVar(process.env.AI_PROVIDER, 'mistral') as
          | 'openai'
          | 'groq'
          | 'mistral') || 'mistral',
      openaiModel:
        (sanitizeEnvVar(process.env.OPENAI_MODEL, 'gpt-4o-mini') as
          | 'gpt-5.1'
          | 'gpt-5-mini'
          | 'gpt-5-nano'
          | 'gpt-5-pro'
          | 'gpt-5'
          | 'gpt-4.1'
          | 'gpt-4o-mini'
          | 'gpt-4o'
          | 'gpt-4-turbo'
          | 'gpt-4o-2024-08-06'
          | 'gpt-4-turbo-2024-04-09'
          | 'o1-preview'
          | 'o1-mini'
          | 'gpt-4'
          | 'gpt-3.5-turbo') || 'gpt-4o-mini',
      groqModel:
        (sanitizeEnvVar(process.env.GROQ_MODEL, 'llama-3.1-8b-instant') as
          | 'llama-3.1-8b-instant'
          | 'llama-3.1-70b-versatile'
          | 'llama-3.1-405b-reasoning'
          | 'llama-3.3-70b-versatile'
          | 'openai/gpt-oss-120b'
          | 'openai/gpt-oss-20b'
          | 'whisper-large-v3'
          | 'deepseek-r1-distill-llama-70b'
          | 'llama-3-70b-8192'
          | 'mixtral-8x7b-32768') || 'llama-3.1-8b-instant',
      mistralModel:
        (sanitizeEnvVar(process.env.MISTRAL_MODEL, 'mistral-large-latest') as
          | 'mistral-large-latest'
          | 'mistral-medium-latest'
          | 'mistral-small-latest'
          | 'pixtral-large-latest'
          | 'open-mistral-nemo') || 'mistral-large-latest',
      openaiApiKey: sanitizeEnvVar(process.env.OPENAI_API_KEY, ''),
      groqApiKey: sanitizeEnvVar(process.env.GROQ_API_KEY, ''),
      mistralApiKey: sanitizeEnvVar(process.env.MISTRAL_API_KEY, ''),
    };
    aiService = new AIService(fallbackConfig);
  }
  return aiService;
};

/**
 * GET /api/ai/config
 * Get current AI configuration (requires authentication)
 */
router.get(
  '/config',
  validateKeycloakToken,
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * GET /api/ai/rate-limit
 * Get current user's rate limit status
 */
router.get(
  '/rate-limit',
  validateKeycloakToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check admin status
      let isAdmin = req.isAdmin;
      if (!isAdmin) {
        // Check email-based admin first
        if (req.userEmail && isAdminEmail(req.userEmail)) {
          isAdmin = true;
        } else {
          // Check Firebase
          try {
            const userDoc = await db.collection('Users').doc(req.userId).get();
            const userData = userDoc.data();
            isAdmin =
              userData?.is_admin === true ||
              (req.userEmail && isAdminEmail(req.userEmail)) ||
              false;
          } catch (error) {
            console.error('Error checking admin status:', error);
          }
        }
      }

      // Admin users have unlimited requests
      if (isAdmin) {
        return res.json({
          limit: -1, // -1 means unlimited
          remaining: -1,
          isAdmin: true,
        });
      }

      const userId = req.userId;
      const rateLimitRef = db.collection('AIRateLimits').doc(userId);
      const rateLimitDoc = await rateLimitRef.get();

      const MAX_REQUESTS = 5;
      const now = Timestamp.now();

      if (!rateLimitDoc.exists) {
        return res.json({
          limit: MAX_REQUESTS,
          remaining: MAX_REQUESTS,
          resetAt: null,
        });
      }

      const rateLimitData = rateLimitDoc.data() as UserRateLimit;
      const resetTime = rateLimitData.resetAt.toMillis();

      // Check if window has expired
      if (now.toMillis() >= resetTime) {
        return res.json({
          limit: MAX_REQUESTS,
          remaining: MAX_REQUESTS,
          resetAt: null,
        });
      }

      const remaining = Math.max(0, MAX_REQUESTS - rateLimitData.count);
      const resetIn = Math.ceil((resetTime - now.toMillis()) / 1000);

      return res.json({
        limit: MAX_REQUESTS,
        remaining,
        count: rateLimitData.count,
        resetAt: new Date(resetTime).toISOString(),
        resetIn,
      });
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      res.status(500).json({
        error: 'Failed to get rate limit status',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * POST /api/ai/generate
 * Generate text using AI (requires authentication, rate limited per user)
 */
router.post(
  '/generate',
  validateKeycloakToken,
  createUserRateLimiter(),
  validateGenerateTextRequest,
  async (req: AuthenticatedRequest, res: Response) => {
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

      // Calculate cost if usage information is available
      let costInfo = undefined;
      if (result.usage) {
        const service = getAIService();
        const config = service.getCurrentConfig();
        const actualProvider = provider || config.provider;
        const actualModel = model || config.model;

        // Import cost calculator
        const { calculateCost } = await import('../utils/costCalculator');
        costInfo = calculateCost(
          actualProvider,
          actualModel,
          result.usage.promptTokens,
          result.usage.completionTokens
        );
      }

      res.json({
        ...result,
        cost: costInfo,
      });
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
