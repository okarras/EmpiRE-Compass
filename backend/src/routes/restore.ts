import { Router, Request, Response } from 'express';
import express from 'express';
import { validateKeycloakToken, requireAdmin } from '../middleware/auth.js';
import { restoreFromBackup } from '../services/restoreService.js';

const router = Router();

// Accept raw text body (backup JSON string) with high limit for large backups
const restoreBodyParser = express.text({
  type: ['application/json', 'text/plain'],
  limit: '100mb',
});

/**
 * POST /api/restore
 * Restore Firestore from backup JSON. Uses Admin SDK (bypasses security rules).
 * Body: raw backup file content (JSON string).
 */
router.post(
  '/',
  validateKeycloakToken,
  requireAdmin,
  restoreBodyParser,
  async (req: Request, res: Response) => {
    try {
      const content = req.body as string;
      if (!content || typeof content !== 'string') {
        return res
          .status(400)
          .json({ error: 'Request body must be the backup JSON string' });
      }

      const result = await restoreFromBackup(content);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        collectionsRestored: result.collectionsRestored,
        documentsRestored: result.documentsRestored,
        timestamp: result.timestamp,
      });
    } catch (error) {
      console.error('Restore API error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      });
    }
  }
);

export default router;
