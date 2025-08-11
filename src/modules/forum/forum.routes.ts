import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { attachUserIfPresent, requireAuth,authorizeRoles } from '../../middlewares/authMiddleware';
import { 
  listQuestions, 
  addQuestion, 
  addAnswer,
  fetchComments,
  postComment,
  createForum
} from './forum.controller';

export const createForumRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  // Questions
  router.get(
    '/questions',
    createCacheMiddleware(redis, { ttlSeconds: 300 }),
    listQuestions
  );
  router.post(
    '/questions',
    attachUserIfPresent,
    requireAuth,
    addQuestion
  );

  // Answers
  router.post(
    '/questions/:id/answers',
    attachUserIfPresent,
    requireAuth,
    addAnswer
  );

  // Comments
  router.get(
    '/answers/:answerId/comments',
    createCacheMiddleware(redis, { ttlSeconds: 120 }),
    fetchComments
  );
  router.post(
    '/comments',
    attachUserIfPresent,
    requireAuth,
    postComment
  );

  router.post(
  '/forums',
  attachUserIfPresent,
  requireAuth,
  authorizeRoles('ADMIN'),
  createForum
);

  return router;
};


