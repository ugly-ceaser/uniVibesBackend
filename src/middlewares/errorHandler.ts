import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({ status: 404, message: 'Not Found', requestId: (req as any).id });
};

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof ApiError ? err.statusCode : 500;

  // In dev, send full error details; in prod, send only generic message
  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    status,
    message: err.message || 'Internal Server Error',
    requestId: (req as any).id,
  } as any;

  // Include stack trace only in development
  if (!isProduction) {
    response.stack = err.stack;
    // If you want, you can include other error properties here
  }

  logger.error('Unhandled error', {
    status,
    message: err?.message,
    stack: err?.stack,
    requestId: (req as any).id,
  });

  res.status(status).json(response);
};
