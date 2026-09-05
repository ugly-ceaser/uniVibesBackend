import { PrismaClient, NotificationType } from '@prisma/client';

export const createNotificationService = (prisma: PrismaClient) => ({
  listNotifications: async (userId: string, page = 1, pageSize = 20) => {
    const skip = (page - 1) * pageSize;
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  getUnreadCount: async (userId: string) => {
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });
    return { unreadCount };
  },

  markAsRead: async (userId: string, notificationId: string) => {
    const updated = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    return { success: updated.count > 0 };
  },

  markAllAsRead: async (userId: string) => {
    const updated = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { count: updated.count };
  },

  createNotification: async (data: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    targetUrl?: string;
  }) => {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        targetUrl: data.targetUrl,
      },
    });
  },
});
