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
    list: async (
      filters?: {
        level?: string;
        department?: string;
      },
      userLevel?: number,
      userDepartment?: string
    ): Promise<Course[]> => {
      // Ensure both department and level are present and compared as strings
      const department = (filters?.department ?? userDepartment ?? '').toString().trim();
      const level = (filters?.level ?? (userLevel !== undefined ? String(userLevel) : '')).toString().trim();

      // Debug log for filter values
      console.log('Course filter:', { department, level });

      if (!department || !level) {
        return [];
      }

      return prisma.course.findMany({
        where: {
          level,
          department,
        },
        orderBy: { name: 'asc' },
      });
    },

    getById: async (id: string): Promise<Course | null> => {
      return prisma.course.findUnique({ where: { id } });
    },

    create: async (data: CourseCreateInput): Promise<Course> => {
      if (!data) {
        throw new Error('Data must be empty');
      }
      return prisma.course.create({ data });
    },
  };
};
