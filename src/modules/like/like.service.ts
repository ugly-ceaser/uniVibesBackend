import { PrismaClient, GuideItem, Likes, User, contentType, Prisma } from '@prisma/client';

// Helper function to validate content exists based on type
const validateContentExists = async (prisma: PrismaClient, contentId: string, type: contentType): Promise<void> => {
  switch (type) {
    case contentType.GuideItem:
      const guide = await prisma.guideItem.findUnique({ where: { id: contentId } });
      if (!guide) throw new Error('Guide not found');
      break;
    case contentType.Answer:
      const answer = await prisma.answer.findUnique({ where: { id: contentId } });
      if (!answer) throw new Error('Answer not found');
      break;
    case contentType.Comment:
      const comment = await prisma.comment.findUnique({ where: { id: contentId } });
      if (!comment) throw new Error('Comment not found');
      break;
    default:
      throw new Error('Invalid content type');
  }
};

// Helper function to update like count based on content type
const updateLikeCount = async (
  tx: Prisma.TransactionClient, 
  contentId: string, 
  type: contentType, 
  operation: 'increment' | 'decrement'
): Promise<any> => {
  const updateData = { likesCount: { [operation]: 1 } };
  
  switch (type) {
    case contentType.GuideItem:
      return await tx.guideItem.update({
        where: { id: contentId },
        data: updateData
      });
    case contentType.Answer:
      // Note: Answer model doesn't have likesCount in your schema
      // You might need to add it or handle differently
      throw new Error('Answer likes not yet implemented - add likesCount to Answer model');
    case contentType.Comment:
      // Note: Comment model doesn't have likesCount in your schema  
      // You might need to add it or handle differently
      throw new Error('Comment likes not yet implemented - add likesCount to Comment model');
    default:
      throw new Error('Invalid content type');
  }
};

interface LikeResult {
  guideItem: GuideItem;
  like: Likes;
}

interface LikesData {
  guideId: string;
  likesCount: number;
  guide: {
    id: string;
    title: string;
  };
}

interface GuideWithLiker {
  id: string;
  userId: string;
  user: {
    id: string;
    fullname: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface PaginatedLikers {
  likers: GuideWithLiker[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const createLikeService = (prisma: PrismaClient) => {
  return {
    // Generic like function for any content type
    likeContent: async (contentId: string, contentType: contentType, userId: string): Promise<LikeResult> => {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        if (!user) {
          throw new Error('User not found');
        }

        // Validate content exists based on type
        await validateContentExists(prisma, contentId, contentType);

        // Check if already liked
        const existingLike = await prisma.likes.findFirst({
          where: {
            contentId,
            userId,
            contentType
          }
        });
        if (existingLike) {
          throw new Error('Content already liked');
        }

        // Create like and update content likes count in transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const like = await tx.likes.create({
            data: {
              contentId,
              userId,
              contentType
            }
          });

          // Update like count based on content type
          const updatedContent = await updateLikeCount(tx, contentId, contentType, 'increment');
          
          return { guideItem: updatedContent, like };
        });

        return result;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to like content');
      }
    },

    // Generic unlike function for any content type
    unlikeContent: async (contentId: string, contentType: contentType, userId: string): Promise<GuideItem> => {
      try {
        // Validate content exists based on type
        await validateContentExists(prisma, contentId, contentType);

        // Find the like
        const existingLike = await prisma.likes.findFirst({
          where: {
            contentId,
            userId,
            contentType
          }
        });
        if (!existingLike) {
          throw new Error('Like not found');
        }

        // Remove like and update content likes count in transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.likes.delete({
            where: { id: existingLike.id }
          });

          const updatedContent = await updateLikeCount(tx, contentId, contentType, 'decrement');
          
          return updatedContent;
        });

        return result;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to unlike content');
      }
    },

    // Legacy guide-specific methods (for backward compatibility)
    likeGuide: async (guideId: string, userId: string): Promise<LikeResult> => {
      return await createLikeService(prisma).likeContent(guideId, contentType.GuideItem, userId);
    },

    unlikeGuide: async (guideId: string, userId: string): Promise<GuideItem> => {
      return await createLikeService(prisma).unlikeContent(guideId, contentType.GuideItem, userId);
    },

    // Get guide likes data
    getGuideLikes: async (guideId: string): Promise<LikesData> => {
      try {
        const guide = await prisma.guideItem.findUnique({
          where: { id: guideId },
          select: {
            id: true,
            title: true,
            likesCount: true
          }
        });
        if (!guide) {
          throw new Error('Guide not found');
        }

        return {
          guideId: guide.id,
          likesCount: guide.likesCount,
          guide: {
            id: guide.id,
            title: guide.title
          }
        };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to get guide likes');
      }
    },

    // Check if user has liked a guide
    hasUserLikedGuide: async (guideId: string, userId: string): Promise<boolean> => {
      try {
        // Check if guide exists
        const guide = await prisma.guideItem.findUnique({
          where: { id: guideId }
        });
        if (!guide) {
          throw new Error('Guide not found');
        }

        const like = await prisma.likes.findFirst({
          where: {
            contentId: guideId,
            userId: userId,
            contentType: contentType.GuideItem
          }
        });

        return !!like;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to check user like status');
      }
    },

    // Get users who liked a guide (paginated)
    getGuideLikers: async (guideId: string, page: number = 1, limit: number = 20): Promise<PaginatedLikers> => {
      try {
        // Check if guide exists
        const guide = await prisma.guideItem.findUnique({
          where: { id: guideId }
        });
        if (!guide) {
          throw new Error('Guide not found');
        }

        const offset = (page - 1) * limit;

        // Get total count
        const totalCount = await prisma.likes.count({
          where: {
            contentId: guideId,
            contentType: contentType.GuideItem
          }
        });

        // Get likes with user data
        const likes = await prisma.likes.findMany({
          where: {
            contentId: guideId,
            contentType: contentType.GuideItem
          },
          include: {
            user: {
              select: {
                id: true,
                fullname: true,
                email: true,
                avatarUrl: true
              }
            }
          },
          skip: offset,
          take: limit
        });

        const totalPages = Math.ceil(totalCount / limit);

        return {
          likers: likes.map(like => ({
            id: like.id,
            userId: like.userId!,
            user: like.user!
          })),
          totalCount,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to get guide likers');
      }
    },

    // Get user's liked guides
    getUserLikedGuides: async (userId: string, page: number = 1, limit: number = 20) => {
      try {
        const offset = (page - 1) * limit;

        const totalCount = await prisma.likes.count({
          where: {
            userId: userId,
            contentType: contentType.GuideItem
          }
        });

        const likes = await prisma.likes.findMany({
          where: {
            userId: userId,
            contentType: contentType.GuideItem
          },
          include: {
            // We can't directly join to GuideItem through contentId since it's a string
            // So we'll need to fetch guides separately or modify the query
          },
          skip: offset,
          take: limit
        });

        // Fetch the actual guide items
        const guideIds = likes.map(like => like.contentId);
        const guides = await prisma.guideItem.findMany({
          where: {
            id: { in: guideIds }
          }
        });

        // Combine the data
        const likedGuides = likes.map(like => ({
          likeId: like.id,
          guide: guides.find(guide => guide.id === like.contentId)
        })).filter(item => item.guide); // Filter out any null guides

        const totalPages = Math.ceil(totalCount / limit);

        return {
          likedGuides,
          totalCount,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        };
      } catch (error) {
        throw new Error('Failed to get user liked guides');
      }
    }
  };
};
