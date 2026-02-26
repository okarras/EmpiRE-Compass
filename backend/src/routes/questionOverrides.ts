import { Router, Request, Response } from 'express';
import {
  validateKeycloakToken,
  requireAdmin,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import {
  saveChartSettings,
  type ChartSettingsOverride,
} from '../services/questionOverrideService.js';

const router = Router();

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

export default router;
