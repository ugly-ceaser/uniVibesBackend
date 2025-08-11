import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = { userId: string; role?: string } & Record<string, any>;

export const signJwt = (payload: JwtPayload, expiresIn: string | number = '7d'): string => {
  if (!env.jwtSecret) {
    throw new Error('JWT secret is not defined');
  }

  

  if (!env.jwtSecret) {
  throw new Error('JWT secret must be defined');
}


  return jwt.sign(payload, env.jwtSecret, );
};

export const verifyJwt = (token: string): JwtPayload => {
  if (!env.jwtSecret) {
    throw new Error('JWT secret is not defined');
  }

  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
};
