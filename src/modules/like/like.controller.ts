import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createLikeService } from './like.service';
import { contentType } from '@prisma/client';

// Generic like function for any content
export const likeContent = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }
  
  const { contentType: type, contentId } = req.params;
  
  // Validate content type
  if (!Object.values(contentType).includes(type as contentType)) {
    return res.status(400).json({
      status: 400,
      message: 'Invalid content type',
      requestId: (req as any).id,
    });
  }
  
  const service = createLikeService(prisma);
  
  try {
    const result = await service.likeContent(contentId, type as contentType, userId);
    res.status(201).json({
      message: `${type} liked successfully`,
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 404,
          message: error.message,
          requestId: (req as any).id,
        });
      }
      if (error.message === 'Content already liked') {
        return res.status(409).json({
          status: 409,
          message: `You have already liked this ${type.toLowerCase()}`,
          requestId: (req as any).id,
        });
      }
    }
    throw error;
  }
});

// Generic unlike function for any content  
export const unlikeContent = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }
  
  const { contentType: type, contentId } = req.params;
  
  // Validate content type
  if (!Object.values(contentType).includes(type as contentType)) {
    return res.status(400).json({
      status: 400,
      message: 'Invalid content type',
      requestId: (req as any).id,
    });
  }
  
  const service = createLikeService(prisma);
  
  try {
    const result = await service.unlikeContent(contentId, type as contentType, userId);
    res.status(200).json({
      message: `${type} unliked successfully`,
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 404,
          message: error.message,
          requestId: (req as any).id,
        });
      }
    }
    throw error;
  }
});

// Legacy guide-specific functions (for backward compatibility)
export const likeGuide = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }
  
  const { guideId } = req.params;
  const service = createLikeService(prisma);
  
  try {
    const result = await service.likeGuide(guideId, userId);
    res.status(201).json({
      message: 'Guide liked successfully',
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Guide not found') {
        return res.status(404).json({
          status: 404,
          message: 'Guide not found',
          requestId: (req as any).id,
        });
      }
      if (error.message === 'User not found') {
        return res.status(404).json({
          status: 404,
          message: 'User not found',
          requestId: (req as any).id,
        });
      }
      if (error.message === 'Guide already liked') {
        return res.status(409).json({
          status: 409,
          message: 'You have already liked this guide',
          requestId: (req as any).id,
        });
      }
    }
    throw error;
  }
});

// Unlike a guide item
export const unlikeGuide = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }
  
  const { guideId } = req.params;
  const service = createLikeService(prisma);
  
  try {
    const result = await service.unlikeGuide(guideId, userId);
    res.status(200).json({
      message: 'Guide unliked successfully',
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Guide not found') {
        return res.status(404).json({
          status: 404,
          message: 'Guide not found',
          requestId: (req as any).id,
        });
      }
      if (error.message === 'Like not found') {
        return res.status(404).json({
          status: 404,
          message: 'You have not liked this guide',
          requestId: (req as any).id,
        });
      }
    }
    throw error;
  }
});

// Get likes count for a guide
export const getGuideLikes = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const { guideId } = req.params;
  const service = createLikeService(prisma);
  
  try {
    const likesData = await service.getGuideLikes(guideId);
    res.status(200).json({
      data: likesData
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Guide not found') {
      return res.status(404).json({
        status: 404,
        message: 'Guide not found',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Check if user has liked a guide
export const checkUserLike = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }
  
  const { guideId } = req.params;
  const service = createLikeService(prisma);
  
  try {
    const hasLiked = await service.hasUserLikedGuide(guideId, userId);
    res.status(200).json({
      data: {
        hasLiked,
        guideId,
        userId
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Guide not found') {
      return res.status(404).json({
        status: 404,
        message: 'Guide not found',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Get users who liked a guide (for admin or detailed view)
export const getGuideLikers = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const { guideId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const service = createLikeService(prisma);
  
  try {
    const likers = await service.getGuideLikers(guideId, page, limit);
    res.status(200).json({
      data: likers
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Guide not found') {
      return res.status(404).json({
        status: 404,
        message: 'Guide not found',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Get user's liked guides
export const getUserLikedGuides = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      requestId: (req as any).id,
    });
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const service = createLikeService(prisma);
  
  try {
    const likedGuides = await service.getUserLikedGuides(userId, page, limit);
    res.status(200).json({
      data: likedGuides
    });
  } catch (error) {
    throw error;
  }
});
