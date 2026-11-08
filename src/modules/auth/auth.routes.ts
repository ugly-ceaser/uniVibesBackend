import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { register, login, checkUsername, forgotPassword, verifyResetOtp, resetPassword } from './auth.controller';
import { createAuthRateLimiter } from '../../middlewares/rateLimiter';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password (minimum 6 characters)
 *                 example: password123
 *               fullname:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [STUDENT, GUEST, ADMIN]
 *                 description: User role
 *                 example: STUDENT
 *               regNumber:
 *                 type: string
 *                 description: Student registration number
 *                 example: 2021/CS/001
 *               department:
 *                 type: string
 *                 description: Student department
 *                 example: Computer Science
 *               faculty:
 *                 type: string
 *                 description: Student faculty
 *                 example: Science
 *               level:
 *                 type: integer
 *                 description: Student academic level
 *                 example: 100
 *               verificationStatus:
 *                 type: string
 *                 description: Account verification status
 *                 example: PENDING
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Email and password are required
 *                 requestId:
 *                   type: string
 *                   example: req-123456
 *       409:
 *         description: Conflict - User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login/register attempts from this IP (10 per 15 minutes, shared by both routes)
 *         headers:
 *           Retry-After:
 *             description: Seconds until the limit resets
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 429
 *                 message:
 *                   type: string
 *                   example: Too many attempts. Try again in 42 seconds.
 *                 retryAfter:
 *                   type: integer
 *                   example: 42
 *                 requestId:
 *                   type: string
 *                   example: req-123456
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Email and password are required
 *                 requestId:
 *                   type: string
 *                   example: req-123456
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login/register attempts from this IP (10 per 15 minutes, shared by both routes)
 *         headers:
 *           Retry-After:
 *             description: Seconds until the limit resets
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 429
 *                 message:
 *                   type: string
 *                   example: Too many attempts. Try again in 42 seconds.
 *                 retryAfter:
 *                   type: integer
 *                   example: 42
 *                 requestId:
 *                   type: string
 *                   example: req-123456
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const createAuthRouter = (container: AwilixContainer) => {
  const router = Router();
  // One limiter instance shared by login and register: one counter per IP for both.
  const authLimiter = createAuthRateLimiter(container);
  router.post('/register', authLimiter, register);
  router.post('/login', authLimiter, login);
  router.post('/check-username', checkUsername);
  router.post('/forgot-password', forgotPassword);
  router.post('/verify-reset-otp', verifyResetOtp);
  router.post('/reset-password', resetPassword);
  return router;
};