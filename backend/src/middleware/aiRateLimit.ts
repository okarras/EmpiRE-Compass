import { Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import { AuthenticatedRequest } from './auth.js';
import { isAdminEmail } from '../config/constants.js';

interface UserRateLimit {
  userId: string;
  count: number;
  resetAt: Timestamp;
}

/**
 * Per-user rate limiter for AI requests
 * - Non-admin users: 5 requests per 24 hours
 * - Admin users: Unlimited requests
 */
export const createUserRateLimiter = () => {
  const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
  const MAX_REQUESTS = 5; // 5 requests per window for non-admin users

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Require authentication
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Skip rate limiting for admin users
      if (req.isAdmin) {
        return next();
      }

      // Double-check admin status if not set
      if (req.isAdmin === undefined || req.isAdmin === false) {
        // Check email-based admin first (faster)
        if (req.userEmail && isAdminEmail(req.userEmail)) {
          req.isAdmin = true;
          return next();
        }

        // Check Firebase for admin status
        try {
          const userDoc = await db.collection('Users').doc(req.userId).get();
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

      const userId = req.userId;
      const now = Timestamp.now();
      const resetAt = Timestamp.fromMillis(now.toMillis() + WINDOW_MS);

      // Get or create rate limit document
      const rateLimitRef = db.collection('AIRateLimits').doc(userId);
      const rateLimitDoc = await rateLimitRef.get();

      if (rateLimitDoc.exists) {
        const rateLimitData = rateLimitDoc.data() as UserRateLimit;
        const resetTime = rateLimitData.resetAt.toMillis();

        // Check if window has expired
        if (now.toMillis() >= resetTime) {
          // Reset the counter
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

        // Check if limit exceeded
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
