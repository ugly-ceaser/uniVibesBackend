import { PrismaClient } from '@prisma/client';

export const createGuideService = (prisma: PrismaClient) => {
  return {
    list: async () => {
      return prisma.guideItem.findMany({ orderBy: { title: 'asc' } });
    },
    getById: async (id: string) => {
      return prisma.guideItem.findUnique({ where: { id } });
    },
    likeGuide: async (id: string, userId: string) => {
      return prisma.guideItem.update({
        where: { id },
        data: {
          likes: {
            connect: { id: userId }
          }
        }
      });
    }
  };
}; 