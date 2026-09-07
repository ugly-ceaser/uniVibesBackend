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
    username,
    firstname,
    middlename,
    lastname,
    password,
    role,
    regNumber,
    department,
    faculty,
    level,
    verificationStatus,
  } = req.body || {};

  if (!email || !password || !username || !firstname || !lastname) {
    return res.status(400).json({
      status: 400,
      message: "Email, username, firstname, lastname, and password are required",
      requestId: (req as any).id,
    });
  }

  if (role && role.toUpperCase() === 'ADMIN') {
    return res.status(400).json({
      status: 400,
      message: "Administrator registration is not allowed through public signup",
      requestId: (req as any).id,
    });
  }

  if (
    role &&
    !["STUDENT", "GUEST"].includes(role.toUpperCase())
  ) {
    return res.status(400).json({
      status: 400,
      message: "Invalid role",
      requestId: (req as any).id,
    });
  }

  // Convert verificationStatus from string to boolean if needed
  let verificationStatusBoolean: boolean | null = null;
  if (verificationStatus !== undefined && verificationStatus !== null) {
    if (typeof verificationStatus === 'string') {
      // Convert string values to boolean
      verificationStatusBoolean = verificationStatus.toLowerCase() === 'true';
    } else if (typeof verificationStatus === 'boolean') {
      verificationStatusBoolean = verificationStatus;
    }
  }

  const result = await service.register({
    email,
    username,
    firstname,
    middlename,
    lastname,
    fullname: req.body.fullname || `${firstname} ${middlename ? middlename + ' ' : ''}${lastname}`.trim(),
    password,
    role: role ? role.toLowerCase() : undefined, // normalizeRole expects lowercase
    regNumber,
    department,
    faculty,
    level,
    verificationStatus: verificationStatusBoolean,
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

export const checkUsername = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  const service = createAuthService(prisma);
  const { username } = req.body || {};

  if (!username) {
    return res.status(400).json({
      status: 400,
      message: "Username is required",
      requestId: (req as any).id,
    });
  }

  const result = await service.checkUsername(username);
  return res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error("Prisma client not found in request container");

  const service = createAuthService(prisma);
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({
      status: 400,
      message: "Email is required",
      requestId: (req as any).id,
    });
  }

  const result = await service.forgotPassword(email);
  return res.status(200).json(result);
});

export const verifyResetOtp = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error("Prisma client not found in request container");

  const service = createAuthService(prisma);
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({
      status: 400,
      message: "Email and OTP code are required",
      requestId: (req as any).id,
    });
  }

  try {
    const result = await service.verifyResetOtp(email, otp);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({
      status: 400,
      message: err.message || "Invalid or expired reset code",
      requestId: (req as any).id,
    });
  }
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error("Prisma client not found in request container");

  const service = createAuthService(prisma);
  const { email, otp, newPassword } = req.body || {};

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      status: 400,
      message: "Email, OTP code, and new password are required",
      requestId: (req as any).id,
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      status: 400,
      message: "Password must be at least 6 characters long",
      requestId: (req as any).id,
    });
  }

  try {
    const result = await service.resetPassword(email, otp, newPassword);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({
      status: 400,
      message: err.message || "Password reset failed",
      requestId: (req as any).id,
    });
  }
});

