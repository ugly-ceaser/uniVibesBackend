import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { listGuide, getGuideItem } from './guide.controller';

export const createGuideRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');
  router.get('/', createCacheMiddleware(redis, { ttlSeconds: 300 }), listGuide);
  router.get('/:id', getGuideItem);
  return router;
}; 