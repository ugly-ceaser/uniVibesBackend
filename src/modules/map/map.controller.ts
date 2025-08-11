import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createMapService } from './map.service';
import { CreateLocationInput, UpdateLocationInput } from './map.model';

// Public: List approved map locations
export const listMapLocations = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  const data = await service.list();
  res.status(200).json({ data });
});

// Public: Get approved map location by ID
export const getMapLocation = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  const item = await service.getById(req.params.id);
  
  if (!item) {
    return res.status(404).json({ 
      status: 404, 
      message: 'Location not found', 
      requestId: (req as any).id 
    });
  }
  
  res.status(200).json({ data: item });
});

// User: Create new location (requires approval)
export const createMapLocation = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const { name, description, latitude, longitude } = req.body as CreateLocationInput;
  
  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      status: 400,
      message: 'Name, latitude, and longitude are required',
      requestId: (req as any).id,
    });
  }
  
  const service = createMapService(prisma);
  
  try {
    const location = await service.create({ name, description, latitude, longitude }, false);
    res.status(201).json({ 
      data: location,
      message: 'Location created successfully and is pending admin approval'
    });
  } catch (error) {
    if (error instanceof Error && ['Invalid latitude. Must be between -90 and 90.', 'Invalid longitude. Must be between -180 and 180.'].includes(error.message)) {
      return res.status(400).json({
        status: 400,
        message: error.message,
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Admin: Create location (auto-approved)
export const createMapLocationAdmin = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const { name, description, latitude, longitude } = req.body as CreateLocationInput;
  
  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      status: 400,
      message: 'Name, latitude, and longitude are required',
      requestId: (req as any).id,
    });
  }
  
  const service = createMapService(prisma);
  
  try {
    const location = await service.create({ name, description, latitude, longitude }, true);
    res.status(201).json({ 
      data: location,
      message: 'Location created and approved successfully'
    });
  } catch (error) {
    if (error instanceof Error && ['Invalid latitude. Must be between -90 and 90.', 'Invalid longitude. Must be between -180 and 180.'].includes(error.message)) {
      return res.status(400).json({
        status: 400,
        message: error.message,
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Admin: Update location
export const updateMapLocation = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const { name, description, latitude, longitude } = req.body as UpdateLocationInput;
  
  if (!name && !description && latitude === undefined && longitude === undefined) {
    return res.status(400).json({
      status: 400,
      message: 'At least one field is required',
      requestId: (req as any).id,
    });
  }
  
  const service = createMapService(prisma);
  
  try {
    const location = await service.update(req.params.id, { name, description, latitude, longitude });
    res.status(200).json({ data: location });
  } catch (error) {
    if (error instanceof Error && ['Location not found', 'Invalid latitude. Must be between -90 and 90.', 'Invalid longitude. Must be between -180 and 180.'].includes(error.message)) {
      if (error.message === 'Location not found') {
        return res.status(404).json({
          status: 404,
          message: 'Location not found',
          requestId: (req as any).id,
        });
      }
      return res.status(400).json({
        status: 400,
        message: error.message,
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Admin: Delete location
export const deleteMapLocation = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  
  try {
    await service.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Location not found') {
      return res.status(404).json({
        status: 404,
        message: 'Location not found',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Admin: List all locations (including pending approval)
export const listAllMapLocations = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  const data = await service.listAll();
  res.status(200).json({ data });
});

// Admin: Get any location by ID (including pending approval)
export const getMapLocationAdmin = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  const item = await service.getByIdAdmin(req.params.id);
  
  if (!item) {
    return res.status(404).json({ 
      status: 404, 
      message: 'Location not found', 
      requestId: (req as any).id 
    });
  }
  
  res.status(200).json({ data: item });
});

// Admin: Get pending locations for review
export const getPendingLocations = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  const data = await service.getPendingLocations();
  res.status(200).json({ data });
});

// Admin: Approve a location
export const approveLocation = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  
  try {
    const location = await service.approveLocation(req.params.id);
    res.status(200).json({ 
      data: location,
      message: 'Location approved successfully'
    });
  } catch (error) {
    if (error instanceof Error && ['Location not found', 'Location is already approved'].includes(error.message)) {
      if (error.message === 'Location not found') {
        return res.status(404).json({
          status: 404,
          message: 'Location not found',
          requestId: (req as any).id,
        });
      }
      return res.status(409).json({
        status: 409,
        message: 'Location is already approved',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
});

// Admin: Reject a location
export const rejectLocation = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  
  try {
    const location = await service.rejectLocation(req.params.id);
    res.status(200).json({ 
      data: location,
      message: 'Location rejected successfully'
    });
  } catch (error) {
    if (error instanceof Error && ['Location not found', 'Location is already rejected'].includes(error.message)) {
      if (error.message === 'Location not found') {
        return res.status(404).json({
          status: 404,
          message: 'Location not found',
          requestId: (req as any).id,
        });
      }
      return res.status(409).json({
        status: 409,
        message: 'Location is already rejected',
        requestId: (req as any).id,
      });
      }
    throw error;
  }
});

// Admin: Investigate a location
export const investigateLocation = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }
  
  const service = createMapService(prisma);
  
  try {
    const location = await service.investigateLocation(req.params.id);
    res.status(200).json({ 
      data: location,
      message: 'Location marked for investigation'
    });
  } catch (error) {
    if (error instanceof Error && ['Location not found', 'Location is already under investigation'].includes(error.message)) {
      if (error.message === 'Location not found') {
        return res.status(404).json({
          status: 404,
          message: 'Location not found',
          requestId: (req as any).id,
        });
      }
      return res.status(409).json({
        status: 409,
        message: 'Location is already under investigation',
        requestId: (req as any).id,
      });
    }
    throw error;
  }
}); 