import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = { userId: string; role?: string } & Record<string, any>;

export const signJwt = (
  payload: JwtPayload,
  expiresIn: SignOptions['expiresIn'] = (env.jwtExpiresIn || '180d') as any
): string => {
  if (!env.jwtSecret) {
    throw new Error('JWT secret is not defined');
  }

  return jwt.sign(payload, env.jwtSecret, { expiresIn });
};

export const verifyJwt = (token: string): JwtPayload => {
  if (!env.jwtSecret) {
    throw new Error('JWT secret is not defined');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    // Legacy tokens issued without an expiry must be replaced by a fresh login.
    if (typeof payload.exp !== 'number') throw new Error('Missing JWT expiry');
    return payload;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
};
