import { Router } from 'express';
import { db } from '../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { validateRequiredFields } from '../middleware/validation.js';
import { logRequest } from '../services/requestLogger.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Paper:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         authors:
 *           type: string
 *         year:
 *           type: number
 *         venue:
 *           type: string
 *         link:
 *           type: string
 *           format: uri
 *         description:
 *           type: string
 *         priority:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface Paper {
  id?: string;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  link?: string;
  description?: string;
  priority?: number;
  showOnTeam?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * @swagger
 * /api/papers:
 *   get:
 *     summary: Get all papers
 *     tags:
 *       - Papers
 *     parameters:
 *       - in: query
 *         name: showOnTeamOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, only return papers to show on Team page
 *     responses:
 *       '200':
 *         description: Papers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Paper'
 *       '500':
 *         description: Failed to fetch papers
 */
router.get('/', async (req, res) => {
  try {
    const showOnTeamOnly = req.query.showOnTeamOnly === 'true';
    const papersRef = db.collection('Papers');
    const papersSnapshot = await papersRef.get();
    const papers: Paper[] = [];

    papersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!showOnTeamOnly || data.showOnTeam === true) {
        papers.push({
          id: doc.id,
          ...data,
        } as Paper);
      }
    });

    // Sort by priority (lower = first), then by year desc
    papers.sort((a, b) => {
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (b.year ?? 0) - (a.year ?? 0);
    });

    await logRequest(
      'read',
      'Papers',
      'all',
      true,
      undefined,
      undefined,
      undefined,
      { queryType: showOnTeamOnly ? 'showOnTeamOnly' : 'all' }
    );

    res.json(papers);
  } catch (error) {
    console.error('Error fetching papers:', error);

    await logRequest(
      'read',
      'Papers',
      'all',
      false,
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

router.get('/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;
    const paperRef = db.collection('Papers').doc(paperId);
    const paperDoc = await paperRef.get();

    if (!paperDoc.exists) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    await logRequest('read', 'Papers', paperId, true);

    res.json({ id: paperDoc.id, ...paperDoc.data() } as Paper);
  } catch (error) {
    console.error('Error fetching paper:', error);

    await logRequest(
      'read',
      'Papers',
      req.params.paperId,
      false,
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

router.post(
  '/',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['title']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const paperData: Paper = req.body;
      const now = new Date().toISOString();

      const paperItemData = {
        ...paperData,
        createdAt: paperData.createdAt || now,
        updatedAt: now,
        showOnTeam: paperData.showOnTeam ?? true,
      };

      const paperId =
        paperData.id ||
        `paper_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const paperRef = db.collection('Papers').doc(paperId);

      const { id: _id, ...docData } = paperItemData;
      await paperRef.set(docData);

      await logRequest(
        'write',
        'Papers',
        paperId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'POST' },
        docData
      );

      res.json({ id: paperId, ...docData });
    } catch (error) {
      console.error('Error creating paper:', error);

      await logRequest(
        'write',
        'Papers',
        req.body.id || 'unknown',
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to create paper' });
    }
  }
);

router.put(
  '/:paperId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { paperId } = req.params;
      const updates: Partial<Paper> = req.body;
      const paperRef = db.collection('Papers').doc(paperId);

      const paperDoc = await paperRef.get();
      if (!paperDoc.exists) {
        return res.status(404).json({ error: 'Paper not found' });
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const { id: _id, ...docData } = updateData;
      await paperRef.set(docData, { merge: true });

      await logRequest(
        'update',
        'Papers',
        paperId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        docData
      );

      const updatedDoc = await paperRef.get();
      res.json({ id: paperId, ...updatedDoc.data() } as Paper);
    } catch (error) {
      console.error('Error updating paper:', error);

      await logRequest(
        'update',
        'Papers',
        req.params.paperId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to update paper' });
    }
  }
);

router.delete(
  '/:paperId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { paperId } = req.params;
      const paperRef = db.collection('Papers').doc(paperId);

      const paperDoc = await paperRef.get();
      if (!paperDoc.exists) {
        return res.status(404).json({ error: 'Paper not found' });
      }

      await paperRef.delete();

      await logRequest(
        'delete',
        'Papers',
        paperId,
        true,
        req.userId,
        req.userEmail
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting paper:', error);

      await logRequest(
        'delete',
        'Papers',
        req.params.paperId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to delete paper' });
    }
  }
);

export default router;
