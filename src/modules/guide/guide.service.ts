import { PrismaClient, GuideItem, Likes, contentType, Prisma } from '@prisma/client';
import { CreateGuideInput, UpdateGuideInput } from './guide.model';

export const createGuideService = (prisma: PrismaClient) => {
  return {
    list: async (): Promise<GuideItem[]> => {
      try {
        return await prisma.guideItem.findMany({ 
          orderBy: { createdAt: 'desc' },
          where: { status: 'Cleared' }
        });
      } catch (error) {
        throw new Error('Failed to fetch guide items');
      }
    },

    getById: async (id: string): Promise<GuideItem | null> => {
      try {
        return await prisma.guideItem.findUnique({ 
          where: { id },
          include: {
            // Note: The schema doesn't show a direct relation to Likes
            // This would need to be added to the schema if you want to include likes
          }
        });
      } catch (error) {
        throw new Error('Failed to fetch guide item');
      }
    },

    create: async (input: CreateGuideInput): Promise<GuideItem> => {
      try {
        return await prisma.guideItem.create({
          data: {
            title: input.title,
            content: input.content,
            status: 'Cleared',
            likesCount: 0
          }
        });
      } catch (error) {
        throw new Error('Failed to create guide item');
      }
    },

    update: async (id: string, input: UpdateGuideInput): Promise<GuideItem> => {
      try {
        const existing = await prisma.guideItem.findUnique({ where: { id } });
        if (!existing) {
          throw new Error('Guide item not found');
        }

        return await prisma.guideItem.update({
          where: { id },
          data: input
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Guide item not found') {
          throw error;
        }
        throw new Error('Failed to update guide item');
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const existing = await prisma.guideItem.findUnique({ where: { id } });
        if (!existing) {
          throw new Error('Guide item not found');
        }

        await prisma.guideItem.delete({ where: { id } });
      } catch (error) {
        if (error instanceof Error && error.message === 'Guide item not found') {
          throw error;
        }
        throw new Error('Failed to delete guide item');
      }
    },

    likeGuide: async (guideId: string, userId: string): Promise<{ guideItem: GuideItem; like: Likes }> => {
      try {
        // Check if guide item exists
        const guideItem = await prisma.guideItem.findUnique({ where: { id: guideId } });
        if (!guideItem) {
          throw new Error('Guide item not found');
        }

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new Error('User not found');
        }

        // Check if already liked
        const existingLike = await prisma.likes.findFirst({
          where: {
            userId,
            contentType: 'GuideItem'
          }
        });

        if (existingLike) {
          throw new Error('Guide item already liked by this user');
        }

        // Use transaction to ensure data consistency
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Create the like record
          const like = await tx.likes.create({
            data: {
              contentType: 'GuideItem',
              userId
            }
          });

          // Update the guide item's likes count
          const updatedGuideItem = await tx.guideItem.update({
            where: { id: guideId },
            data: {
              likesCount: {
                increment: 1
              }
            }
          });

          return { guideItem: updatedGuideItem, like };
        });
      } catch (error) {
        if (error instanceof Error && ['Guide item not found', 'User not found', 'Guide item already liked by this user'].includes(error.message)) {
          throw error;
        }
        throw new Error('Failed to like guide item');
      }
    },

    unlikeGuide: async (guideId: string, userId: string): Promise<GuideItem> => {
      try {
        // Check if guide item exists
        const guideItem = await prisma.guideItem.findUnique({ where: { id: guideId } });
        if (!guideItem) {
          throw new Error('Guide item not found');
        }

        // Find and delete the like record
        const existingLike = await prisma.likes.findFirst({
          where: {
            userId,
            contentType: 'GuideItem'
          }
        });

        if (!existingLike) {
          throw new Error('Guide item not liked by this user');
        }

        // Use transaction to ensure data consistency
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Delete the like record
          await tx.likes.delete({
            where: { id: existingLike.id }
          });

          // Update the guide item's likes count
          return await tx.guideItem.update({
            where: { id: guideId },
            data: {
              likesCount: {
                decrement: 1
              }
            }
          });
        });
      } catch (error) {
        if (error instanceof Error && ['Guide item not found', 'Guide item not liked by this user'].includes(error.message)) {
          throw error;
        }
        throw new Error('Failed to unlike guide item');
      }
    },

    getLikesCount: async (guideId: string): Promise<number> => {
      try {
        const guideItem = await prisma.guideItem.findUnique({ 
          where: { id: guideId },
          select: { likesCount: true }
        });
        
        if (!guideItem) {
          throw new Error('Guide item not found');
        }

        return guideItem.likesCount;
      } catch (error) {
        if (error instanceof Error && error.message === 'Guide item not found') {
          throw error;
        }
        throw new Error('Failed to get likes count');
      }
    }
  };
}; 