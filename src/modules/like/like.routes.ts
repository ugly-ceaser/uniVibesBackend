import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { requireAuth } from '../../middlewares/authMiddleware';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { 
  likeContent,
  unlikeContent,
  likeGuide, 
  unlikeGuide, 
  getGuideLikes, 
  checkUserLike, 
  getGuideLikers,
  getUserLikedGuides
} from './like.controller';

/**
 * @swagger
 * /likes/{contentType}/{contentId}/like:
 *   post:
 *     tags: [Likes]
 *     summary: Like content
 *     description: Like any type of content (guide, forum post, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [guide, forum, question, answer]
 *         description: Type of content to like
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     responses:
 *       201:
 *         description: Content liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Content already liked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /likes/{contentType}/{contentId}/like:
 *   delete:
 *     tags: [Likes]
 *     summary: Unlike content
 *     description: Remove like from any type of content
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [guide, forum, question, answer]
 *         description: Type of content to unlike
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Like not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /likes/guide/{guideId}/count:
 *   get:
 *     tags: [Likes]
 *     summary: Get guide like count
 *     description: Get the total number of likes for a specific guide
 *     parameters:
 *       - in: path
 *         name: guideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guide ID
 *     responses:
 *       200:
 *         description: Like count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 42
 *                     guideId:
 *                       type: string
 *                       format: uuid
 *       404:
 *         description: Guide not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /likes/guide/{guideId}/check:
 *   get:
 *     tags: [Likes]
 *     summary: Check if user liked a guide
 *     description: Check if the authenticated user has liked a specific guide
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guide ID
 *     responses:
 *       200:
 *         description: Like status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *                       example: true
 *                     guideId:
 *                       type: string
 *                       format: uuid
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /likes/user/liked-guides:
 *   get:
 *     tags: [Likes]
 *     summary: Get user's liked guides
 *     description: Retrieve all guides liked by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liked guides retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Guide'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const createLikeRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  // Generic like/unlike routes (require authentication)
  router.post('/:contentType/:contentId/like', requireAuth, likeContent);
  router.delete('/:contentType/:contentId/like', requireAuth, unlikeContent);
  
  // Legacy guide-specific routes (for backward compatibility)
  router.post('/guide/:guideId/like', requireAuth, likeGuide);
  router.delete('/guide/:guideId/like', requireAuth, unlikeGuide);
  
  // Check if user has liked a guide (require authentication)
  router.get('/guide/:guideId/check', requireAuth, checkUserLike);
  
  // Get user's liked guides (require authentication)
  router.get('/user/liked-guides', requireAuth, getUserLikedGuides);
  
  // Public routes (with caching)
  router.get('/guide/:guideId/count', createCacheMiddleware(redis, { ttlSeconds: 60 }), getGuideLikes);
  router.get('/guide/:guideId/likers', createCacheMiddleware(redis, { ttlSeconds: 120 }), getGuideLikers);

  return router;
};
