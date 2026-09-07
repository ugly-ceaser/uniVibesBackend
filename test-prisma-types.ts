import { PrismaClient } from '@prisma/client';

// Test file to verify Prisma types
const prisma = new PrismaClient();

async function testCourseIdField() {
  // This should compile without errors if courseId field exists
  const chatSession = await prisma.chatSession.create({
    data: {
      studentId: 'test-student-id',
      courseId: 'test-course-id', // This should be valid if schema is correct
      title: 'Test Session'
    }
  });

  // This should also work
  const sessions = await prisma.chatSession.findMany({
    where: {
      studentId: 'test-student-id',
      courseId: 'test-course-id'
    }
  });

  console.log('Prisma types are working correctly!');
}

export { testCourseIdField };