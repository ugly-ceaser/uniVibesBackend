import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { requireAuth } from '../../middlewares/authMiddleware';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { 
  likeContent,
  unlikeContent,
  likeGuide, 
  unlikeGuide, 
  getGuideLikes, 
  checkUserLike, 
  getGuideLikers,
  getUserLikedGuides
} from './like.controller';

export const createLikeRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  // Generic like/unlike routes (require authentication)
  router.post('/:contentType/:contentId/like', requireAuth, likeContent);
  router.delete('/:contentType/:contentId/like', requireAuth, unlikeContent);
  
  // Legacy guide-specific routes (for backward compatibility)
  router.post('/guide/:guideId/like', requireAuth, likeGuide);
  router.delete('/guide/:guideId/like', requireAuth, unlikeGuide);
  
  // Check if user has liked a guide (require authentication)
  router.get('/guide/:guideId/check', requireAuth, checkUserLike);
  
  // Get user's liked guides (require authentication)
  router.get('/user/liked-guides', requireAuth, getUserLikedGuides);
  
  // Public routes (with caching)
  router.get('/guide/:guideId/count', createCacheMiddleware(redis, { ttlSeconds: 60 }), getGuideLikes);
  router.get('/guide/:guideId/likers', createCacheMiddleware(redis, { ttlSeconds: 120 }), getGuideLikers);

  return router;
};
