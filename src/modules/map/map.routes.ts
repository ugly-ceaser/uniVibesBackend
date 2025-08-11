import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { listMapLocations, getMapLocation } from './map.controller';

export const createMapRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');
  router.get('/', createCacheMiddleware(redis, { ttlSeconds: 300 }), listMapLocations);
  router.get('/:id', getMapLocation);
  return router;
}; 