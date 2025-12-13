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
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - display_name
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier originating from Keycloak
 *         email:
 *           type: string
 *           format: email
 *         display_name:
 *           type: string
 *       example:
 *         id: 12345
 *         email: user@example.com
 *         display_name: Jane Doe
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Keycloak JWT token
 *
 * /api/users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve
 *     responses:
 *       '200':
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Failed to fetch user
 *
 * /api/users/sync:
 *   post:
 *     summary: Sync Keycloak user to Firebase
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - email
 *               - display_name
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique identifier originating from Keycloak
 *               email:
 *                 type: string
 *                 format: email
 *               display_name:
 *                 type: string
 *           example:
 *             id: 12345
 *             email: user@example.com
 *             display_name: Jane Doe
 *     responses:
 *       '200':
 *         description: User synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Missing required fields
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '500':
 *         description: Failed to sync user
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
