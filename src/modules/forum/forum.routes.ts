import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { attachUserIfPresent, requireAuth,authorizeRoles } from '../../middlewares/authMiddleware';
import { 
  listQuestions, 
  addQuestion, 
  getQuestionById,
  addAnswer,
  fetchComments,
  postComment,
  createForum
} from './forum.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     ForumQuestion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique question identifier
 *         title:
 *           type: string
 *           description: Question title
 *           example: How do I implement binary search?
 *         body:
 *           type: string
 *           description: Question content
 *           example: I'm trying to implement binary search but getting errors...
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: Question author ID
 *         forumId:
 *           type: string
 *           format: uuid
 *           description: Forum category ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Question creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required: [id, title, body, authorId, createdAt, updatedAt]
 *     
 *     ForumAnswer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique answer identifier
 *         body:
 *           type: string
 *           description: Answer content
 *           example: Here's how you can implement binary search...
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: Answer author ID
 *         questionId:
 *           type: string
 *           format: uuid
 *           description: Related question ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Answer creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required: [id, body, authorId, questionId, createdAt, updatedAt]
 *     
 *     ForumComment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique comment identifier
 *         body:
 *           type: string
 *           description: Comment content
 *           example: Great explanation! Thanks.
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: Comment author ID
 *         answerId:
 *           type: string
 *           format: uuid
 *           description: Related answer ID
 *         parentId:
 *           type: string
 *           format: uuid
 *           description: Parent comment ID (for nested replies)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Comment creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required: [id, body, authorId, answerId, createdAt, updatedAt]
 */

/**
 * @swagger
 * /forum/questions:
 *   get:
 *     tags: [Forum]
 *     summary: List forum questions
 *     description: Retrieve a paginated list of forum questions with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of questions per page
 *       - in: query
 *         name: forumId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by forum category ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category name
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ForumQuestion'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /forum/questions/{id}:
 *   get:
 *     tags: [Forum]
 *     summary: Get question by ID
 *     description: Retrieve a specific forum question with its answers and comments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ForumQuestion'
 *       404:
 *         description: Question not found
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
 * /forum/questions:
 *   post:
 *     tags: [Forum]
 *     summary: Create a new question
 *     description: Post a new question to the forum
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
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 description: Question title
 *                 example: How do I implement binary search?
 *               body:
 *                 type: string
 *                 description: Question content
 *                 example: I'm trying to implement binary search but getting errors...
 *               forumId:
 *                 type: string
 *                 format: uuid
 *                 description: Forum category ID (optional)
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ForumQuestion'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * /forum/questions/{id}/answers:
 *   post:
 *     tags: [Forum]
 *     summary: Add answer to question
 *     description: Post an answer to a specific forum question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *                 description: Answer content
 *                 example: Here's how you can implement binary search...
 *     responses:
 *       201:
 *         description: Answer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ForumAnswer'
 *       400:
 *         description: Bad request - Missing answer body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Question not found
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
 * /forum/answers/{answerId}/comments:
 *   get:
 *     tags: [Forum]
 *     summary: Get comments for an answer
 *     description: Retrieve all comments and nested replies for a specific answer
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Answer ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ForumComment'
 *       404:
 *         description: Answer not found
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
 * /forum/comments:
 *   post:
 *     tags: [Forum]
 *     summary: Post a comment or reply
 *     description: Add a comment to an answer or reply to an existing comment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *               - answerId
 *             properties:
 *               body:
 *                 type: string
 *                 description: Comment content
 *                 example: Great explanation! Thanks.
 *               answerId:
 *                 type: string
 *                 format: uuid
 *                 description: Answer ID this comment belongs to
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent comment ID (for nested replies)
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ForumComment'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * /forum/forums:
 *   post:
 *     tags: [Forum]
 *     summary: Create a new forum category (Admin only)
 *     description: Create a new forum category - requires admin privileges
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Forum category name
 *                 example: Computer Science Discussion
 *               description:
 *                 type: string
 *                 description: Forum category description
 *                 example: Discuss computer science topics and programming
 *     responses:
 *       201:
 *         description: Forum category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const createForumRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  // Questions
  router.get(
    '/questions',
    createCacheMiddleware(redis, { ttlSeconds: 300 }),
    listQuestions
  );
  router.get(
    '/questions/:id',
    createCacheMiddleware(redis, { ttlSeconds: 300 }),
    getQuestionById
  );
  router.post(
    '/questions',
    attachUserIfPresent,
    requireAuth,
    addQuestion
  );

  // Answers
  router.post(
    '/questions/:id/answers',
    attachUserIfPresent,
    requireAuth,
    addAnswer
  );

  // Comments
  router.get(
    '/answers/:answerId/comments',
    createCacheMiddleware(redis, { ttlSeconds: 120 }),
    fetchComments
  );
  router.post(
    '/comments',
    attachUserIfPresent,
    requireAuth,
    postComment
  );

  router.post(
  '/forums',
  attachUserIfPresent,
  requireAuth,
  authorizeRoles('ADMIN'),
  createForum
);

  return router;
};


