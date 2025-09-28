import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { attachUserIfPresent, requireAuth, authorizeRoles } from '../../middlewares/authMiddleware';
import { listCourses, getCourse, createCourse } from './courses.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique course identifier
 *         name:
 *           type: string
 *           description: Course name
 *           example: Introduction to Computer Science
 *         code:
 *           type: string
 *           description: Course code
 *           example: CSC101
 *         level:
 *           type: integer
 *           description: Academic level
 *           example: 100
 *         coordinator:
 *           type: string
 *           description: Course coordinator name
 *           example: Dr. John Smith
 *         outline:
 *           type: array
 *           items:
 *             type: string
 *           description: Course outline topics
 *           example: ["Introduction to Programming", "Data Structures", "Algorithms"]
 *         unitLoad:
 *           type: integer
 *           description: Course unit load
 *           example: 3
 *         semester:
 *           type: integer
 *           description: Semester (1 or 2)
 *           example: 1
 *         department:
 *           type: string
 *           description: Department name
 *           example: Computer Science
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Course creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required: [id, name, coordinator, unitLoad, semester, department, createdAt, updatedAt]
 */

/**
 * @swagger
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: List courses
 *     description: Retrieve a list of courses, optionally filtered by level and department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Filter by academic level
 *         example: 200
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *         example: Computer Science
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
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
 * /courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course by ID
 *     description: Retrieve a specific course by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course not found
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
 * /courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create a new course (Admin only)
 *     description: Create a new course - requires admin privileges
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
 *               - coordinator
 *               - unitLoad
 *               - semester
 *               - department
 *             properties:
 *               name:
 *                 type: string
 *                 description: Course name
 *                 example: Introduction to Computer Science
 *               code:
 *                 type: string
 *                 description: Course code
 *                 example: CSC101
 *               level:
 *                 type: integer
 *                 description: Academic level
 *                 example: 100
 *               coordinator:
 *                 type: string
 *                 description: Course coordinator name
 *                 example: Dr. John Smith
 *               outline:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Course outline topics
 *                 example: ["Introduction to Programming", "Data Structures"]
 *               unitLoad:
 *                 type: integer
 *                 description: Course unit load
 *                 example: 3
 *               semester:
 *                 type: integer
 *                 description: Semester (1 or 2)
 *                 example: 1
 *               department:
 *                 type: string
 *                 description: Department name
 *                 example: Computer Science
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Course'
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

export const createCoursesRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  /**
   * Helper to build a unique cache key that includes query params
   * e.g. /courses?level=200&semester=1
   */
  const cacheKeyBuilder = (req: any) => {
    const queryString = new URLSearchParams(req.query).toString();
    const userLevel = (req as any).user?.level ?? 'anon';
    return `courses:l=${userLevel}:${queryString || 'all'}`;
  };

  // Admin-only route to create a course
  router.post(
    '/',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles('ADMIN'),
    createCourse
  );

  // Public route with caching & query-based filters
  router.get(
    '/',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles('ADMIN', 'STUDENT'),
    createCacheMiddleware(redis, { ttlSeconds: 300, key: cacheKeyBuilder }),
    listCourses
  );

  // Public route to get a course by ID
  router.get('/:id',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles('ADMIN', 'STUDENT'),
     getCourse);

  return router;
};
