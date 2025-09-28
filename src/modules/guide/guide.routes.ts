import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { requireAuth, authorizeRoles } from '../../middlewares/authMiddleware';
import { 
  listGuide, 
  getGuideItem, 
  createGuideItem, 
  updateGuideItem, 
  deleteGuideItem,
  seedSampleGuides
} from './guide.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     Guide:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique guide identifier
 *         title:
 *           type: string
 *           description: Guide title
 *           example: How to Register for Courses
 *         content:
 *           type: string
 *           description: Guide content/description
 *           example: Step-by-step guide on course registration
 *         category:
 *           type: string
 *           description: Guide category
 *           example: Academic
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Guide tags
 *           example: ["registration", "courses", "academic"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Guide creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required: [id, title, content, createdAt, updatedAt]
 */

/**
 * @swagger
 * /guide:
 *   get:
 *     tags: [Guide]
 *     summary: List all guides
 *     description: Retrieve a list of all available guides
 *     responses:
 *       200:
 *         description: Guides retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Guide'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /guide/{id}:
 *   get:
 *     tags: [Guide]
 *     summary: Get guide by ID
 *     description: Retrieve a specific guide by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guide ID
 *     responses:
 *       200:
 *         description: Guide retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Guide'
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
 * /guide:
 *   post:
 *     tags: [Guide]
 *     summary: Create a new guide
 *     description: Create a new guide (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Guide title
 *                 example: How to Register for Courses
 *               content:
 *                 type: string
 *                 description: Guide content
 *                 example: Step-by-step guide on course registration
 *               category:
 *                 type: string
 *                 description: Guide category
 *                 example: Academic
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Guide tags
 *                 example: ["registration", "courses"]
 *     responses:
 *       201:
 *         description: Guide created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Guide'
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
 * /guide/{id}:
 *   put:
 *     tags: [Guide]
 *     summary: Update a guide
 *     description: Update an existing guide (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guide ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Guide title
 *               content:
 *                 type: string
 *                 description: Guide content
 *               category:
 *                 type: string
 *                 description: Guide category
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Guide tags
 *     responses:
 *       200:
 *         description: Guide updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Guide'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * /guide/{id}:
 *   delete:
 *     tags: [Guide]
 *     summary: Delete a guide (Admin only)
 *     description: Delete an existing guide - requires admin privileges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guide ID
 *     responses:
 *       200:
 *         description: Guide deleted successfully
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
 *       403:
 *         description: Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

export const createGuideRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  // Public routes (with caching)
  router.get('/', createCacheMiddleware(redis, { ttlSeconds: 300 }), listGuide);
  router.get('/:id', createCacheMiddleware(redis, { ttlSeconds: 300 }), getGuideItem);

  // Protected routes (require authentication)
  router.post('/', requireAuth, createGuideItem);
  router.put('/:id', requireAuth, updateGuideItem);
  router.delete('/:id', requireAuth, authorizeRoles('ADMIN'), deleteGuideItem);

  // Development/Testing routes (admin only)
  router.post('/dev/seed', requireAuth, authorizeRoles('ADMIN'), seedSampleGuides);

  return router;
}; 