import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { requireAuth, authorizeRoles } from '../../middlewares/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  verifyProfileField,
} from './userProfile.controller';

/**
 * @swagger
 * /user/profile:
 *   get:
 *     tags: [User Profile]
 *     summary: Get current user's profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: Authentication required
 *                 requestId:
 *                   type: string
 *                   example: req-123456
 *       404:
 *         description: User not found
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
 * /user/profile:
 *   put:
 *     tags: [User Profile]
 *     summary: Update current user's profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *                 example: +234-123-456-7890
 *               department:
 *                 type: string
 *                 description: Student's department
 *                 example: Computer Science
 *               faculty:
 *                 type: string
 *                 description: Student's faculty
 *                 example: Science
 *               level:
 *                 type: integer
 *                 description: Student's academic level
 *                 example: 200
 *               semester:
 *                 type: string
 *                 description: Current semester
 *                 example: First
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
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
 * /user/profile/verify:
 *   patch:
 *     tags: [User Profile]
 *     summary: Verify profile fields
 *     description: Update verification status for specific profile fields
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *                 description: Email verification status
 *                 example: true
 *               phone:
 *                 type: boolean
 *                 description: Phone verification status
 *                 example: true
 *               nin:
 *                 type: boolean
 *                 description: NIN verification status
 *                 example: false
 *               regNumber:
 *                 type: boolean
 *                 description: Registration number verification status
 *                 example: true
 *     responses:
 *       200:
 *         description: Field verification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Field verification updated successfully
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

export const createProfileRouter = (container: AwilixContainer) => {
  const router = Router();

  // Get current user's profile
  router.get('/', requireAuth, getUserProfile);

  // Update current user's profile
  router.put('/', requireAuth, updateUserProfile);

  // Verify a specific field (email, phone, NIN, regNumber)
  router.patch('/verify', requireAuth, verifyProfileField);

  return router;
};
