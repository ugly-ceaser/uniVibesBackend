import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullname: true,
      username: true,
    }
  });
  console.log('--- Users ---');
  console.log(JSON.stringify(users, null, 2));

  const questions = await prisma.question.findMany({
    select: {
      id: true,
      title: true,
      authorId: true,
      status: true,
    }
  });
  console.log('--- Questions ---');
  console.log(JSON.stringify(questions, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
