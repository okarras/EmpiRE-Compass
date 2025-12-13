import { Router } from 'express';
import { db } from '../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { logRequest } from '../services/requestLogger.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     HomeContent:
 *       type: object
 *       description: Home page content sections
 *       properties:
 *         sections:
 *           type: array
 *           items:
 *             type: object
 *
 * /api/home-content:
 *   get:
 *     summary: Get home content
 *     tags:
 *       - Home Content
 *     responses:
 *       '200':
 *         description: Home content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomeContent'
 *       '404':
 *         description: Home content not found
 *       '500':
 *         description: Failed to fetch home content
 */
router.get('/', async (req, res) => {
  try {
    const docRef = db.collection('HomeContent').doc('sections');
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();

      await logRequest(
        'read',
        'HomeContent',
        'sections',
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        data
      );

      res.json(data);
    } else {
      // Return 404 - frontend will handle default content
      await logRequest(
        'read',
        'HomeContent',
        'sections',
        false,
        undefined,
        undefined,
        'Home content not found'
      );

      res.status(404).json({ error: 'Home content not found' });
    }
  } catch (error) {
    console.error('Error fetching home content:', error);

    await logRequest(
      'read',
      'HomeContent',
      'sections',
      false,
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(500).json({ error: 'Failed to fetch home content' });
  }
});

/**
 * @swagger
 * /api/home-content:
 *   put:
 *     summary: Update home content
 *     tags:
 *       - Home Content
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Home content data to update
 *     responses:
 *       '200':
 *         description: Home content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomeContent'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to update home content
 */
router.put(
  '/',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const docRef = db.collection('HomeContent').doc('sections');

      const updates = {
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      await docRef.set(updates, { merge: true });

      await logRequest(
        'update',
        'HomeContent',
        'sections',
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        updates
      );

      res.json(updates);
    } catch (error) {
      console.error('Error updating home content:', error);

      await logRequest(
        'update',
        'HomeContent',
        'sections',
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to update home content' });
    }
  }
);

export default router;
