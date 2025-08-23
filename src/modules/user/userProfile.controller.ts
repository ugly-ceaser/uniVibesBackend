import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createProfileService } from './userProfile.service';
import { UpdateProfileInput, VerifyFieldInput } from './userProfile.model';

// Get current user's profile
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error('Prisma client not found');

  const service = createProfileService(prisma);
  const user = await service.getProfile(req.user.id); // assuming req.user is set by requireAuth

  if (!user) {
    return res.status(404).json({ status: 404, message: 'User not found', requestId: (req as any).id });
  }

  res.status(200).json({ data: user });
});

// Update current user's profile
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error('Prisma client not found');

  const input = req.body as UpdateProfileInput;
  const service = createProfileService(prisma);
  const updatedUser = await service.updateProfile(req.user.id, input);

  res.status(200).json({ data: updatedUser, message: 'Profile updated successfully' });
});

// Verify a specific field (email, phone, NIN, regNumber)
export const verifyProfileField = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error('Prisma client not found');

  const input = req.body as VerifyFieldInput;
  const service = createProfileService(prisma);
  const updatedUser = await service.verifyField(req.user.id, input);

  res.status(200).json({ data: updatedUser, message: 'Field verification updated successfully' });
});
