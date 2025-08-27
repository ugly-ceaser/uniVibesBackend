import { PrismaClient, User } from '@prisma/client';
import { UpdateProfileInput, VerifyFieldInput } from './userProfile.model';

export const createProfileService = (prisma: PrismaClient) => {
  return {
    // Get user profile by user ID
    getProfile: async (userId: string): Promise<User | null> => {
      return prisma.user.findUnique({
        where: { id: userId },
      });
    },

    // Update user profile
    updateProfile: async (userId: string, input: UpdateProfileInput): Promise<User> => {
      return prisma.user.update({
        where: { id: userId },
        data: input,
      });
    },

    // Verify profile: your Prisma schema has a single boolean `verificationStatus` on User.
    // We map any provided flags to that single boolean (true if any true and none false; false if any false).
    verifyField: async (userId: string, input: VerifyFieldInput): Promise<User> => {
      const providedValues = Object.values(input).filter((v): v is boolean => typeof v === 'boolean');

      if (providedValues.length === 0) {
        throw new Error('No verification flag provided');
      }

      // If any flag is false, set overall status to false. Otherwise, set to true if any true exists.
      const hasFalse = providedValues.some((v) => v === false);
      const hasTrue = providedValues.some((v) => v === true);

      const nextStatus = hasFalse ? false : hasTrue ? true : undefined;

      if (typeof nextStatus !== 'boolean') {
        throw new Error('Invalid verification flags');
      }

      return prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: nextStatus },
      });
    },
  };
};
