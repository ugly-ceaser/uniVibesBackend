import { Application, Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { API_PREFIX } from '../utils/constants';
import { createAuthRouter } from './auth/auth.routes';
import { createCoursesRouter } from './courses/courses.routes';
import { createMapRouter } from './map/map.routes';
import { createForumRouter } from './forum/forum.routes';
import { createGuideRouter } from './guide/guide.routes';

export const registerRoutes = (app: Application, container: AwilixContainer) => {
  const api = Router();
  api.use('/auth', createAuthRouter());
  api.use('/courses', createCoursesRouter(container));
  api.use('/map', createMapRouter(container));
  api.use('/forum', createForumRouter(container));
  api.use('/guide', createGuideRouter(container));
  app.use(API_PREFIX, api);
}; 