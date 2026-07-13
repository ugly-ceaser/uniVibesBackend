import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Approving all PENDING course submissions...');
  
  const pendingSubmissions = await prisma.courseSubmission.findMany({
    where: { status: 'PENDING' }
  });

  if (pendingSubmissions.length === 0) {
    console.log('ℹ️ No pending course submissions found.');
    return;
  }

  console.log(`📋 Found ${pendingSubmissions.length} pending submissions.`);

  for (const sub of pendingSubmissions) {
    console.log(`⚙️ Processing course: ${sub.courseCode} - ${sub.title}`);
    try {
      // Find actorId (either the submitter, or fallback to any user)
      let actorId = sub.submittedBy;
      if (!actorId) {
        const firstUser = await prisma.user.findFirst();
        if (!firstUser) {
          throw new Error('No user found in database to act as approval actor');
        }
        actorId = firstUser.id;
      }

      await prisma.$transaction(async (tx) => {
        // 1. Create official course
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
              connect: { id: actorId }
            }
          },
        });

        // 2. Update submission status to APPROVED
        await tx.courseSubmission.update({
          where: { id: sub.id },
          data: { status: 'APPROVED', updatedAt: new Date() },
        });

        // 3. Create audit log
        await tx.courseAuditLog.create({
          data: {
            actorId,
            action: 'APPROVE_SUBMISSION',
            newValue: { submissionId: sub.id, courseCode: sub.courseCode, title: sub.title },
          },
        });

        // 4. Create initial course version
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
      });

      console.log(`✅ Approved and created course: ${sub.courseCode}`);
    } catch (error: any) {
      console.error(`❌ Failed to approve submission ${sub.id} (${sub.courseCode}):`, error.message);
    }
  }

  console.log('🎉 Done processing all submissions!');
}

main()
  .catch((err) => {
    console.error('❌ Run failed:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
