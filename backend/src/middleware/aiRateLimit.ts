import { Response, NextFunction } from 'express';
import { db, Timestamp } from '../config/firebase.js';
import { AuthenticatedRequest } from './auth.js';
import { isAdminEmail } from '../config/constants.js';

interface UserRateLimit {
  userId: string;
  count: number;
  resetAt: Timestamp;
}

/** Shared LLM quota: 25 requests per 24 hours for non-admin callers. */
export const AI_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const AI_RATE_LIMIT_MAX_REQUESTS = 25;

/** Authenticated callers are keyed by user id; everyone else by client IP. */
export const getAiRateLimitSubject = (req: AuthenticatedRequest): string => {
  if (req.userId) return req.userId;
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `anon_${ip}`;
};

/**
 * Per-user rate limiter for AI requests
 * - Admin users: Unlimited requests
 * - Signed-in and anonymous users: 25 requests per 24 hours
 */
export const createUserRateLimiter = () => {
  const WINDOW_MS = AI_RATE_LIMIT_WINDOW_MS;
  const MAX_REQUESTS = AI_RATE_LIMIT_MAX_REQUESTS;
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = getAiRateLimitSubject(req);
      const isAnonymous = !req.userId;
      // Skip rate limiting for admin users
      if (req.isAdmin) {
        return next();
      }

      // Double-check admin status if not set (only for authenticated users)
      if (
        !isAnonymous &&
        (req.isAdmin === undefined || req.isAdmin === false)
      ) {
        // Check email-based admin first (faster)
        if (req.userEmail && isAdminEmail(req.userEmail)) {
          req.isAdmin = true;
          return next();
        }

        // Check Firebase for admin status
        try {
          const userDoc = await db.collection('Users').doc(req.userId!).get();
          const userData = userDoc.data();
          const isAdmin =
            userData?.is_admin === true ||
            (req.userEmail && isAdminEmail(req.userEmail));

          if (isAdmin) {
            req.isAdmin = true;
            return next();
          }
        } catch (error) {
          console.error('Error checking admin status in rate limiter:', error);
          // Continue with rate limiting if admin check fails
        }
      }

      const now = Timestamp.now();
      const resetAt = Timestamp.fromMillis(now.toMillis() + WINDOW_MS);

      // Get or create rate limit document
      const rateLimitRef = db.collection('AIRateLimits').doc(userId);
      const rateLimitDoc = await rateLimitRef.get();

      if (rateLimitDoc.exists) {
        const rateLimitData = rateLimitDoc.data() as UserRateLimit;
        const resetTime = rateLimitData.resetAt.toMillis();

        if (now.toMillis() >= resetTime) {
          await rateLimitRef.set({
            userId,
            count: 1,
            resetAt,
            lastRequestAt: now,
          } as UserRateLimit & { lastRequestAt: Timestamp });

          // Add headers
          res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
          res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - 1);
          res.setHeader(
            'X-RateLimit-Reset',
            Math.ceil(resetAt.toMillis() / 1000)
          );

          return next();
        }

        if (rateLimitData.count >= MAX_REQUESTS) {
          const remainingSeconds = Math.ceil(
            (resetTime - now.toMillis()) / 1000
          );

          res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

          return res.status(429).json({
            error: 'AI request limit exceeded',
            message: `You have reached your limit of ${MAX_REQUESTS} AI requests per 24 hours. Please try again later.`,
            resetIn: remainingSeconds,
            resetAt: new Date(resetTime).toISOString(),
          });
        }

        // Increment counter
        await rateLimitRef.update({
          count: rateLimitData.count + 1,
          lastRequestAt: now,
        });

        const remaining = MAX_REQUESTS - rateLimitData.count - 1;

        res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
      } else {
        // First request for this user
        await rateLimitRef.set({
          userId,
          count: 1,
          resetAt,
          lastRequestAt: now,
        } as UserRateLimit & { lastRequestAt: Timestamp });

        res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
        res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - 1);
        res.setHeader(
          'X-RateLimit-Reset',
          Math.ceil(resetAt.toMillis() / 1000)
        );
      }

      next();
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request but log it
      // In production, you might want to be more strict
      next();
    }
  };
};
