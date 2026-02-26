import { Router, Request, Response } from 'express';
import {
  validateKeycloakToken,
  requireAdmin,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import {
  getQuestionOverride,
  saveChartSettings,
  saveQuestionVersion,
  restoreQuestionVersion,
  type ChartSettingsOverride,
  type QuestionVersion,
} from '../services/questionOverrideService.js';

const router = Router();

router.get('/:queryUid', async (req: Request, res: Response) => {
  try {
    const { queryUid } = req.params;
    if (!queryUid) {
      return res.status(400).json({ error: 'queryUid is required' });
    }

    const doc = await getQuestionOverride(queryUid);
    if (!doc) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(doc);
  } catch (error) {
    console.error('Get question override error:', error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch question override',
    });
  }
});

/**
 * POST /api/question-overrides/:queryUid/chart-settings
 * Save chart settings override for a question. Updates Firestore via backend.
 * Body: { which: 'chartSettings' | 'chartSettings2', settings: ChartSettingsOverride, changeDescription?: string }
 */
router.post(
  '/:queryUid/chart-settings',
  validateKeycloakToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { queryUid } = req.params;
      const { which, settings, changeDescription } = req.body as {
        which: 'chartSettings' | 'chartSettings2';
        settings: ChartSettingsOverride;
        changeDescription?: string;
      };

      if (!queryUid) {
        return res.status(400).json({ error: 'queryUid is required' });
      }
      if (!which || !['chartSettings', 'chartSettings2'].includes(which)) {
        return res
          .status(400)
          .json({ error: 'which must be chartSettings or chartSettings2' });
      }
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'settings object is required' });
      }

      const authReq = req as AuthenticatedRequest;
      const authorId = authReq.userId || 'unknown';
      const authorName = authReq.userEmail || authReq.userId;

      await saveChartSettings({
        queryUid,
        which,
        settings,
        authorId,
        authorName,
        changeDescription,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Save chart settings error:', error);
      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save chart settings',
      });
    }
  }
);

router.post(
  '/:queryUid/version',
  validateKeycloakToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { queryUid } = req.params;
      const { versionData, changeDescription } = req.body as {
        versionData: Partial<QuestionVersion>;
        changeDescription?: string;
      };

      if (!queryUid) {
        return res.status(400).json({ error: 'queryUid is required' });
      }
      if (!versionData || typeof versionData !== 'object') {
        return res.status(400).json({ error: 'versionData is required' });
      }

      const authReq = req as AuthenticatedRequest;
      await saveQuestionVersion({
        queryUid,
        versionData,
        authorId: authReq.userId || 'unknown',
        authorName: authReq.userEmail || authReq.userId,
        changeDescription,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Save question version error:', error);
      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save question version',
      });
    }
  }
);

router.post(
  '/:queryUid/restore',
  validateKeycloakToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { queryUid } = req.params;
      const { versionId } = req.body as { versionId?: string };

      if (!queryUid || !versionId) {
        return res
          .status(400)
          .json({ error: 'queryUid and versionId are required' });
      }

      const authReq = req as AuthenticatedRequest;
      await restoreQuestionVersion({
        queryUid,
        versionId,
        authorId: authReq.userId || 'unknown',
        authorName: authReq.userEmail || authReq.userId,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Restore question version error:', error);
      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to restore question version',
      });
    }
  }
);

export default router;
