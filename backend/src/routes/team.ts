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
 *     TeamMember:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - email
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         link:
 *           type: string
 *         priority:
 *           type: integer
 *           description: Sort order (lower numbers appear first)
 */

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
 * @swagger
 * /api/team:
 *   get:
 *     summary: Get all team members
 *     tags:
 *       - Team
 *     responses:
 *       '200':
 *         description: Team members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TeamMember'
 *       '500':
 *         description: Failed to fetch team members
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
 * @swagger
 * /api/team:
 *   post:
 *     summary: Create team member
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeamMember'
 *     responses:
 *       '200':
 *         description: Team member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamMember'
 *       '400':
 *         description: Missing required fields
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to create team member
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
 * @swagger
 * /api/team/{id}:
 *   put:
 *     summary: Update team member
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the team member to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial team member data to update
 *     responses:
 *       '200':
 *         description: Team member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamMember'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Team member not found
 *       '500':
 *         description: Failed to update team member
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
 * @swagger
 * /api/team/{id}:
 *   delete:
 *     summary: Delete team member
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the team member to delete
 *     responses:
 *       '200':
 *         description: Team member deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Team member not found
 *       '500':
 *         description: Failed to delete team member
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
