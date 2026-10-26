import { Router } from 'express';
import { db } from '../../config/firebase.js';
import {
  validateKeycloakToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../../middleware/auth.js';
import { validateRequiredFields } from '../../middleware/validation.js';
const router = Router();

const YEAR_DOC_ID = /^(unknown|\d{4})$/;

function resultsCollection(templateId: string) {
  return db
    .collection('Templates')
    .doc(templateId)
    .collection('KgEmpireQueryResults');
}

async function deleteStaleResultDocs(
  templateId: string,
  parentId: string
): Promise<void> {
  const col = resultsCollection(templateId);

  const siblings = await col.get();
  const siblingDeletes = siblings.docs
    .filter((doc) => doc.id.startsWith(`${parentId}_`))
    .map((doc) => doc.ref.delete());

  const yearDocs = await col.doc(parentId).collection('years').get();
  const yearDeletes = yearDocs.docs.map((doc) => doc.ref.delete());

  await Promise.all([...siblingDeletes, ...yearDeletes]);
}

//  KG-EmpiRE Query Results — Metadata

router.post(
  '/:templateId/kg-empire-query-results/metadata',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['id', 'rowCount', 'storedAt']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId } = req.params;
      const { id, rowCount, storedAt, years } = req.body;

      await deleteStaleResultDocs(templateId, id);

      await resultsCollection(templateId)
        .doc(id)
        .set({
          id,
          rowCount,
          storedAt,
          years: Array.isArray(years) ? years : [],
        });

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

// KG-EmpiRE Query Results — Rows grouped by year

router.post(
  '/:templateId/kg-empire-query-results/rows',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId } = req.params;
      const { id, rows } = req.body;
      const year = String(req.body.year ?? '');

      if (!id || !year || !rows) {
        return res
          .status(400)
          .json({ error: 'Missing required fields: id, year, rows' });
      }

      if (!YEAR_DOC_ID.test(year)) {
        return res.status(400).json({ error: 'Invalid year' });
      }

      const docRef = resultsCollection(templateId)
        .doc(id)
        .collection('years')
        .doc(year);

      const existing = await docRef.get();
      const previous = existing.exists
        ? ((existing.data()?.results as unknown[]) ?? [])
        : [];

      await docRef.set({
        parentId: id,
        year,
        results: [...previous, ...rows],
      });

      res.json({ success: true, stored: rows.length, year });
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
