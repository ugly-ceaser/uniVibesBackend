import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB cleanup...');
  
  // Delete course-related dependencies
  const delChatAnalytics = await prisma.chatAnalytics.deleteMany();
  console.log(`Deleted ${delChatAnalytics.count} ChatAnalytics records`);

  const delChatMessages = await prisma.chatMessage.deleteMany();
  console.log(`Deleted ${delChatMessages.count} ChatMessage records`);

  const delChatSessions = await prisma.chatSession.deleteMany();
  console.log(`Deleted ${delChatSessions.count} ChatSession records`);

  const delCourses = await prisma.course.deleteMany();
  console.log(`Deleted ${delCourses.count} Course records`);

  // Delete forum-related dependencies
  const delComments = await prisma.comment.deleteMany();
  console.log(`Deleted ${delComments.count} Comment records`);

  const delAnswers = await prisma.answer.deleteMany();
  console.log(`Deleted ${delAnswers.count} Answer records`);

  const delQuestions = await prisma.question.deleteMany();
  console.log(`Deleted ${delQuestions.count} Question (post) records`);

  const delForums = await prisma.forum.deleteMany();
  console.log(`Deleted ${delForums.count} Forum records`);

  console.log('Cleanup finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
