import rateLimit, { MemoryStore } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import type { AwilixContainer } from 'awilix';

export const createRateLimiter = (container: AwilixContainer) => {
  const redis = container.resolve('redis');

  // If redis is not ready yet, we will start with MemoryStore.
  // rate-limit-redis expects script loading to succeed immediately on initialization.
  // If Redis is offline, it will fail and crash. Thus, we fall back to MemoryStore immediately.
  let store: any;

  if (redis && redis.status === 'ready') {
    try {
      store = new RedisStore({
        sendCommand: async (...args: string[]) => {
          return await redis.call(args[0], ...args.slice(1));
        },
      });
    } catch (err) {
      console.warn('⚠️ Failed to initialize RedisStore for rate limiter, falling back to MemoryStore:', err);
      store = new MemoryStore();
    }
  } else {
    console.log('ℹ️ Redis is not ready. Using MemoryStore for rate limiting.');
    store = new MemoryStore();
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store,
  });
}; 