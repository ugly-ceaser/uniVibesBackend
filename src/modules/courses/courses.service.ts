import { PrismaClient, Course, Prisma } from '@prisma/client';

type CourseCreateInput = {
  name: string;
  code: string;
  level: string;
  coordinator: string;
  outline?: string | null;
  unitLoad: number;
  semester: number;
};

export const createCoursesService = (prisma: PrismaClient) => {
  return {
    list: async (filters?: {
      level?: string;
      semester?: number;
      outline?: string;
      name?: string;
    }): Promise<Course[]> => {
      const where: Prisma.CourseWhereInput = {};

      if (filters?.level?.trim()) {
        where.level = filters.level.trim();
      }
      if (typeof filters?.semester === 'number') {
        where.semester = filters.semester;
      }
      if (filters?.outline?.trim()) {
        where.outline = {
          contains: filters.outline.trim(),
          mode: 'insensitive',
        };
      }
      if (filters?.name?.trim()) {
        where.name = {
          contains: filters.name.trim(),
          mode: 'insensitive',
        };
      }

      return prisma.course.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    },

    getById: async (id: string): Promise<Course | null> => {
      return prisma.course.findUnique({ where: { id } });
    },

    create: async (data: CourseCreateInput): Promise<Course> => {
      return prisma.course.create({ data });
    },
  };
};
