import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { requireAuth, authorizeRoles } from '../../middlewares/authMiddleware';
import { 
  listGuide, 
  getGuideItem, 
  createGuideItem, 
  updateGuideItem, 
  deleteGuideItem,
  likeGuideItem,
  unlikeGuideItem,
  getGuideItemLikesCount
} from './guide.controller';

export const createGuideRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  // Public routes (with caching)
  router.get('/', createCacheMiddleware(redis, { ttlSeconds: 300 }), listGuide);
  router.get('/:id', createCacheMiddleware(redis, { ttlSeconds: 300 }), getGuideItem);
  router.get('/:id/likes/count', createCacheMiddleware(redis, { ttlSeconds: 60 }), getGuideItemLikesCount);

  // Protected routes (require authentication)
  router.post('/', requireAuth, createGuideItem);
  router.put('/:id', requireAuth, updateGuideItem);
  router.delete('/:id', requireAuth, authorizeRoles('ADMIN'), deleteGuideItem);
  
  // Likes functionality (require authentication)
  router.post('/:id/like', requireAuth, likeGuideItem);
  router.delete('/:id/like', requireAuth, unlikeGuideItem);

  return router;
}; 