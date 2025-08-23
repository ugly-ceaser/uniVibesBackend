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

// Seed sample guides for development/testing
export const seedSampleGuides = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createGuideService(prisma);
  const clearExisting = req.query.clear === 'true';
  
  try {
    const result = await service.seedSampleGuides(clearExisting);
    res.status(200).json({ 
      message: 'Sample guides seeded successfully',
      data: result
    });
  } catch (error) {
    throw error;
  }
});