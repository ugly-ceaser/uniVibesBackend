import { PrismaClient, Course, CourseSubmission } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CourseListFilters = {
  universityId?: string;
  facultyId?: string;
  departmentId?: string;
  programmeId?: string;
  levelId?: string;
  semesterId?: string;
  status?: string;
};

export type SubmitCourseInput = {
  universityId: string;
  facultyId: string;
  departmentId: string;
  programmeId: string;
  levelId: string;
  semesterId: string;
  courseCode: string;
  title: string;
  creditUnit: number;
  note?: string;
};

export type ApproveSubmissionInput = {
  submissionId: string;
  actorId: string;
  courseType?: string;
};

export type RejectSubmissionInput = {
  submissionId: string;
  actorId: string;
  reason?: string;
};

// ─── University Browser Service ──────────────────────────────────────────────

export const createUniversityBrowserService = (prisma: PrismaClient) => {
  return {
    listUniversities: async (country?: string, state?: string) => {
      return prisma.university.findMany({
        where: {
          status: 'ACTIVE',
          ...(country ? { country } : {}),
          ...(state ? { state } : {}),
        },
        select: { id: true, name: true, shortName: true, country: true, state: true, logo: true },
        orderBy: { name: 'asc' },
      });
    },

    getFacultiesByUniversity: async (universityId: string) => {
      return prisma.faculty.findMany({
        where: { universityId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    },

    getDepartmentsByFaculty: async (facultyId: string) => {
      return prisma.department.findMany({
        where: { facultyId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    },

    getProgrammesByDepartment: async (departmentId: string) => {
      return prisma.programme.findMany({
        where: { departmentId },
        select: { id: true, name: true, degreeType: true },
        orderBy: { name: 'asc' },
      });
    },

    getLevelsByProgramme: async (programmeId: string) => {
      return prisma.level.findMany({
        where: { programmeId },
        select: { id: true, level: true },
        orderBy: { level: 'asc' },
      });
    },

    getSemestersByProgramme: async (programmeId: string) => {
      return prisma.semester.findMany({
        where: { programmeId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    },
  };
};

// ─── Course Query Service ─────────────────────────────────────────────────────

export const createCourseQueryService = (prisma: PrismaClient) => {
  return {
    listCourses: async (filters: CourseListFilters): Promise<Course[]> => {
      const where: any = { status: 'ACTIVE' };
      if (filters.universityId) where.universityId = filters.universityId;
      if (filters.facultyId) where.facultyId = filters.facultyId;
      if (filters.departmentId) where.departmentId = filters.departmentId;
      if (filters.programmeId) where.programmeId = filters.programmeId;
      if (filters.levelId) where.levelId = filters.levelId;
      if (filters.semesterId) where.semesterId = filters.semesterId;

      return prisma.course.findMany({
        where,
        include: {
          university: { select: { name: true, shortName: true } },
          faculty: { select: { name: true } },
          department: { select: { name: true } },
          programme: { select: { name: true, degreeType: true } },
          level: { select: { level: true } },
          semester: { select: { name: true } },
        },
        orderBy: { courseCode: 'asc' },
      });
    },

    getCourseById: async (id: string) => {
      return prisma.course.findUnique({
        where: { id },
        include: {
          university: { select: { name: true, shortName: true } },
          faculty: { select: { name: true } },
          department: { select: { name: true } },
          programme: { select: { name: true, degreeType: true } },
          level: { select: { level: true } },
          semester: { select: { name: true } },
          versions: { orderBy: { revision: 'desc' }, take: 1 },
        },
      });
    },

    searchCourses: async (query: string, universityId?: string) => {
      return prisma.course.findMany({
        where: {
          status: 'ACTIVE',
          ...(universityId ? { universityId } : {}),
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { courseCode: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          university: { select: { shortName: true } },
          level: { select: { level: true } },
          semester: { select: { name: true } },
        },
        take: 20,
      });
    },

    listSelectedCourses: async (userId: string): Promise<Course[]> => {
      // 1. Get the user's profile details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          enrolledCourses: {
            where: { status: 'ACTIVE' },
            include: {
              university: { select: { name: true, shortName: true } },
              faculty: { select: { name: true } },
              department: { select: { name: true } },
              programme: { select: { name: true, degreeType: true } },
              level: { select: { level: true } },
              semester: { select: { name: true } },
            },
            orderBy: { courseCode: 'asc' },
          },
        },
      });

      if (!user) return [];

      const uniName = user.university?.trim();
      const facName = user.faculty?.trim();
      const deptName = user.department?.trim();

      if (uniName && facName && deptName) {
        try {
          // Resolve university
          const unis = await prisma.university.findMany({ where: { status: 'ACTIVE' } });
          const matchedUni = unis.find((u: any) =>
            u.name.toLowerCase().includes(uniName.toLowerCase()) ||
            uniName.toLowerCase().includes(u.name.toLowerCase()) ||
            u.shortName.toLowerCase().includes(uniName.toLowerCase()) ||
            uniName.toLowerCase().includes(u.shortName.toLowerCase())
          );

          if (matchedUni) {
            // Resolve faculty
            const facs = await prisma.faculty.findMany({ where: { universityId: matchedUni.id } });
            const matchedFac = facs.find((f: any) =>
              f.name.toLowerCase().includes(facName.toLowerCase()) ||
              facName.toLowerCase().includes(f.name.toLowerCase())
            );

            if (matchedFac) {
              // Resolve department & programme
              const depts = await prisma.department.findMany({ where: { facultyId: matchedFac.id } });
              let matchedDept = depts.find((d: any) =>
                d.name.toLowerCase().includes(deptName.toLowerCase()) ||
                deptName.toLowerCase().includes(d.name.toLowerCase())
              );
              let matchedProg = null;

              if (matchedDept) {
                const progs = await prisma.programme.findMany({ where: { departmentId: matchedDept.id } });
                matchedProg = progs.find((p: any) =>
                  p.name.toLowerCase().includes(deptName.toLowerCase()) ||
                  deptName.toLowerCase().includes(p.name.toLowerCase())
                ) || progs[0];
              } else {
                for (const dept of depts) {
                  const progs = await prisma.programme.findMany({ where: { departmentId: dept.id } });
                  const foundProg = progs.find((p: any) =>
                    p.name.toLowerCase().includes(deptName.toLowerCase()) ||
                    deptName.toLowerCase().includes(p.name.toLowerCase())
                  );
                  if (foundProg) {
                    matchedDept = dept;
                    matchedProg = foundProg;
                    break;
                  }
                }
              }

              if (matchedDept && matchedProg) {
                // Resolve level
                const lvls = await prisma.level.findMany({ where: { programmeId: matchedProg.id } });
                const matchedLvl = lvls.find((l: any) => l.level === Number(user.level));

                // Resolve semester
                const sems = await prisma.semester.findMany({ where: { programmeId: matchedProg.id } });
                const matchedSem = sems.find((s: any) =>
                  s.name.toLowerCase().includes(user.semester?.toLowerCase() || '')
                );

                if (matchedLvl && matchedSem) {
                  // Find all active matching courses
                  const matchingCourses = await prisma.course.findMany({
                    where: {
                      universityId: matchedUni.id,
                      facultyId: matchedFac.id,
                      departmentId: matchedDept.id,
                      programmeId: matchedProg.id,
                      levelId: matchedLvl.id,
                      semesterId: matchedSem.id,
                      status: 'ACTIVE'
                    }
                  });

                  // Enroll user in any matching courses they are not enrolled in yet
                  const enrolledIds = new Set(user.enrolledCourses.map((c: any) => c.id));
                  const toEnroll = matchingCourses.filter((c: any) => !enrolledIds.has(c.id));

                  if (toEnroll.length > 0) {
                    await prisma.user.update({
                      where: { id: userId },
                      data: {
                        enrolledCourses: {
                          connect: toEnroll.map((c: any) => ({ id: c.id }))
                        }
                      }
                    });

                    // Fetch the updated enrolled courses
                    const updatedUser = await prisma.user.findUnique({
                      where: { id: userId },
                      select: {
                        enrolledCourses: {
                          where: { status: 'ACTIVE' },
                          include: {
                            university: { select: { name: true, shortName: true } },
                            faculty: { select: { name: true } },
                            department: { select: { name: true } },
                            programme: { select: { name: true, degreeType: true } },
                            level: { select: { level: true } },
                            semester: { select: { name: true } },
                          },
                          orderBy: { courseCode: 'asc' },
                        }
                      }
                    });
                    return updatedUser?.enrolledCourses ?? [];
                  }
                }
              }
            }
          }
        } catch (err) {
          // ignore error
        }
      }

      return user.enrolledCourses;
    },

    selectCourse: async (userId: string, courseId: string) => {
      return prisma.user.update({
        where: { id: userId },
        data: {
          enrolledCourses: {
            connect: { id: courseId },
          },
        },
      });
    },

    unselectCourse: async (userId: string, courseId: string) => {
      return prisma.user.update({
        where: { id: userId },
        data: {
          enrolledCourses: {
            disconnect: { id: courseId },
          },
        },
      });
    },
  };
};

// ─── Course Submission Service ────────────────────────────────────────────────

export const createCourseSubmissionService = (prisma: PrismaClient) => {
  return {
    /**
     * Smart submit: checks for existing Course first, then existing Submission.
     * If submission exists, increment supportCount instead of creating duplicate.
     */
    submit: async (submittedBy: string, input: SubmitCourseInput) => {
      // 1. Check if course already exists officially
      const existingCourse = await prisma.course.findFirst({
        where: {
          programmeId: input.programmeId,
          levelId: input.levelId,
          semesterId: input.semesterId,
          courseCode: input.courseCode.trim().toUpperCase(),
        },
      });
      if (existingCourse) {
        // Automatically enroll the user in the existing course
        const isEnrolled = await prisma.user.findFirst({
          where: {
            id: submittedBy,
            enrolledCourses: { some: { id: existingCourse.id } }
          }
        });
        if (!isEnrolled) {
          await prisma.user.update({
            where: { id: submittedBy },
            data: {
              enrolledCourses: { connect: { id: existingCourse.id } }
            }
          });
        }
        return {
          type: 'ALREADY_EXISTS' as const,
          data: existingCourse,
          message: 'This course already exists and has been added to your dashboard.',
        };
      }

      // 2. Check if a pending submission already exists
      const existingSubmission = await prisma.courseSubmission.findFirst({
        where: {
          programmeId: input.programmeId,
          levelId: input.levelId,
          semesterId: input.semesterId,
          courseCode: input.courseCode.trim().toUpperCase(),
          status: { in: ['PENDING', 'UNDER_REVIEW'] },
        },
      });

      if (existingSubmission) {
        // Check if this user already supported
        const alreadySupported = await prisma.courseSubmissionSupport.findUnique({
          where: {
            submissionId_studentId: {
              submissionId: existingSubmission.id,
              studentId: submittedBy,
            },
          },
        });

        if (alreadySupported) {
          return {
            type: 'ALREADY_SUPPORTED' as const,
            data: existingSubmission,
            message: 'You have already supported this course submission.',
          };
        }

        // Increment supportCount + add support record
        const [updated] = await prisma.$transaction([
          prisma.courseSubmission.update({
            where: { id: existingSubmission.id },
            data: { supportCount: { increment: 1 } },
          }),
          prisma.courseSubmissionSupport.create({
            data: { submissionId: existingSubmission.id, studentId: submittedBy },
          }),
        ]);

        return {
          type: 'SUPPORTED' as const,
          data: updated,
          message: `You have supported this course request. Total supporters: ${existingSubmission.supportCount + 1}`,
        };
      }

      // 3. Create a fresh submission
      const submission = await prisma.courseSubmission.create({
        data: {
          submittedBy,
          universityId: input.universityId,
          facultyId: input.facultyId,
          departmentId: input.departmentId,
          programmeId: input.programmeId,
          levelId: input.levelId,
          semesterId: input.semesterId,
          courseCode: input.courseCode.trim().toUpperCase(),
          title: input.title.trim(),
          creditUnit: input.creditUnit,
          note: input.note,
          status: 'PENDING',
          supportCount: 1,
          supports: {
            create: { studentId: submittedBy },
          },
        },
      });

      return {
        type: 'CREATED' as const,
        data: submission,
        message: 'Course submission received. It will be reviewed by moderators.',
      };
    },

    listPendingSubmissions: async (filters?: {
      universityId?: string;
      facultyId?: string;
      departmentId?: string;
      status?: string;
    }) => {
      const where: any = { status: filters?.status ?? 'PENDING' };
      if (filters?.universityId) where.universityId = filters.universityId;
      if (filters?.facultyId) where.facultyId = filters.facultyId;
      if (filters?.departmentId) where.departmentId = filters.departmentId;

      return prisma.courseSubmission.findMany({
        where,
        include: {
          submitter: { select: { id: true, username: true, fullname: true } },
          university: { select: { name: true, shortName: true } },
          faculty: { select: { name: true } },
          department: { select: { name: true } },
          programme: { select: { name: true, degreeType: true } },
          level: { select: { level: true } },
          semester: { select: { name: true } },
          _count: { select: { supports: true } },
        },
        orderBy: [{ supportCount: 'desc' }, { createdAt: 'asc' }],
      });
    },

    getSubmissionById: async (id: string) => {
      return prisma.courseSubmission.findUnique({
        where: { id },
        include: {
          submitter: { select: { id: true, username: true, fullname: true } },
          university: { select: { name: true, shortName: true } },
          faculty: { select: { name: true } },
          department: { select: { name: true } },
          programme: { select: { name: true, degreeType: true } },
          level: { select: { level: true } },
          semester: { select: { name: true } },
          supports: { include: { student: { select: { id: true, username: true } } } },
        },
      });
    },

    approve: async ({ submissionId, actorId, courseType = 'Core' }: ApproveSubmissionInput) => {
      const submission = await prisma.courseSubmission.findUnique({
        where: { id: submissionId },
        include: { supports: true }
      });
      if (!submission) throw new Error('Submission not found');

      const studentIds = Array.from(new Set([submission.submittedBy, ...submission.supports.map(s => s.studentId)]));

      // Create official course + version + mark submission APPROVED in a transaction
      const [course] = await prisma.$transaction([
        prisma.course.create({
          data: {
            universityId: submission.universityId,
            facultyId: submission.facultyId,
            departmentId: submission.departmentId,
            programmeId: submission.programmeId,
            levelId: submission.levelId,
            semesterId: submission.semesterId,
            courseCode: submission.courseCode,
            title: submission.title,
            creditUnit: submission.creditUnit,
            courseType,
            status: 'ACTIVE',
            enrolledStudents: {
              connect: studentIds.map(id => ({ id }))
            }
          },
        }),
        prisma.courseSubmission.update({
          where: { id: submissionId },
          data: { status: 'APPROVED', updatedAt: new Date() },
        }),
        prisma.courseAuditLog.create({
          data: {
            actorId,
            action: 'APPROVE_SUBMISSION',
            newValue: { submissionId, courseCode: submission.courseCode, title: submission.title },
          },
        }),
      ]);

      // Create initial version record
      await prisma.courseVersion.create({
        data: {
          courseId: course.id,
          revision: 1,
          title: course.title,
          creditUnit: course.creditUnit,
          courseType: course.courseType,
          outline: [],
        },
      });

      return course;
    },

    reject: async ({ submissionId, actorId, reason }: RejectSubmissionInput) => {
      const submission = await prisma.courseSubmission.findUnique({
        where: { id: submissionId },
      });
      if (!submission) throw new Error('Submission not found');

      await prisma.$transaction([
        prisma.courseSubmission.update({
          where: { id: submissionId },
          data: { status: 'REJECTED', updatedAt: new Date() },
        }),
        prisma.courseAuditLog.create({
          data: {
            actorId,
            action: 'REJECT_SUBMISSION',
            prevValue: { submissionId, courseCode: submission.courseCode },
            newValue: { reason: reason ?? 'No reason provided' },
          },
        }),
      ]);

      return { success: true };
    },

    bulkApprove: async (submissionIds: string[], actorId: string) => {
      const results = await Promise.allSettled(
        submissionIds.map((id) =>
          prisma.courseSubmission
            .findUnique({ where: { id }, include: { supports: true } })
            .then((sub) => {
              if (!sub) throw new Error(`Submission ${id} not found`);
              const studentIds = Array.from(new Set([sub.submittedBy, ...sub.supports.map(s => s.studentId)]));
              return prisma.$transaction([
                prisma.course.create({
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
                      connect: studentIds.map(id => ({ id }))
                    }
                  },
                }),
                prisma.courseSubmission.update({
                  where: { id },
                  data: { status: 'APPROVED' },
                }),
                prisma.courseAuditLog.create({
                  data: {
                    actorId,
                    action: 'BULK_APPROVE_SUBMISSION',
                    newValue: { submissionId: id },
                  },
                }),
              ]);
            })
        )
      );

      const approved = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { approved, failed, total: submissionIds.length };
    },
  };
};
