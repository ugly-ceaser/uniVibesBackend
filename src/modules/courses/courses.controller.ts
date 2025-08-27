import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createCoursesService } from './courses.service';

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createCoursesService(prisma);
  const userLevel = (req as any).user?.level as number | undefined;
  const userDepartment = (req as any).user?.department as string | undefined;

  console.log('User object:', (req as any).user);

  // Only filter by user's department and level unless overridden by query
  const filters: any = {};
  if (req.query.level) filters.level = req.query.level as string;
  if (req.query.department) filters.department = req.query.department as string;

  // If no explicit filter, use user's department and level
  const data = await service.list(filters, userLevel, userDepartment);
  res.status(200).json({ data });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createCoursesService(prisma);
  const course = await service.getById(req.params.id);

  if (!course) {
    return res.status(404).json({
      status: 404,
      message: 'Course not found',
      requestId: (req as any).id,
    });
  }

  res.status(200).json({ data: course });
});

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const { name, coordinator, outline, unitLoad, semester, code, level } = req.body;

  if (!name || !coordinator || unitLoad == null || semester == null) {
    return res.status(400).json({
      status: 400,
      message: "Missing required fields: name, coordinator, unitLoad, semester",
      requestId: (req as any).id,
    });
  }

  const service = createCoursesService(prisma);
  const course = await service.create({
    name,
    code: code ?? null,
    level: level ?? null,
    coordinator,
    outline: outline ?? null,
    unitLoad: Number(unitLoad),
    semester: Number(semester),
  });

  res.status(201).json({ data: course });
});
