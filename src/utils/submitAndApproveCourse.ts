import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Starting automatic submission & approval of CS305...');

  // 1. Find the first user in the database
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('No user found in the database. Please register/login in the app first.');
  }
  console.log(`👤 Found user: ${user.fullname} (${user.email})`);

  // 2. Find GOUNI university
  const uni = await prisma.university.findFirst({
    where: { shortName: 'GOUNI' }
  });
  if (!uni) throw new Error('GOUNI university not found in database');

  // 3. Find FACIT faculty
  const fac = await prisma.faculty.findFirst({
    where: { universityId: uni.id, name: { contains: 'Computing' } }
  });
  if (!fac) throw new Error('FACIT faculty not found');

  // 4. Find Computer Science & IT department
  const dept = await prisma.department.findFirst({
    where: { facultyId: fac.id, name: { contains: 'Computer Science' } }
  });
  if (!dept) throw new Error('Computer Science & IT department not found');

  // 5. Find Software Engineering programme
  const prog = await prisma.programme.findFirst({
    where: { departmentId: dept.id, name: { contains: 'Software Engineering' } }
  });
  if (!prog) throw new Error('Software Engineering programme not found');

  // 6. Find Level 100
  const level = await prisma.level.findFirst({
    where: { programmeId: prog.id, level: 100 }
  });
  if (!level) throw new Error('Level 100 not found');

  // 7. Find First Semester
  const sem = await prisma.semester.findFirst({
    where: { programmeId: prog.id, name: { contains: 'First' } }
  });
  if (!sem) throw new Error('First Semester not found');

  // 8. Create CourseSubmission (PENDING)
  console.log('📝 Creating course submission for CS305...');
  const sub = await prisma.courseSubmission.create({
    data: {
      submittedBy: user.id,
      universityId: uni.id,
      facultyId: fac.id,
      departmentId: dept.id,
      programmeId: prog.id,
      levelId: level.id,
      semesterId: sem.id,
      courseCode: 'CS305',
      title: 'Data Structure and Algorithm',
      creditUnit: 3,
      note: 'Added automatically for testing',
      status: 'PENDING',
    }
  });
  console.log(`✅ Created pending submission with ID: ${sub.id}`);

  // 9. Approve the submission
  console.log('⚙️ Approving course submission...');
  await prisma.$transaction(async (tx) => {
    // Create official course and connect user to enrolledCourses
    const course = await tx.course.create({
      data: {
        universityId: sub.universityId,
        facultyId: sub.facultyId,
        departmentId: sub.departmentId,
        programmeId: sub.programmeId,
        levelId: sub.levelId,
        semesterId: sub.semesterId,
        courseCode: sub.courseCode,
        title: sub.title,
        creditUnit: sub.creditUnit,
        courseType: 'Core',
        status: 'ACTIVE',
        enrolledStudents: {
          connect: { id: user.id }
        }
      },
    });

    // Update submission status to APPROVED
    await tx.courseSubmission.update({
      where: { id: sub.id },
      data: { status: 'APPROVED', updatedAt: new Date() },
    });

    // Create audit log
    await tx.courseAuditLog.create({
      data: {
        actorId: user.id,
        action: 'APPROVE_SUBMISSION',
        newValue: { submissionId: sub.id, courseCode: sub.courseCode, title: sub.title },
      },
    });

    // Create initial course version
    await tx.courseVersion.create({
      data: {
        courseId: course.id,
        revision: 1,
        title: course.title,
        creditUnit: course.creditUnit,
        courseType: course.courseType,
        outline: [],
      },
    });

    console.log(`🎉 Submission successfully approved! Connected user ${user.fullname} to course ${course.courseCode}.`);
  });
}

main()
  .catch((err) => {
    console.error('❌ Failed:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
