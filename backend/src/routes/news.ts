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
 *     NewsItem:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         author:
 *           type: string
 *         authorId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         published:
 *           type: boolean
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         imageUrl:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, normal, high]
 */

export interface NewsItem {
  id?: string;
  title: string;
  content: string;
  author?: string;
  authorId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  published: boolean;
  publishedAt?: string | Date;
  tags?: string[];
  imageUrl?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news items
 *     tags:
 *       - News
 *     parameters:
 *       - in: query
 *         name: publishedOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, only return published news items
 *     responses:
 *       '200':
 *         description: News items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NewsItem'
 *       '500':
 *         description: Failed to fetch news items
 */
router.get('/', async (req, res) => {
  try {
    const publishedOnly = req.query.publishedOnly === 'true';
    const newsRef = db.collection('News');
    const newsSnapshot = await newsRef.orderBy('createdAt', 'desc').get();
    const newsItems: NewsItem[] = [];

    newsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!publishedOnly || data.published === true) {
        newsItems.push({
          id: doc.id,
          ...data,
        } as NewsItem);
      }
    });

    await logRequest(
      'read',
      'News',
      'all',
      true,
      undefined,
      undefined,
      undefined,
      { publishedOnly }
    );

    res.json(newsItems);
  } catch (error) {
    console.error('Error fetching news:', error);

    await logRequest(
      'read',
      'News',
      'all',
      false,
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(500).json({ error: 'Failed to fetch news items' });
  }
});

/**
 * @swagger
 * /api/news/{newsId}:
 *   get:
 *     summary: Get a news item by ID
 *     tags:
 *       - News
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the news item to retrieve
 *     responses:
 *       '200':
 *         description: News item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsItem'
 *       '404':
 *         description: News item not found
 *       '500':
 *         description: Failed to fetch news item
 */
router.get('/:newsId', async (req, res) => {
  try {
    const { newsId } = req.params;
    const newsRef = db.collection('News').doc(newsId);
    const newsDoc = await newsRef.get();

    if (!newsDoc.exists) {
      return res.status(404).json({ error: 'News item not found' });
    }

    await logRequest('read', 'News', newsId, true);

    res.json({ id: newsDoc.id, ...newsDoc.data() } as NewsItem);
  } catch (error) {
    console.error('Error fetching news item:', error);

    await logRequest(
      'read',
      'News',
      req.params.newsId,
      false,
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(500).json({ error: 'Failed to fetch news item' });
  }
});

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Create a news item
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsItem'
 *     responses:
 *       '200':
 *         description: News item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsItem'
 *       '400':
 *         description: Missing required fields
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '500':
 *         description: Failed to create news item
 */
router.post(
  '/',
  validateKeycloakToken,
  requireAdmin,
  validateRequiredFields(['title', 'content']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const newsData: NewsItem = req.body;
      const now = new Date().toISOString();

      const newsItemData = {
        ...newsData,
        createdAt: newsData.createdAt || now,
        updatedAt: now,
        published: newsData.published || false,
        publishedAt:
          newsData.published && !newsData.publishedAt
            ? now
            : newsData.publishedAt,
        authorId: req.userId,
        author: req.userEmail,
      };

      const newsId =
        newsData.id ||
        `news_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const newsRef = db.collection('News').doc(newsId);

      // Remove id from document data (use it as document ID)
      const { id: _id, ...docData } = newsItemData;
      await newsRef.set(docData);

      await logRequest(
        'write',
        'News',
        newsId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'POST' },
        docData
      );

      res.json({ id: newsId, ...docData });
    } catch (error) {
      console.error('Error creating news item:', error);

      await logRequest(
        'write',
        'News',
        req.body.id || 'unknown',
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to create news item' });
    }
  }
);

/**
 * @swagger
 * /api/news/{newsId}:
 *   put:
 *     summary: Update a news item
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the news item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial news item data to update
 *     responses:
 *       '200':
 *         description: News item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsItem'
 *       '401':
 *         description: Unauthorized - missing or invalid Keycloak token
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: News item not found
 *       '500':
 *         description: Failed to update news item
 */
router.put(
  '/:newsId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { newsId } = req.params;
      const updates: Partial<NewsItem> = req.body;
      const newsRef = db.collection('News').doc(newsId);

      const newsDoc = await newsRef.get();
      if (!newsDoc.exists) {
        return res.status(404).json({ error: 'News item not found' });
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        // If publishing for the first time, set publishedAt
        ...(updates.published === true &&
          !updates.publishedAt &&
          !newsDoc.data()?.publishedAt && {
            publishedAt: new Date().toISOString(),
          }),
      };

      // Remove id from update data
      const { id: _id, ...docData } = updateData;
      await newsRef.set(docData, { merge: true });

      await logRequest(
        'update',
        'News',
        newsId,
        true,
        req.userId,
        req.userEmail,
        undefined,
        { method: 'PUT' },
        docData
      );

      const updatedDoc = await newsRef.get();
      res.json({ id: newsId, ...updatedDoc.data() } as NewsItem);
    } catch (error) {
      console.error('Error updating news item:', error);

      await logRequest(
        'update',
        'News',
        req.params.newsId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to update news item' });
    }
  }
);

/**
 * @swagger
 * /api/news/{newsId}:
 *   delete:
 *     summary: Delete a news item
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the news item to delete
 *     responses:
 *       '200':
 *         description: News item deleted successfully
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
 *         description: News item not found
 *       '500':
 *         description: Failed to delete news item
 */
router.delete(
  '/:newsId',
  validateKeycloakToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { newsId } = req.params;
      const newsRef = db.collection('News').doc(newsId);

      const newsDoc = await newsRef.get();
      if (!newsDoc.exists) {
        return res.status(404).json({ error: 'News item not found' });
      }

      await newsRef.delete();

      await logRequest(
        'delete',
        'News',
        newsId,
        true,
        req.userId,
        req.userEmail
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting news item:', error);

      await logRequest(
        'delete',
        'News',
        req.params.newsId,
        false,
        req.userId,
        req.userEmail,
        error instanceof Error ? error.message : 'Unknown error'
      );

      res.status(500).json({ error: 'Failed to delete news item' });
    }
  }
);

export default router;
