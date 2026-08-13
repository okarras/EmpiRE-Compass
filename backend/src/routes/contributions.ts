import { Router } from 'express';
import { db } from '../config/firebase.js';
import { isAdminEmail } from '../config/constants.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { validateRequiredFields } from '../middleware/validation.js';
import { logRequest } from '../services/requestLogger.js';

const router = Router();

const COLLECTION = 'Contributions';

/**
 * @swagger
 * components:
 *   schemas:
 *     ContributionPaper:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *         doi:
 *           type: string
 *         authors:
 *           type: string
 *         year:
 *           type: number
 *         venue:
 *           type: string
 *     Contribution:
 *       type: object
 *       required:
 *         - paper
 *         - answers
 *       properties:
 *         id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         templateId:
 *           type: string
 *         templateVersion:
 *           type: string
 *         paper:
 *           $ref: '#/components/schemas/ContributionPaper'
 *         answers:
 *           type: object
 *           description: Raw ScidQuest questionnaire answers keyed by question id
 *         submittedByUserId:
 *           type: string
 *         submittedByEmail:
 *           type: string
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         reviewedByUserId:
 *           type: string
 *         reviewedByEmail:
 *           type: string
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *         reviewNote:
 *           type: string
 */

export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export interface ContributionPaper {
  title: string;
  doi?: string;
  authors?: string;
  year?: number;
  venue?: string;
}

export interface Contribution {
  id?: string;
  status: ContributionStatus;
  templateId?: string;
  templateVersion?: string;
  paper: ContributionPaper;
  answers: Record<string, unknown>;
  submittedByUserId?: string;
  submittedByEmail?: string;
  submittedAt?: string;
  reviewedByUserId?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

const VALID_REVIEW_STATUSES: ContributionStatus[] = ['approved', 'rejected'];

/**
 * `validateKeycloakToken` only derives admin status from the email allowlist, so
 * routes that serve both admins and owners repeat `requireAdmin`'s Firebase
 * fallback rather than silently treating a Firebase-only admin as a plain user.
 */
const resolveIsAdmin = async (req: AuthenticatedRequest): Promise<boolean> => {
  if (req.isAdmin) return true;
  if (!req.userId) return false;

  try {
    const userDoc = await db.collection('Users').doc(req.userId).get();
    return (
      userDoc.data()?.is_admin === true ||
      (!!req.userEmail && isAdminEmail(req.userEmail))
    );
  } catch (error) {
    console.error('Error resolving admin status:', error);
    return false;
  }
};

/** Strips fields only the server may set, so a submitter cannot self-approve. */
const sanitizeSubmission = (
  body: Partial<Contribution>
): Pick<Contribution, 'paper' | 'answers' | 'templateId' | 'templateVersion'> => {
  const paper = (body.paper || {}) as ContributionPaper;

  return {
    templateId: body.templateId,
    templateVersion: body.templateVersion,
    paper: {
      title: String(paper.title || '').trim(),
      ...(paper.doi ? { doi: String(paper.doi).trim() } : {}),
      ...(paper.authors ? { authors: String(paper.authors).trim() } : {}),
      ...(paper.year !== undefined ? { year: Number(paper.year) } : {}),
      ...(paper.venue ? { venue: String(paper.venue).trim() } : {}),
    },
    answers: body.answers || {},
  };
};

/**
 * @swagger
 * /api/contributions:
 *   get:
 *     summary: List contributions (admins see all, submitters see their own)
 *     tags:
 *       - Contributions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       '200':
 *         description: Contributions retrieved successfully
 *       '401':
 *         description: Authentication required
 */
router.get('/', validateKeycloakToken, async (req: AuthenticatedRequest, res) => {
  try {
    const statusFilter = req.query.status as ContributionStatus | undefined;
    const isAdmin = await resolveIsAdmin(req);

    let query: FirebaseFirestore.Query = db.collection(COLLECTION);
    if (!isAdmin) {
      query = query.where('submittedByUserId', '==', req.userId);
    }
    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }

    const snapshot = await query.get();
    const contributions: Contribution[] = [];
    snapshot.forEach((doc) => {
      contributions.push({ id: doc.id, ...doc.data() } as Contribution);
    });

    // Newest first. Sorted in memory so the status/owner filters above do not
    // require a composite Firestore index.
    contributions.sort((a, b) =>
      String(b.submittedAt ?? '').localeCompare(String(a.submittedAt ?? ''))
    );

    await logRequest(
      'read',
      COLLECTION,
      'all',
      true,
      req.userId,
      req.userEmail,
      undefined,
      { scope: isAdmin ? 'all' : 'own', status: statusFilter ?? 'any' }
    );

    res.json(contributions);
  } catch (error) {
    console.error('Error fetching contributions:', error);

    await logRequest(
      'read',
      COLLECTION,
      'all',
      false,
      req.userId,
      req.userEmail,
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

/**
 * @swagger
 * /api/contributions/{contributionId}:
 *   get:
 *     summary: Get a single contribution (admin or its submitter)
 *     tags:
 *       - Contributions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Contribution retrieved successfully
 *       '403':
 *         description: Not allowed to view this contribution
 *       '404':
 *         description: Contribution not found
 */
router.get(
  '/:contributionId',
  validateKeycloakToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { contributionId } = req.params;
      const doc = await db.collection(COLLECTION).doc(contributionId).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Contribution not found' });
      }

      const contribution = { id: doc.id, ...doc.data() } as Contribution;
      const isAdmin = await resolveIsAdmin(req);

      if (!isAdmin && contribution.submittedByUserId !== req.userId) {
        return res
          .status(403)
          .json({ error: 'Not allowed to view this contribution' });
      }

      await logRequest(
        'read',
        COLLECTION,
        contributionId,
        true,
        req.userId,
        req.userEmail
      );

      res.json(contribution);
    } catch (error) {
      console.error('Error fetching contribution:', error);

      await logRequest(
        'read',
        COLLECTION,
        req.params.contributionId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to fetch contribution' });
    }
  }
);

/**
 * @swagger
 * /api/contributions:
 *   post:
 *     summary: Submit a contribution for admin review
 *     tags:
 *       - Contributions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contribution'
 *     responses:
 *       '200':
 *         description: Contribution submitted successfully
 *       '400':
 *         description: Invalid submission
 *       '401':
 *         description: Authentication required
 */
router.post(
  '/',
  validateKeycloakToken,
  validateRequiredFields(['paper', 'answers']),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const submission = sanitizeSubmission(req.body);

      if (!submission.paper.title) {
        return res.status(400).json({ error: 'paper.title is required' });
      }
      if (
        typeof submission.answers !== 'object' ||
        Array.isArray(submission.answers) ||
        Object.keys(submission.answers).length === 0
      ) {
        return res
          .status(400)
          .json({ error: 'answers must be a non-empty object' });
      }

      const now = new Date().toISOString();
      const contributionId = `contribution_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;

      // status and submitter identity come from the token, never the body.
      const docData: Omit<Contribution, 'id'> = {
        ...submission,
        status: 'pending',
        submittedByUserId: req.userId,
        submittedByEmail: req.userEmail,
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection(COLLECTION).doc(contributionId).set(docData);

      await logRequest(
        'write',
        COLLECTION,
        contributionId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'POST' },
        docData
      );

      res.json({ id: contributionId, ...docData });
    } catch (error) {
      console.error('Error creating contribution:', error);

      await logRequest(
        'write',
        COLLECTION,
        'unknown',
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to submit contribution' });
    }
  }
);

/**
 * @swagger
 * /api/contributions/{contributionId}/review:
 *   patch:
 *     summary: Approve or reject a contribution
 *     tags:
 *       - Contributions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               reviewNote:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Contribution reviewed successfully
 *       '400':
 *         description: Invalid review status
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Contribution not found
 */
router.patch(
  '/:contributionId/review',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { contributionId } = req.params;
      const { status, reviewNote } = req.body as {
        status?: ContributionStatus;
        reviewNote?: string;
      };

      if (!status || !VALID_REVIEW_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `status must be one of: ${VALID_REVIEW_STATUSES.join(', ')}`,
        });
      }

      const contributionRef = db.collection(COLLECTION).doc(contributionId);
      const doc = await contributionRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Contribution not found' });
      }

      const now = new Date().toISOString();
      const updateData = {
        status,
        reviewNote: reviewNote ?? '',
        reviewedByUserId: req.userId,
        reviewedByEmail: req.userEmail,
        reviewedAt: now,
        updatedAt: now,
      };

      await contributionRef.set(updateData, { merge: true });

      await logRequest(
        'update',
        COLLECTION,
        contributionId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PATCH', status },
        updateData
      );

      const updated = await contributionRef.get();
      res.json({ id: contributionId, ...updated.data() } as Contribution);
    } catch (error) {
      console.error('Error reviewing contribution:', error);

      await logRequest(
        'update',
        COLLECTION,
        req.params.contributionId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to review contribution' });
    }
  }
);

/**
 * @swagger
 * /api/contributions/{contributionId}:
 *   delete:
 *     summary: Delete a contribution
 *     tags:
 *       - Contributions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Contribution deleted successfully
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Contribution not found
 */
router.delete(
  '/:contributionId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { contributionId } = req.params;
      const contributionRef = db.collection(COLLECTION).doc(contributionId);

      const doc = await contributionRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Contribution not found' });
      }

      await contributionRef.delete();

      await logRequest(
        'delete',
        COLLECTION,
        contributionId,
        true,
        req.userId,
        req.userEmail
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting contribution:', error);

      await logRequest(
        'delete',
        COLLECTION,
        req.params.contributionId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to delete contribution' });
    }
  }
);

export default router;
