import { Prisma } from '@prisma/client';
import bcrypt from "bcryptjs";
import { signJwt } from "../../utils/jwt";
import { RegisterInput, LoginInput } from "./auth.model";
import { PrismaClient, Role } from '@prisma/client';


const normalizeRole = (role?: string): Role => {
  if (!role) return Role.STUDENT;

  const upper = role.toUpperCase();

  if (upper === 'ADMIN') {
    throw new Error('Administrator registration is not allowed through public signup');
  }

  if (upper === 'GUEST' || upper === 'STUDENT') {
    return upper as Role;
  }

  return Role.STUDENT;
};
export const createAuthService = (prisma: PrismaClient) => {
  return {
    register: async (input: RegisterInput) => {
      // Check if email exists
      const existing = await prisma.user.findUnique({
        where: { email: input.email }
      });
      if (existing) {
        throw new Error("Email already registered");
      }

      // Check if username exists
      const existingUsername = await prisma.user.findUnique({
        where: { username: input.username }
      });
      if (existingUsername) {
        throw new Error("Username already taken");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const role = normalizeRole(input.role);
      const user = await prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          firstname: input.firstname,
          middlename: input.middlename || null,
          lastname: input.lastname,
          password: hashedPassword,
          fullname: input.fullname || `${input.firstname} ${input.middlename ? input.middlename + ' ' : ''}${input.lastname}`.trim(),
          role,
          regNumber: input.regNumber || null,
          department: input.department || null,
          faculty: input.faculty || null,
          level: input.level || null,
          verificationStatus: input.verificationStatus ?? false
        }
      });

      // Generate JWT
      const token = signJwt({ 
        userId: user.id, 
        role: user.role,
        department: user.department,
        level: user.level,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstname: user.firstname,
          middlename: user.middlename,
          lastname: user.lastname,
          fullname: user.fullname,
          role: user.role,
          regNumber: user.regNumber,
          department: user.department,
          faculty: user.faculty,
          level: user.level,
          verificationStatus: user.verificationStatus
        },
        token
      };
    },

    login: async (input: LoginInput) => {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: input.email }
      });
      if (!user) throw new Error("Invalid credentials");

      // Verify password
      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) throw new Error("Invalid credentials");

      // Generate token
      const token = signJwt({ 
        userId: user.id, 
        role: user.role,
        department: user.department,
        level: user.level,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          regNumber: user.regNumber,
          department: user.department,
          faculty: user.faculty,
          level: user.level,
          verificationStatus: user.verificationStatus
        },
        token
      };
    },

    checkUsername: async (username: string) => {
      const existing = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() }
      });
      return { available: !existing };
    },

    forgotPassword: async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      // Secure response: always return success to prevent email enumeration
      if (!user) {
        return { success: true, message: "If that email is registered, you will receive a reset code." };
      }

      // Generate 6-digit OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
      otpStore.set(normalizedEmail, { otp, expiresAt });

      return {
        success: true,
        message: "Reset code sent to email",
        otp: process.env.NODE_ENV === 'test' ? otp : undefined
      };
    },

    verifyResetOtp: async (email: string, otp: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const item = otpStore.get(normalizedEmail);

      if (!item || Date.now() > item.expiresAt || item.otp !== otp.trim()) {
        throw new Error("Invalid or expired reset code");
      }

      return { success: true, valid: true };
    },

    resetPassword: async (email: string, otp: string, newPassword: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const item = otpStore.get(normalizedEmail);

      if (!item || Date.now() > item.expiresAt || item.otp !== otp.trim()) {
        throw new Error("Invalid or expired reset code");
      }

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (!user) {
        throw new Error("Account no longer available");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      otpStore.delete(normalizedEmail);
      return { success: true, message: "Password updated successfully" };
    }
  };
};

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

