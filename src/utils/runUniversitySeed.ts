import { PrismaClient } from '@prisma/client';
import { seedUniversityData } from './seedUniversityData';

const prisma = new PrismaClient();

async function main() {
  await seedUniversityData(prisma);

  const uniCount = await prisma.university.count();
  const courseCount = await prisma.course.count();
  const facultyCount = await prisma.faculty.count();
  const deptCount = await prisma.department.count();
  const programmeCount = await prisma.programme.count();

  console.log('\n📊 Seed Summary:');
  console.log(`  Universities : ${uniCount}`);
  console.log(`  Faculties    : ${facultyCount}`);
  console.log(`  Departments  : ${deptCount}`);
  console.log(`  Programmes   : ${programmeCount}`);
  console.log(`  Courses      : ${courseCount}`);
}

main()
  .then(() => { console.log('\n✅ Done!'); process.exit(0); })
  .catch((err) => { console.error('\n❌ Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
