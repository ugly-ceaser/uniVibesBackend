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

    // Verify a specific field (email, phone, NIN, regNumber)
    verifyField: async (userId: string, input: VerifyFieldInput): Promise<User> => {
      const validFields: (keyof VerifyFieldInput)[] = ['email', 'phone', 'nin', 'regNumber'];
      const updateData: Partial<Record<string, boolean>> = {};

      validFields.forEach((field) => {
        if (input[field] !== undefined) {
          updateData[`verificationStatus.${field}`] = input[field];
        }
      });

      return prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: {
            ...updateData,
          },
        },
      });
    },
  };
};
