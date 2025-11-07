import { Router } from 'express';
import {
  syncUserToFirebase,
  getFirebaseUser,
} from '../services/userService.js';
import { validateKeycloakToken } from '../middleware/auth.js';
import { validateRequiredFields } from '../middleware/validation.js';
import { logRequest } from '../services/requestLogger.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/users/sync
 * Sync Keycloak user to Firebase
 */
router.post(
  '/sync',
  validateKeycloakToken,
  validateRequiredFields(['id', 'email', 'display_name']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id, email, display_name } = req.body;

      const user = await syncUserToFirebase({
        id,
        email,
        display_name,
      });

      await logRequest('write', 'Users', id, true, req.userId, req.userEmail);

      res.json(user);
    } catch (error) {
      console.error('Error syncing user:', error);

      await logRequest(
        'write',
        'Users',
        req.body.id,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({
        error: 'Failed to sync user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/users/:userId
 * Get user by ID
 */
router.get(
  '/:userId',
  validateKeycloakToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const user = await getFirebaseUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await logRequest(
        'read',
        'Users',
        userId,
        true,
        req.userId,
        req.userEmail
      );

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);

      await logRequest(
        'read',
        'Users',
        req.params.userId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

export default router;
