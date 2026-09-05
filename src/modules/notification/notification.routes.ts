import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { requireAuth } from '../../middlewares/authMiddleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from './notification.controller';

export const createNotificationRouter = (container?: AwilixContainer) => {
  const router = Router();

  // Require auth for all notification routes
  router.use(requireAuth);

  router.get('/', getNotifications);
  router.get('/unread-count', getUnreadCount);
  router.patch('/read-all', markAllAsRead);
  router.patch('/:id/read', markAsRead);

  return router;
};
