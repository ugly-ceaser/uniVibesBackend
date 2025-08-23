import { Request, Response } from "express";
import { asyncHandler } from "../../utils/http";
import { createAuthService } from "./auth.service";

// REGISTER CONTROLLER
export const register = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
if (!prisma) {
  throw new Error("Prisma client not found in request container");
}
  const service = createAuthService(prisma);

  const {
    email,
    fullname,
    password,
    role,
    regNumber,
    department,
    faculty,
    level,
    verificationStatus,
  } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      status: 400,
      message: "Email and password are required",
      requestId: (req as any).id,
    });
  }

  if (
    role &&
    !["STUDENT", "GUEST", "ADMIN"].includes(role.toUpperCase())
  ) {
    return res.status(400).json({
      status: 400,
      message: "Invalid role",
      requestId: (req as any).id,
    });
  }

  const result = await service.register({
    email,
    fullname,
    password,
    role: role ? role.toLowerCase() : undefined, // normalizeRole expects lowercase
    regNumber,
    department,
    faculty,
    level,
    verificationStatus,
  });

  return res.status(201).json(result);
});


// LOGIN CONTROLLER
export const login = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
if (!prisma) {
  throw new Error("Prisma client not found in request container");
}
  const service = createAuthService(prisma);

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({
      status: 400,
      message: "Email and password are required",
      requestId: (req as any).id
    });
  }

  const result = await service.login({ email, password });
  return res.status(200).json(result);
});
