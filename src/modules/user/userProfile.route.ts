import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { requireAuth, authorizeRoles } from '../../middlewares/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  verifyProfileField,
} from './userProfile.controller';

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
