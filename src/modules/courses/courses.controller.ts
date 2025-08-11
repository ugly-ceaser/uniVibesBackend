import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createCoursesService } from './courses.service';

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const filters = {
    level: req.query.level as string | undefined,
    semester: req.query.semester ? Number(req.query.semester) : undefined,
    outline: req.query.outline as string | undefined,
    name: req.query.name as string | undefined,
  };

  const service = createCoursesService(prisma);
  const data = await service.list(filters);

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
