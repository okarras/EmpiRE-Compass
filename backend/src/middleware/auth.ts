import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { isAdminEmail } from '../config/constants.js';
import { verifyKeycloakToken } from '../config/keycloak.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

/**
 * Validate Keycloak token and extract user info
 * Always verifies tokens when provided (both production and development)
 * In development, allows header-based auth as fallback when no token is provided
 */
export const validateKeycloakToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const hasToken = authHeader && authHeader.startsWith('Bearer ');

    // If token is provided, always verify it (even in development)
    if (hasToken) {
      const token = authHeader!.substring(7);

      try {
        // Verify the token with Keycloak
        const verified = await verifyKeycloakToken(token);

        // Set user info from verified token
        req.userId = verified.userId;
        req.userEmail = verified.userEmail;
        req.isAdmin = isAdminEmail(verified.userEmail);

        return next();
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        return res.status(401).json({
          error: 'Invalid or expired token',
          ...(isDevelopment && {
            details:
              verifyError instanceof Error
                ? verifyError.message
                : String(verifyError),
          }),
        });
      }
    }

    // No token provided - check if we can use header-based auth (development only)
    if (isDevelopment) {
      const userId =
        (req.headers['x-user-id'] as string) ||
        (req.headers['X-User-Id'] as string);
      const userEmail =
        (req.headers['x-user-email'] as string) ||
        (req.headers['X-User-Email'] as string);

      if (userId && userEmail) {
        console.warn(
          '⚠️  Using header-based authentication (development mode fallback - no token provided)'
        );
        req.userId = userId;
        req.userEmail = userEmail;
        req.isAdmin = isAdminEmail(userEmail);
        return next();
      }
    }

    // No token and no headers (or in production) - require authentication
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
      ...(isDevelopment && {
        details:
          'Provide either a Bearer token in Authorization header or x-user-id/x-user-email headers (dev only)',
      }),
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    if (!req.isAdmin) {
      // Double-check against Firebase
      const userDoc = await db.collection('Users').doc(req.userId).get();
      const userData = userDoc.data();

      const isAdmin =
        userData?.is_admin === true ||
        (req.userEmail && isAdminEmail(req.userEmail));

      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.isAdmin = true;
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
};
