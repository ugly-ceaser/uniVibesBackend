import rateLimit, { MemoryStore } from 'express-rate-limit';
import type { Options, Store } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import type { AwilixContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';

/**
 * Builds a fresh store for a rate limiter.
 *
 * If redis is not ready yet, we will start with MemoryStore.
 * rate-limit-redis expects script loading to succeed immediately on initialization.
 * If Redis is offline, it will fail and crash. Thus, we fall back to MemoryStore immediately.
 *
 * Every limiter needs its own store instance: express-rate-limit rejects a store
 * shared between limiters (ERR_ERL_STORE_REUSE).
 */
const createLimiterStore = (container: AwilixContainer, prefix?: string): Store => {
  const redis = container.resolve('redis');

  if (redis && redis.status === 'ready') {
    try {
      return new RedisStore({
        sendCommand: async (...args: string[]) => {
          return await redis.call(args[0], ...args.slice(1));
        },
        ...(prefix ? { prefix } : {}),
      });
    } catch (err) {
      console.warn('⚠️ Failed to initialize RedisStore for rate limiter, falling back to MemoryStore:', err);
      return new MemoryStore();
    }
  }

  console.log('ℹ️ Redis is not ready. Using MemoryStore for rate limiting.');
  return new MemoryStore();
};

export const createRateLimiter = (container: AwilixContainer) => {
  const store = createLimiterStore(container);

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store,
  });
};

export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_RATE_LIMIT_MAX = 10;

export type AuthRateLimiterOptions = {
  windowMs?: number;
  max?: number;
};

const authLimitHandler = (req: Request, res: Response, _next: NextFunction, options: Options) => {
  const resetTime: Date | undefined = (req as any).rateLimit?.resetTime;
  const retryAfter =
    resetTime instanceof Date
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : Math.ceil(options.windowMs / 1000);

  res.status(429).json({
    status: 429,
    message: `Too many attempts. Try again in ${retryAfter} seconds.`,
    retryAfter,
    requestId: (req as any).id,
  });
};

/**
 * Stricter per-IP limiter for credential endpoints (login, register).
 * Create one instance and attach it to every route that should share the counter.
 */
export const createAuthRateLimiter = (container: AwilixContainer, options: AuthRateLimiterOptions = {}) => {
  const store = createLimiterStore(container, 'rl-auth:');

  return rateLimit({
    windowMs: options.windowMs ?? AUTH_RATE_LIMIT_WINDOW_MS,
    max: options.max ?? AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    handler: authLimitHandler,
  });
};
