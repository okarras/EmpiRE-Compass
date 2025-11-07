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
 * GET /api/home-content
 * Get home content (public)
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
 * PUT /api/home-content
 * Update home content (admin only)
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
