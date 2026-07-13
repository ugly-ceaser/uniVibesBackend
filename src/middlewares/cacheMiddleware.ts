import { Request, Response, NextFunction } from 'express';
import type Redis from 'ioredis';

export type CacheOptions = {
  ttlSeconds?: number;
  key?: (req: Request) => string;
};

export const createCacheMiddleware = (redis: Redis, options: CacheOptions = {}) => {
  const ttl = options.ttlSeconds ?? 300;
  const keyBuilder = options.key ?? ((req) => `cache:${req.method}:${req.originalUrl}`);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    // Check if redis is connected/ready
    if (!redis || !redis.status || redis.status !== 'ready') {
      return next();
    }

    const key = keyBuilder(req);
    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(cached));
      }

      const json = res.json.bind(res);
      (res as any).json = async (body: any) => {
        try {
          if (redis.status === 'ready') {
            await redis.set(key, JSON.stringify(body), 'EX', ttl);
            res.setHeader('X-Cache', 'MISS-STORE');
          }
        } catch (_) {
          // ignore cache set errors
        }
        return json(body);
      };

      next();
    } catch (err) {
      return next();
    }
  };
};

export const invalidateCacheKeys = async (redis: Redis, patterns: string[]) => {
  if (!patterns.length) return;
  // If Redis is not connected/ready, skip invalidation gracefully
  if (!redis || !redis.status || redis.status !== 'ready') {
    return;
  }
  try {
    for (const pattern of patterns) {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } while (cursor !== '0');
    }
  } catch (err) {
    console.error('⚠️ Cache invalidation failed:', err instanceof Error ? err.message : err);
  }
}; 