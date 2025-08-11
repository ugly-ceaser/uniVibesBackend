import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createMapService } from './map.service';

export const listMapLocations = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
if (!prisma) {
  throw new Error("Prisma client not found in request container");
}
  const service = createMapService(prisma);
  const data = await service.list();
  res.status(200).json({ data });
});

export const getMapLocation = asyncHandler(async (req: Request, res: Response) => {
 const prisma = req.container?.cradle.prisma;
if (!prisma) {
  throw new Error("Prisma client not found in request container");
}
  const service = createMapService(prisma);
  const item = await service.getById(req.params.id);
  if (!item) return res.status(404).json({ status: 404, message: 'Location not found', requestId: (req as any).id });
  res.status(200).json({ data: item });
}); 