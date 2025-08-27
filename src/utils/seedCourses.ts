
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export async function seedCourses(prisma: PrismaClient) {
  const filePath = path.join(__dirname, 'courses_full.json');
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const courses = JSON.parse(fileData);
  await prisma.course.createMany({ data: courses });
  return courses.length;
}

export async function clearCourses(prisma: PrismaClient) {
  await prisma.course.deleteMany({});
}
