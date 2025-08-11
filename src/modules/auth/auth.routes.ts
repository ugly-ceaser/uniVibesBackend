import { Router } from 'express';
import { register, login } from './auth.controller';

export const createAuthRouter = () => {
  const router = Router();
  router.post('/register', register);
  router.post('/login', login);
  return router;
}; 