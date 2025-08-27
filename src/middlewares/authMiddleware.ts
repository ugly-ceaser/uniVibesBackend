import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';

export const attachUserIfPresent = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next();
  try {
    const payload = verifyJwt(token);
    console.log('Decoded JWT payload:', payload); // <-- Add this line
    (req as any).user = {
      id: payload.userId,
      role: payload.role,
      department: payload.department ?? undefined,
      level: payload.level ?? undefined,
    };
  } catch (_) {
    // ignore invalid token
  }
  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized', requestId: (req as any).id });
  next();
}; 

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', requestId: (req as any).id });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ status: 403, message: 'Forbidden: Insufficient role', requestId: (req as any).id });
    }

    next();
  };
};