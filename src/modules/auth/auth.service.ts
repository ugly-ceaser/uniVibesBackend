import { Prisma } from '@prisma/client';
import bcrypt from "bcryptjs";
import { signJwt } from "../../utils/jwt";
import { RegisterInput, LoginInput } from "./auth.model";
import { PrismaClient, Role } from '@prisma/client';


const normalizeRole = (role?: string): Role => {
  if (!role) return Role.STUDENT;

  const upper = role.toUpperCase();

  if (upper === 'GUEST' || upper === 'ADMIN' || upper === 'STUDENT') {
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

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const role = normalizeRole(input.role);
      const user = await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          fullname: input.fullname,
          role,
          regNumber: input.regNumber || null,
          department: input.department || null,
          faculty: input.faculty || null,
          level: input.level || null,
          verificationStatus: input.verificationStatus || null
        }
      });

      // Generate JWT
      const token = signJwt({ userId: user.id, role: user.role });

      return {
        user: {
          id: user.id,
          email: user.email,
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
      const token = signJwt({ userId: user.id, role: user.role });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          regNumber: user.regNumber,
          department: user.department,
          faculty: user.faculty,
          level: user.level,
          verificationStatus: user.verificationStatus
        },
        token
      };
    }
  };
};
