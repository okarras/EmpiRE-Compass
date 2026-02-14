import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
import { AIService, type AIConfig } from './aiService.js';
import { createRateLimiter, corsOptions, errorHandler } from './middleware.js';
import usersRouter from './routes/users.js';
import teamRouter from './routes/team.js';
import homeContentRouter from './routes/homeContent.js';
import templatesRouter from './routes/templates.js';
import requestLogsRouter from './routes/requestLogs.js';
import aiRouter, { initializeAIService } from './routes/ai.js';
import healthRouter, { setAIServiceForHealth } from './routes/health.js';
import dynamicQuestionsRouter from './routes/dynamicQuestions.js';
import newsRouter from './routes/news.js';
import papersRouter from './routes/papers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'EmpiRE Compass API',
      version: '1.0.0',
      description: 'API documentation for the EmpiRE Compass backend services',
    },
    servers: [
      {
        url: '/',
      },
    ],
  },
  // Look for route files relative to this file's location
  // In dev: src/routes/*.ts, In prod: dist/routes/*.js
  apis: [
    path.join(__dirname, 'routes', '*.ts'),
    path.join(__dirname, 'routes', '*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://validator.swagger.io'],
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          'https://cdnjs.cloudflare.com',
          'https://vercel.live',
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://cdnjs.cloudflare.com',
        ],
        'frame-src': ["'self'", 'https://vercel.live'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// rate limiter
app.use('/api/', createRateLimiter());

// Helper function to sanitize environment variables (remove quotes)
const sanitizeEnvVar = (
  value: string | undefined,
  defaultValue: string
): string => {
  if (!value) return defaultValue;
  // Remove surrounding quotes if present
  return value.trim().replace(/^["']|["']$/g, '');
};

// Initialize AI service
const aiConfig: AIConfig = {
  provider:
    (sanitizeEnvVar(process.env.AI_PROVIDER, 'openai') as
      | 'openai'
      | 'groq'
      | 'mistral') || 'openai',
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
      | 'llama-3-70b-8192') || 'llama-3.1-8b-instant',
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
  googleModel:
    (sanitizeEnvVar(process.env.GOOGLE_MODEL, 'gemini-1.5-flash') as
      | 'gemini-3-pro-preview'
      | 'gemini-2.5-pro'
      | 'gemini-2.5-flash'
      | 'gemini-2.0-flash'
      | 'gemini-2.0-flash-exp'
      | 'gemini-2.0-flash-lite'
      | 'gemini-1.5-pro'
      | 'gemini-1.5-flash'
      | 'gemini-1.5-flash-8b'
      | 'gemma-3-27b-it') || 'gemini-1.5-flash',
  googleApiKey: sanitizeEnvVar(process.env.GOOGLE_API_KEY, ''),
};

const aiService = new AIService(aiConfig);
initializeAIService(aiConfig);
setAIServiceForHealth(aiService);

// API routes
app.use('/api/users', usersRouter);
app.use('/api/team', teamRouter);
app.use('/api/home-content', homeContentRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/request-logs', requestLogsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/health', healthRouter);
app.use('/api/dynamic-questions', dynamicQuestionsRouter);
app.use('/api/news', newsRouter);
app.use('/api/papers', papersRouter);

const swaggerUiOptions = {
  customCssUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.min.js',
  ],
};

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

// error handling middleware
app.use(errorHandler);

// Export the Express app for Vercel (default export)
export default app;

// For local development, listen on a port
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`AI Service configured: ${aiService.isConfigured()}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
