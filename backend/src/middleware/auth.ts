import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { isAdminEmail } from '../config/constants.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

/**
 * Validate Keycloak token and extract user info
 * In production, this should verify the token with Keycloak server
 */
export const validateKeycloakToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // First, check if user info is provided in headers (for development/testing)
    // This allows the frontend to send user info when token validation isn't fully implemented
    // Express normalizes headers to lowercase, so check both possible formats
    const userId =
      (req.headers['x-user-id'] as string) ||
      (req.headers['X-User-Id'] as string);
    const userEmail =
      (req.headers['x-user-email'] as string) ||
      (req.headers['X-User-Email'] as string);

    if (userId && userEmail) {
      req.userId = userId;
      req.userEmail = userEmail;
      req.isAdmin = isAdminEmail(userEmail);
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // TODO: In production, verify token with Keycloak
    // For now, extract user info from token (JWT decode)
    // In production, use: https://www.npmjs.com/package/keycloak-connect

    // In production, decode and verify JWT token from Keycloak
    // const decoded = jwt.verify(token, keycloakPublicKey);
    // req.userId = decoded.sub;
    // req.userEmail = decoded.email;

    // For now, return error if no headers and token validation not implemented
    return res.status(401).json({
      error:
        'Token validation not implemented. Use x-user-id and x-user-email headers in development.',
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({ error: 'Invalid token' });
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
