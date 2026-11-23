import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { requestId } from '../../middlewares/requestLogger';
import {
  ApiError,
  DB_UNAVAILABLE_MESSAGE,
  errorHandler,
  exposeErrorDetails,
  isDbUnavailableError,
} from '../../middlewares/errorHandler';
import { logger } from '../../config/logger';

const RAW_MESSAGE =
  "Invalid `prisma.user.findMany()` invocation in C:\\srv\\src\\modules\\x.service.ts: Can't reach db.example.internal";
const DB_HOST_MESSAGE = "Can't reach database server at `db.example.internal:5432`";

const makeErrors = () => ({
  raw: () => new Error(RAW_MESSAGE),
  notFound: () => new ApiError(404, 'Course not found'),
  initNoCode: () => new Prisma.PrismaClientInitializationError(DB_HOST_MESSAGE, '5.22.0'),
  initP1001: () => new Prisma.PrismaClientInitializationError(DB_HOST_MESSAGE, '5.22.0', 'P1001'),
  knownP1002: () =>
    new Prisma.PrismaClientKnownRequestError(DB_HOST_MESSAGE, { code: 'P1002', clientVersion: '5.22.0' }),
  knownP1017: () =>
    new Prisma.PrismaClientKnownRequestError(DB_HOST_MESSAGE, { code: 'P1017', clientVersion: '5.22.0' }),
  plainP1001: () => {
    const e = new Error(DB_HOST_MESSAGE) as Error & { code?: string };
    e.code = 'P1001';
    return e;
  },
  knownP2025: () =>
    new Prisma.PrismaClientKnownRequestError(
      'An operation failed because it depends on records that were not found (db.example.internal)',
      { code: 'P2025', clientVersion: '5.22.0' }
    ),
});

type ErrorKey = keyof ReturnType<typeof makeErrors>;

const buildApp = () => {
  const app = express();
  app.use(requestId);
  app.get('/boom/:kind', (req: Request, _res: Response, next: NextFunction) => {
    const factories = makeErrors();
    next(factories[req.params.kind as ErrorKey]());
  });
  app.use(errorHandler);
  return app;
};

const hit = (kind: ErrorKey) => request(buildApp()).get(`/boom/${kind}`).set('X-Request-Id', 'req-1');

const DB_ERROR_KINDS: ErrorKey[] = ['initNoCode', 'initP1001', 'knownP1002', 'knownP1017', 'plainP1001'];

describe('errorHandler: safe error responses', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let loggerErrorSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation((() => logger) as any);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  describe('AC-1: safe mode hides details', () => {
    it.each(['production', '', 'staging', 'Development'])(
      'NODE_ENV=%j returns a generic 500 without stack or internals',
      async (nodeEnv) => {
        process.env.NODE_ENV = nodeEnv;
        expect(exposeErrorDetails()).toBe(false);

        const res = await hit('raw');

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ status: 500, message: 'Internal Server Error', requestId: 'req-1' });
        expect(res.body).not.toHaveProperty('stack');
        expect(res.text).not.toContain('db.example.internal');
        expect(res.text).not.toContain('x.service.ts');
      }
    );
  });

  describe('AC-2: detail mode', () => {
    it.each(['development', 'test'])('NODE_ENV=%j returns the raw message and stack', async (nodeEnv) => {
      process.env.NODE_ENV = nodeEnv;
      expect(exposeErrorDetails()).toBe(true);

      const res = await hit('raw');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe(RAW_MESSAGE);
      expect(typeof res.body.stack).toBe('string');
      expect(res.body.stack).toContain('db.example.internal');
    });
  });

  describe('AC-3: deliberate errors keep their message', () => {
    it('ApiError(404) keeps status and message in production', async () => {
      process.env.NODE_ENV = 'production';

      const res = await hit('notFound');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ status: 404, message: 'Course not found', requestId: 'req-1' });
    });
  });

  describe('AC-4: DB outage becomes 503', () => {
    it.each(DB_ERROR_KINDS)('%s returns 503 with a generic body in production', async (kind) => {
      process.env.NODE_ENV = 'production';

      const res = await hit(kind);

      expect(res.status).toBe(503);
      expect(res.body).toEqual({ status: 503, message: DB_UNAVAILABLE_MESSAGE, requestId: 'req-1' });
      expect(res.body.message).toBe('UniVibe is temporarily unavailable. Please try again shortly.');
      expect(res.text).not.toContain('db.example.internal');
    });

    it.each(DB_ERROR_KINDS)('%s returns 503 with a stack in test mode', async (kind) => {
      process.env.NODE_ENV = 'test';

      const res = await hit(kind);

      expect(res.status).toBe(503);
      expect(res.body.status).toBe(503);
      expect(res.body.message).toBe(DB_UNAVAILABLE_MESSAGE);
      expect(res.body.requestId).toBe('req-1');
      expect(typeof res.body.stack).toBe('string');
    });

    it('P2025 is not a DB outage: 500 Internal Server Error in production', async () => {
      process.env.NODE_ENV = 'production';

      const res = await hit('knownP2025');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ status: 500, message: 'Internal Server Error', requestId: 'req-1' });
      expect(res.text).not.toContain('db.example.internal');
    });

    it('isDbUnavailableError matches by name when instanceof fails', () => {
      const foreign = Object.assign(new Error('x'), { name: 'PrismaClientInitializationError' });
      expect(isDbUnavailableError(foreign)).toBe(true);
      expect(isDbUnavailableError({ errorCode: 'P1017' })).toBe(true);
      expect(isDbUnavailableError({ code: 'P2025' })).toBe(false);
      expect(isDbUnavailableError(undefined)).toBe(false);
      expect(isDbUnavailableError(null)).toBe(false);
    });
  });

  describe('AC-5: still logged server-side', () => {
    it('logs details through winston and one console.error line in production', async () => {
      process.env.NODE_ENV = 'production';

      const res = await hit('initP1001');
      expect(res.status).toBe(503);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      const [label, meta] = loggerErrorSpy.mock.calls[0];
      expect(label).toBe('Unhandled error');
      expect(meta).toEqual(
        expect.objectContaining({
          status: 503,
          requestId: 'req-1',
          code: 'P1001',
          message: expect.stringContaining('db.example.internal'),
          stack: expect.any(String),
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const args = consoleErrorSpy.mock.calls[0];
      expect(args).toHaveLength(1);
      const line = args[0];
      expect(typeof line).toBe('string');
      expect(line.startsWith('error ')).toBe(true);
      expect(line).toContain('requestId=req-1');
      expect(line).toContain('status=503');
      expect(line).toContain('db.example.internal');
    });

    it('does not print the extra console.error line in detail mode', async () => {
      process.env.NODE_ENV = 'test';

      await hit('initP1001');

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
