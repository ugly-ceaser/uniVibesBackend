import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createNotificationService } from './notification.service';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error('Prisma client not found in request container');

  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

  const service = createNotificationService(prisma);
  const result = await service.listNotifications(userId, page, pageSize);

  res.status(200).json({ data: result });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error('Prisma client not found in request container');

  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }

  const service = createNotificationService(prisma);
  const result = await service.getUnreadCount(userId);

  res.status(200).json({ data: result });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error('Prisma client not found in request container');

  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }

  const { id } = req.params;
  const service = createNotificationService(prisma);
  const result = await service.markAsRead(userId, id);

  res.status(200).json({ data: result });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error('Prisma client not found in request container');

  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }

  const service = createNotificationService(prisma);
  const result = await service.markAllAsRead(userId);

  res.status(200).json({ data: result });
});
