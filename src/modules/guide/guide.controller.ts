import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createGuideService } from './guide.service';
import { CreateGuideInput, UpdateGuideInput } from './guide.model';

// List all guide items
export const listGuide = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createGuideService(prisma);
  const data = await service.list();
  res.status(200).json({ data });
});

// Get a specific guide item by ID
export const getGuideItem = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createGuideService(prisma);
  const item = await service.getById(req.params.id);
  
  if (!item) {
    return res.status(404).json({ 
      status: 404, 
      message: 'Guide item not found', 
      requestId: (req as any).id 
    });
  }
  
  res.status(200).json({ data: item });
});

// Create a new guide item
export const createGuideItem = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const { title, content } = req.body as CreateGuideInput;
  
  if (!title || !content) {
    return res.status(400).json({
      status: 400,
      message: 'Title and content are required',
      requestId: (req as any).id,
    });
  }
  
  const service = createGuideService(prisma);
  const guideItem = await service.create({ title, content });
  
  res.status(201).json({ data: guideItem });
});

// Update an existing guide item
export const updateGuideItem = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const { title, content } = req.body as UpdateGuideInput;
  
  if (!title && !content) {
    return res.status(400).json({
      status: 400,
      message: 'At least one field (title or content) is required',
      requestId: (req as any).id,
    });
  }
  
  const service = createGuideService(prisma);
  
  try {
    const guideItem = await service.update(req.params.id, { title, content });
    res.status(200).json({ data: guideItem });
  } catch (error) {
    if (error instanceof Error && error.message === 'Guide item not found') {
      return res.status(404).json({
        status: 404,
        message: 'Guide item not found',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Delete a guide item
export const deleteGuideItem = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createGuideService(prisma);
  
  try {
    await service.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Guide item not found') {
      return res.status(404).json({
        status: 404,
        message: 'Guide item not found',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Like a guide item
export const likeGuideItem = asyncHandler(async (req: Request, res: Response) => {
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
  
  const service = createGuideService(prisma);
  
  try {
    const result = await service.likeGuide(req.params.id, userId);
    res.status(200).json({ 
      data: { 
        guideItem: result.guideItem, 
        like: result.like 
      } 
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Guide item not found') {
        return res.status(404).json({
          status: 404,
          message: 'Guide item not found',
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
      if (error.message === 'Guide item already liked by this user') {
        return res.status(409).json({
          status: 409,
          message: 'Guide item already liked by this user',
          requestId: (req as any).id,
        });
      }
    }
    throw error;
  }
});

// Unlike a guide item
export const unlikeGuideItem = asyncHandler(async (req: Request, res: Response) => {
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
  
  const service = createGuideService(prisma);
  
  try {
    const guideItem = await service.unlikeGuide(req.params.id, userId);
    res.status(200).json({ data: guideItem });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Guide item not found') {
        return res.status(404).json({
          status: 404,
          message: 'Guide item not found',
          requestId: (req as any).id,
        });
      }
      if (error.message === 'Guide item not liked by this user') {
        return res.status(409).json({
          status: 409,
          message: 'Guide item not liked by this user',
          requestId: (req as any).id,
        });
      }
    }
    throw error;
  }
});

// Get likes count for a guide item
export const getGuideItemLikesCount = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createGuideService(prisma);
  
  try {
    const likesCount = await service.getLikesCount(req.params.id);
    res.status(200).json({ data: { likesCount } });
  } catch (error) {
    if (error instanceof Error && error.message === 'Guide item not found') {
      return res.status(404).json({
        status: 404,
        message: 'Guide item not found',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
}); 