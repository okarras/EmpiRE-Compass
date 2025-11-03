import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// rate limit
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  max: number = 100
) => {
  return rateLimit({
    windowMs,
    max, // 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];

  // todo: implement proper api key validation
  if (!apiKey && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'API key required' });
  }

  next();
};

// request validation
export const validateGenerateTextRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { prompt, provider, model, temperature, maxTokens } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res
      .status(400)
      .json({ error: 'Prompt is required and must be a string' });
  }

  if (prompt.length > 100000) {
    return res
      .status(400)
      .json({ error: 'Prompt too long (max 100000 characters)' });
  }

  if (provider && !['openai', 'groq'].includes(provider)) {
    return res
      .status(400)
      .json({ error: 'Invalid provider. Must be "openai" or "groq"' });
  }

  if (
    temperature !== undefined &&
    (typeof temperature !== 'number' || temperature < 0 || temperature > 2)
  ) {
    return res
      .status(400)
      .json({ error: 'Temperature must be a number between 0 and 2' });
  }

  if (
    maxTokens !== undefined &&
    (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 8000)
  ) {
    return res
      .status(400)
      .json({ error: 'Max tokens must be a number between 1 and 8000' });
  }

  next();
};

// cors config
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Always allow localhost for development
  origins.push('http://localhost:5173');
  origins.push('http://localhost:3000');

  // Add production frontend URL from environment variable
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  // Add Vercel frontend URL (hardcoded for your production deployment)
  origins.push('https://empire-compass.vercel.app');

  return origins;
};

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, be more permissive
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`CORS: Allowing origin ${origin} in development mode`);
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err.message.includes('API key is not configured')) {
    return res
      .status(500)
      .json({ error: 'AI service not properly configured' });
  }

  if (err.message.includes('rate limit')) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  res.status(500).json({ error: 'Internal server error' });
};
