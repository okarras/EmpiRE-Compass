import { Router } from 'express';
import { randomBytes, createHash } from 'crypto';
import { db } from '../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { logRequest } from '../services/requestLogger.js';
import {
  fetchPaperStatements,
  mapPaperStatementsToAnswers,
} from '../services/orkgPaperMapper.js';
import {
  COLLECTION as CONTRIBUTIONS_COLLECTION,
  type Contribution,
} from './contributions.js';

const router = Router();

const COLLECTION = 'PaperVerifications';

// ORKG resource ids look like "R" followed by digits.
const PAPER_ID_RE = /^R[0-9]+$/i;

// The questionnaire template the prefilled answers are shaped for (see
// src/templates/empire_questionnaire.json).
const QUESTIONNAIRE_TEMPLATE_ID = 'R186708';
const QUESTIONNAIRE_TEMPLATE_VERSION = '1.1';

const DEFAULT_EXPIRES_IN_DAYS = 30;

export type VerificationStatus = 'invited' | 'completed' | 'expired';

export interface PaperVerification {
  id?: string;
  tokenHash: string;
  paper: Contribution['paper'];
  prefilledAnswers: Record<string, unknown>;
  unmappedNotes: string[];
  templateId: string;
  templateVersion: string;
  status: VerificationStatus;
  createdByUserId?: string;
  createdByEmail?: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  contributionId?: string;
}

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const frontendLink = (token: string): string => {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
  return `${base}/R186491/verify/${token}`;
};

/** Never returned to the public endpoints — only the admin who created the invite sees identity/audit fields. */
const toPublicVerification = (verification: PaperVerification) => ({
  paper: verification.paper,
  answers: verification.prefilledAnswers,
  unmappedNotes: verification.unmappedNotes,
  templateId: verification.templateId,
  templateVersion: verification.templateVersion,
});

const findByToken = async (token: string) => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('tokenHash', '==', hashToken(token))
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0];
};

/**
 * @swagger
 * /api/verifications:
 *   post:
 *     summary: Create an author-verification invite for a paper already curated in ORKG
 *     tags:
 *       - Verifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paperId
 *             properties:
 *               paperId:
 *                 type: string
 *                 description: ORKG resource id of the paper, e.g. R742443
 *               expiresInDays:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Invite created
 *       '404':
 *         description: No Empirical Research Practice data found for this paper in ORKG
 */
router.post(
  '/',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const paperId = String(req.body?.paperId || '').trim();
      if (!paperId) {
        return res.status(400).json({ error: 'paperId is required' });
      }
      if (!PAPER_ID_RE.test(paperId)) {
        return res.status(400).json({
          error: 'paperId must be an ORKG resource id, e.g. R742443',
        });
      }

      const expiresInDays =
        Number(req.body?.expiresInDays) > 0
          ? Number(req.body.expiresInDays)
          : DEFAULT_EXPIRES_IN_DAYS;

      // Fetched live from ORKG's REST statements API (not the SPARQL
      // triplestore mirror, which lags behind and can omit resources that
      // are otherwise fully curated).
      const statements = await fetchPaperStatements(paperId);
      const mapped = mapPaperStatementsToAnswers(statements, paperId);

      if (!mapped) {
        return res.status(404).json({
          error:
            'This paper has no Empirical Research Practice data recorded in ORKG yet, or the paper id is wrong.',
        });
      }

      const { paper, answers, unmappedNotes } = mapped;

      const token = randomBytes(24).toString('base64url');
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + expiresInDays * 24 * 60 * 60 * 1000
      );

      const docData: Omit<PaperVerification, 'id'> = {
        tokenHash: hashToken(token),
        paper,
        prefilledAnswers: answers,
        unmappedNotes,
        templateId: QUESTIONNAIRE_TEMPLATE_ID,
        templateVersion: QUESTIONNAIRE_TEMPLATE_VERSION,
        status: 'invited',
        createdByUserId: req.userId,
        createdByEmail: req.userEmail,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      const docRef = await db.collection(COLLECTION).add(docData);

      await logRequest(
        'write',
        COLLECTION,
        docRef.id,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { paperId }
      );

      res.json({
        id: docRef.id,
        token,
        link: frontendLink(token),
        paper,
        unmappedNotes,
        expiresAt: docData.expiresAt,
      });
    } catch (error) {
      console.error('Error creating verification invite:', error);

      await logRequest(
        'write',
        COLLECTION,
        'unknown',
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to create verification invite' });
    }
  }
);

/**
 * @swagger
 * /api/verifications/{token}:
 *   get:
 *     summary: Fetch the prefilled questionnaire for an author-verification link
 *     tags:
 *       - Verifications
 *     responses:
 *       '200':
 *         description: Verification data
 *       '404':
 *         description: Link not found
 *       '410':
 *         description: Link expired or already used
 */
router.get('/:token', async (req, res) => {
  try {
    const doc = await findByToken(req.params.token);
    if (!doc) {
      return res.status(404).json({ error: 'This verification link was not found.' });
    }

    const verification = doc.data() as PaperVerification;
    const isExpired = new Date(verification.expiresAt).getTime() < Date.now();

    if (verification.status !== 'invited' || isExpired) {
      return res.status(410).json({
        error:
          verification.status === 'completed'
            ? 'This verification has already been submitted.'
            : 'This verification link has expired.',
      });
    }

    res.json(toPublicVerification(verification));
  } catch (error) {
    console.error('Error fetching verification:', error);
    res.status(500).json({ error: 'Failed to fetch verification' });
  }
});

/**
 * @swagger
 * /api/verifications/{token}/submit:
 *   post:
 *     summary: Submit an author's confirmation or corrections for a verification link
 *     tags:
 *       - Verifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: object
 *               confirmedAsIs:
 *                 type: boolean
 *               authorName:
 *                 type: string
 *               authorEmail:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Submitted for curator review
 *       '404':
 *         description: Link not found
 *       '409':
 *         description: Link already used or expired
 */
router.post('/:token/submit', async (req, res) => {
  try {
    const doc = await findByToken(req.params.token);
    if (!doc) {
      return res.status(404).json({ error: 'This verification link was not found.' });
    }

    const verification = doc.data() as PaperVerification;
    const isExpired = new Date(verification.expiresAt).getTime() < Date.now();

    if (verification.status !== 'invited' || isExpired) {
      return res.status(409).json({
        error:
          verification.status === 'completed'
            ? 'This verification has already been submitted.'
            : 'This verification link has expired.',
      });
    }

    const { answers, confirmedAsIs, authorName, authorEmail } = req.body || {};
    if (typeof answers !== 'object' || Array.isArray(answers) || !answers) {
      return res.status(400).json({ error: 'answers must be an object' });
    }

    const now = new Date().toISOString();
    const contributionId = `contribution_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    const contributionData: Omit<Contribution, 'id'> = {
      status: 'pending',
      templateId: verification.templateId,
      templateVersion: verification.templateVersion,
      paper: verification.paper,
      answers,
      origin: 'author_verification',
      originalAnswers: verification.prefilledAnswers,
      submittedByEmail:
        typeof authorEmail === 'string' && authorEmail.trim()
          ? authorEmail.trim()
          : undefined,
      submittedByName:
        typeof authorName === 'string' && authorName.trim()
          ? authorName.trim()
          : undefined,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await db
      .collection(CONTRIBUTIONS_COLLECTION)
      .doc(contributionId)
      .set(contributionData);

    await doc.ref.set(
      {
        status: 'completed',
        completedAt: now,
        contributionId,
        confirmedAsIs: Boolean(confirmedAsIs),
      },
      { merge: true }
    );

    await logRequest(
      'write',
      CONTRIBUTIONS_COLLECTION,
      contributionId,
      true,
      undefined,
      contributionData.submittedByEmail,
      undefined,
      { origin: 'author_verification', verificationId: doc.id }
    );

    res.json({ contributionId });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

export default router;
