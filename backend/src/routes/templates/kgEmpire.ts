import { Router } from 'express';
import { db } from '../../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../../middleware/auth.js';
import { validateRequiredFields } from '../../middleware/validation.js';
const router = Router();

//  KG-EmpiRE Query Results — Metadata

router.post(
  '/:templateId/kg-empire-query-results/metadata',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['id', 'rowCount', 'storedAt']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId } = req.params;
      const { id, rowCount, storedAt } = req.body;

      await db
        .collection('Templates')
        .doc(templateId)
        .collection('KgEmpireQueryResults')
        .doc(id)
        .set({ id, rowCount, storedAt });

      res.json({ success: true });
    } catch (error) {
      console.error('Error storing KG-EmpiRE metadata:', error);
      res.status(500).json({
        error: 'Failed to store metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// KG-EmpiRE Query Results — Row Batches

router.post(
  '/:templateId/kg-empire-query-results/rows',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId } = req.params;
      const { id, batchIndex, rows } = req.body;

      if (!id || batchIndex === undefined || batchIndex === null || !rows) {
        return res
          .status(400)
          .json({ error: 'Missing required fields: id, batchIndex, rows' });
      }

      await db
        .collection('Templates')
        .doc(templateId)
        .collection('KgEmpireQueryResults')
        .doc(`${id}_chunk_${batchIndex}`)
        .set({
          parentId: id,
          chunkIndex: batchIndex,
          results: rows,
        });

      res.json({ success: true, stored: rows.length });
    } catch (error) {
      console.error('Error storing KG-EmpiRE rows:', error);
      res.status(500).json({
        error: 'Failed to store rows',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
