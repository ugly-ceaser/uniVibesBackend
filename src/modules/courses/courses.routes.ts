import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { attachUserIfPresent, requireAuth, authorizeRoles } from '../../middlewares/authMiddleware';
import { listCourses, getCourse, createCourse } from './courses.controller';

export const createCoursesRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  /**
   * Helper to build a unique cache key that includes query params
   * e.g. /courses?level=200&semester=1
   */
  const cacheKeyBuilder = (req: any) => {
    const queryString = new URLSearchParams(req.query).toString();
    return `courses:${queryString || 'all'}`;
  };

  // Admin-only route to create a course
  router.post(
    '/',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles('ADMIN'),
    createCourse
  );

  // Public route with caching & query-based filters
  router.get(
    '/',
    createCacheMiddleware(redis, { ttlSeconds: 300 }),
    attachUserIfPresent,
    requireAuth,
    authorizeRoles('ADMIN', 'STUDENT'),
    listCourses
  );

  // Public route to get a course by ID
  router.get('/:id',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles('ADMIN', 'STUDENT'),
     getCourse);

  return router;
};
