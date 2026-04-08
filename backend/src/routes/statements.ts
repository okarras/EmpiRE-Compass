import { Router, Request, Response } from 'express';
import { fetchStatementsBundle } from '../services/orkgStatisticsService.js';

const router = Router();

/**
 * Proxy ORKG statements bundle (subject–predicate–object) for graph views.
 * GET /api/statements/bundle/:resourceId?maxLevel=15
 */
router.get('/bundle/:resourceId', async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    if (!resourceId?.trim()) {
      res.status(400).json({ error: 'resourceId is required' });
      return;
    }
    const maxLevelRaw = req.query.maxLevel;
    const maxLevel =
      maxLevelRaw !== undefined && maxLevelRaw !== ''
        ? Number(maxLevelRaw)
        : undefined;
    const statements = await fetchStatementsBundle(resourceId.trim(), {
      maxLevel:
        maxLevel !== undefined && Number.isFinite(maxLevel)
          ? maxLevel
          : undefined,
    });
    res.json({ statements });
  } catch (err) {
    console.error('[statements/bundle]', err);
    res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : 'Failed to fetch statements bundle',
    });
  }
});

export default router;
