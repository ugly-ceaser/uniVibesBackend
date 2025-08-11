import { NextFunction, Request, Response } from 'express';

export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export type Role = 'student' | 'guest' | 'admin';

export const requireRole = (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as { role?: Role } | undefined;
  if (!user || !user.role || !roles.includes(user.role)) {
    return res.status(403).json({ status: 403, message: 'Forbidden', requestId: (req as any).id });
  }
  next();
}; 