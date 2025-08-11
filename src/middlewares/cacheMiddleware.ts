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
          await redis.set(key, JSON.stringify(body), 'EX', ttl);
          res.setHeader('X-Cache', 'MISS-STORE');
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
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(keys);
    }
  }
}; 