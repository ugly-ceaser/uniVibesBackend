import { z } from "zod";

// Common role mapping
const roleEnum = z.enum(["student", "guest", "admin"]); // lowercase for requests

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullname:z.string(),
  role: roleEnum.optional().default("student"),
  regNumber: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  faculty: z.string().nullable().optional(),
  level: z.number().int().nullable().optional(),
  verificationStatus: z.boolean().nullable().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
