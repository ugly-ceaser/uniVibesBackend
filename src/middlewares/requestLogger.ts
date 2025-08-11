import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const existing = req.headers['x-request-id'] as string | undefined;
  const id = existing || uuidv4();
  (req as any).id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

morgan.token('req-id', (req) => (req as any).id || '-');

const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export const requestLogger = morgan(':req-id :method :url :status :res[content-length] - :response-time ms', { stream }); 