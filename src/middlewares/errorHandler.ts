import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const DB_UNAVAILABLE_MESSAGE = 'UniVibe is temporarily unavailable. Please try again shortly.';

const GENERIC_MESSAGE = 'Internal Server Error';

const DB_UNAVAILABLE_CODES = new Set(['P1001', 'P1002', 'P1017']);

/**
 * True only when NODE_ENV is exactly 'development' or 'test'.
 * Read from process.env at call time on purpose: env.ts defaults a missing NODE_ENV to
 * 'development', and a missing NODE_ENV (the Render case) must stay in safe mode.
 */
export const exposeErrorDetails = (): boolean =>
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

/**
 * True when the error means the database cannot be reached.
 * The `name` check is needed because `instanceof` fails across module registries
 * (e.g. under jest.isolateModules).
 */
export const isDbUnavailableError = (err: unknown): boolean => {
  const e = err as any;
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (e?.name === 'PrismaClientInitializationError') return true;
  const code = e?.code ?? e?.errorCode;
  return typeof code === 'string' && DB_UNAVAILABLE_CODES.has(code);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({ status: 404, message: 'Not Found', requestId: (req as any).id });
};

// Express recognises error handlers by their four parameters, so `_next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const exposeDetails = exposeErrorDetails();
  const requestId = (req as any).id;

  let status: number;
  let message: string;
  if (isDbUnavailableError(err)) {
    status = 503;
    message = DB_UNAVAILABLE_MESSAGE;
  } else if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
  } else {
    status = 500;
    message = exposeDetails ? err?.message || GENERIC_MESSAGE : GENERIC_MESSAGE;
  }

  const response: Record<string, unknown> = { status, message, requestId };
  if (exposeDetails) {
    response.stack = err?.stack;
  }

  const code = err?.code ?? err?.errorCode;
  logger.error('Unhandled error', {
    status,
    message: err?.message,
    code,
    stack: err?.stack,
    requestId,
  });

  // In safe mode the response no longer carries the details, and in production winston only
  // writes to files. Render's log view only shows stdout/stderr, so print one line there too.
  if (!exposeDetails) {
    console.error(
      `error requestId=${requestId ?? '-'} status=${status} name=${err?.name} code=${code ?? '-'} message=${err?.message}` +
        `\n${err?.stack}`
    );
  }

  res.status(status).json(response);
};
