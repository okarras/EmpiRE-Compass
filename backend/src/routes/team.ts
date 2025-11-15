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

export interface TeamMember {
  id?: string;
  name: string;
  role?: string;
  description: string;
  image: string;
  email: string;
  link?: string;
  priority?: number;
}

/**
 * GET /api/team
 * Get all team members (public)
 */
router.get('/', async (req, res) => {
  try {
    const teamSnapshot = await db.collection('Team').get();
    const teamMembers: TeamMember[] = [];

    teamSnapshot.forEach((doc) => {
      const data = doc.data();
      teamMembers.push({
        id: doc.id,
        name: data.name || '',
        role: data.role || '',
        description: data.description || '',
        image: data.image || '',
        email: data.email || '',
        link: data.link || '',
        priority: typeof data.priority === 'number' ? data.priority : 999,
      });
    });

    // Sort by priority
    teamMembers.sort((a, b) => {
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });

    await logRequest(
      'read',
      'Team',
      undefined,
      true,
      undefined,
      undefined,
      undefined,
      { resultCount: teamMembers.length },
      undefined,
      teamMembers
    );

    // Always return an array, even if empty
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);

    await logRequest(
      'read',
      'Team',
      undefined,
      false,
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

/**
 * POST /api/team
 * Create team member (admin only)
 */
router.post(
  '/',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['name', 'description', 'email']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const teamMember: TeamMember = {
        name: req.body.name,
        role: req.body.role,
        description: req.body.description,
        image: req.body.image || '',
        email: req.body.email,
        link: req.body.link,
        priority: req.body.priority ?? 999,
      };

      const docRef = await db.collection('Team').add(teamMember);

      await logRequest(
        'write',
        'Team',
        docRef.id,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'POST' },
        teamMember
      );

      res.json({ id: docRef.id, ...teamMember });
    } catch (error) {
      console.error('Error creating team member:', error);

      await logRequest(
        'write',
        'Team',
        undefined,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to create team member' });
    }
  }
);

/**
 * PUT /api/team/:id
 * Update team member (admin only)
 */
router.put(
  '/:id',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const teamRef = db.collection('Team').doc(id);

      const doc = await teamRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      const updates: Partial<TeamMember> = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.role !== undefined) updates.role = req.body.role;
      if (req.body.description !== undefined)
        updates.description = req.body.description;
      if (req.body.image !== undefined) updates.image = req.body.image;
      if (req.body.email !== undefined) updates.email = req.body.email;
      if (req.body.link !== undefined) updates.link = req.body.link;
      if (req.body.priority !== undefined) updates.priority = req.body.priority;

      await teamRef.update(updates);

      await logRequest(
        'update',
        'Team',
        id,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        updates
      );

      res.json({ id, ...updates });
    } catch (error) {
      console.error('Error updating team member:', error);

      await logRequest(
        'update',
        'Team',
        req.params.id,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to update team member' });
    }
  }
);

/**
 * DELETE /api/team/:id
 * Delete team member (admin only)
 */
router.delete(
  '/:id',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const teamRef = db.collection('Team').doc(id);

      const doc = await teamRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      await teamRef.delete();

      await logRequest('delete', 'Team', id, true, req.userId, req.userEmail);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting team member:', error);

      await logRequest(
        'delete',
        'Team',
        req.params.id,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to delete team member' });
    }
  }
);

export default router;
