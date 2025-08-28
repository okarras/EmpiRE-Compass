import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { AIService, type AIConfig } from './aiService.js';
import {
  createRateLimiter,
  validateApiKey,
  validateGenerateTextRequest,
  corsOptions,
  errorHandler,
} from './middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// security middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// rate limiter
app.use('/api/', createRateLimiter());

// init ai service
const aiConfig: AIConfig = {
  provider: (process.env.AI_PROVIDER as 'openai' | 'groq') || 'groq',
  openaiModel:
    (process.env.OPENAI_MODEL as 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo') ||
    'gpt-4o-mini',
  groqModel:
    (process.env.GROQ_MODEL as
      | 'deepseek-r1-distill-llama-70b'
      | 'llama-3-70b-8192'
      | 'mixtral-8x7b-32768') || 'deepseek-r1-distill-llama-70b',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
};

const aiService = new AIService(aiConfig);

// health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: aiService.isConfigured(),
  });
});

// ai config endpoint
app.get('/api/ai/config', validateApiKey, (req, res) => {
  try {
    const config = aiService.getCurrentConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting AI config:', error);
    res.status(500).json({ error: 'Failed to get AI configuration' });
  }
});

// generate text endpoint
app.post(
  '/api/ai/generate',
  validateApiKey,
  validateGenerateTextRequest,
  async (req, res) => {
    try {
      const { prompt, provider, model, temperature, maxTokens, systemContext } =
        req.body;

      const result = await aiService.generateText({
        prompt,
        provider,
        model,
        temperature,
        maxTokens,
        systemContext,
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

// legacy endpoint/backward compatibility
app.post(
  '/prompt',
  validateApiKey,
  validateGenerateTextRequest,
  async (req, res) => {
    try {
      const { prompt } = req.body;

      const result = await aiService.generateText({
        prompt,
        provider: 'groq', // defaults to Groq
      });

      res.json({ text: result.text });
    } catch (error) {
      console.error('Error in legacy prompt endpoint:', error);
      res.status(500).json({ error: 'Failed to generate text' });
    }
  }
);

// error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI Service configured: ${aiService.isConfigured()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
