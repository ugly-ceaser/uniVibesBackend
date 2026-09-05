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

    // Update user profile safely mapping fields to Prisma schema
    updateProfile: async (userId: string, input: UpdateProfileInput): Promise<User> => {
      const data: Record<string, any> = {};

      const fullName = input.fullname ?? input.fullName;
      if (fullName !== undefined) {
        const trimmed = fullName.trim();
        data.fullname = trimmed;
        if (trimmed) {
          const parts = trimmed.split(/\s+/);
          data.firstname = parts[0];
          data.lastname = parts.length > 1 ? parts[parts.length - 1] : parts[0];
          data.middlename = parts.length > 2 ? parts.slice(1, -1).join(' ') : null;
        }
      }

      if (input.phone !== undefined) {
        data.phone = input.phone?.trim() || null;
      }

      if (input.regNumber !== undefined) {
        data.regNumber = input.regNumber?.trim() || null;
      }

      if (input.nin !== undefined) {
        data.nin = input.nin?.trim() || null;
      }

      if (input.university !== undefined) {
        data.university = input.university?.trim() || null;
      }

      if (input.faculty !== undefined) {
        data.faculty = input.faculty?.trim() || null;
      }

      if (input.department !== undefined) {
        data.department = input.department?.trim() || null;
      }

      if (input.programme !== undefined) {
        data.programme = input.programme?.trim() || null;
      }

      if (input.level !== undefined) {
        if (input.level === null || input.level === '') {
          data.level = null;
        } else {
          const parsed =
            typeof input.level === 'number'
              ? input.level
              : parseInt(String(input.level), 10);
          data.level = Number.isFinite(parsed) ? parsed : null;
        }
      }

      if (input.semester !== undefined) {
        data.semester = input.semester?.trim() || null;
      }

      if (input.avatarUrl !== undefined) {
        data.avatarUrl = input.avatarUrl?.trim() || null;
      }

      return prisma.user.update({
        where: { id: userId },
        data,
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
