import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import {
  createUniversityBrowserService,
  createCourseQueryService,
  createCourseSubmissionService,
} from './courses.service';
import { seedUniversityData } from '../../utils/seedUniversityData';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPrisma(req: Request) {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) throw new Error('Prisma client not found in request container');
  return prisma;
}

function getUser(req: Request) {
  return (req as any).user as { id: string; role: string } | undefined;
}

// ─── University / Hierarchy Browser ──────────────────────────────────────────

export const listUniversities = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { country, state } = req.query as { country?: string; state?: string };
  const service = createUniversityBrowserService(prisma);
  const data = await service.listUniversities(country, state);
  res.status(200).json({ data });
});

export const listFaculties = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createUniversityBrowserService(prisma);
  const data = await service.getFacultiesByUniversity(req.params.universityId);
  res.status(200).json({ data });
});

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createUniversityBrowserService(prisma);
  const data = await service.getDepartmentsByFaculty(req.params.facultyId);
  res.status(200).json({ data });
});

export const listProgrammes = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createUniversityBrowserService(prisma);
  const data = await service.getProgrammesByDepartment(req.params.departmentId);
  res.status(200).json({ data });
});

export const listLevels = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createUniversityBrowserService(prisma);
  const data = await service.getLevelsByProgramme(req.params.programmeId);
  res.status(200).json({ data });
});

export const listSemesters = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createUniversityBrowserService(prisma);
  const data = await service.getSemestersByProgramme(req.params.programmeId);
  res.status(200).json({ data });
});

// ─── Course Query ─────────────────────────────────────────────────────────────

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createCourseQueryService(prisma);
  const { universityId, facultyId, departmentId, programmeId, levelId, semesterId } =
    req.query as Record<string, string>;
  const data = await service.listCourses({ universityId, facultyId, departmentId, programmeId, levelId, semesterId });
  res.status(200).json({ data });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createCourseQueryService(prisma);
  const course = await service.getCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ status: 404, message: 'Course not found' });
  }
  res.status(200).json({ data: course });
});

export const searchCourses = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createCourseQueryService(prisma);
  const { q, universityId } = req.query as { q?: string; universityId?: string };
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ status: 400, message: 'Query must be at least 2 characters.' });
  }
  const data = await service.searchCourses(q.trim(), universityId);
  res.status(200).json({ data });
});

export const getSelectedCourses = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const service = createCourseQueryService(prisma);
  const data = await service.listSelectedCourses(user.id);
  res.status(200).json({ data });
});

export const enrollCourse = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const service = createCourseQueryService(prisma);
  await service.selectCourse(user.id, req.params.id);
  res.status(200).json({ message: 'Course selected successfully' });
});

export const unenrollCourse = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const service = createCourseQueryService(prisma);
  await service.unselectCourse(user.id, req.params.id);
  res.status(200).json({ message: 'Course unselected successfully' });
});

// ─── Course Submission ────────────────────────────────────────────────────────

export const submitCourse = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const { universityId, facultyId, departmentId, programmeId, levelId, semesterId, courseCode, title, creditUnit, note } =
    req.body;

  if (!universityId || !facultyId || !departmentId || !programmeId || !levelId || !semesterId || !courseCode || !title || creditUnit == null) {
    return res.status(400).json({
      status: 400,
      message: 'Missing required fields: universityId, facultyId, departmentId, programmeId, levelId, semesterId, courseCode, title, creditUnit',
    });
  }

  const service = createCourseSubmissionService(prisma);
  const result = await service.submit(user.id, {
    universityId,
    facultyId,
    departmentId,
    programmeId,
    levelId,
    semesterId,
    courseCode,
    title,
    creditUnit: Number(creditUnit),
    note,
  });

  const statusCode = result.type === 'CREATED' ? 201 : 200;
  res.status(statusCode).json({ type: result.type, message: result.message, data: result.data });
});

export const listSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { universityId, facultyId, departmentId, status } = req.query as Record<string, string>;
  const service = createCourseSubmissionService(prisma);
  const data = await service.listPendingSubmissions({ universityId, facultyId, departmentId, status });
  res.status(200).json({ data });
});

export const getSubmission = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const service = createCourseSubmissionService(prisma);
  const submission = await service.getSubmissionById(req.params.id);
  if (!submission) {
    return res.status(404).json({ status: 404, message: 'Submission not found' });
  }
  res.status(200).json({ data: submission });
});

export const approveSubmission = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const { courseType } = req.body;
  const service = createCourseSubmissionService(prisma);
  const course = await service.approve({
    submissionId: req.params.id,
    actorId: user.id,
    courseType,
  });
  res.status(201).json({ message: 'Course approved and added to the system.', data: course });
});

export const rejectSubmission = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const { reason } = req.body;
  const service = createCourseSubmissionService(prisma);
  await service.reject({ submissionId: req.params.id, actorId: user.id, reason });
  res.status(200).json({ message: 'Submission rejected.' });
});

export const bulkApproveSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const { submissionIds } = req.body;
  if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
    return res.status(400).json({ status: 400, message: 'submissionIds must be a non-empty array.' });
  }

  const service = createCourseSubmissionService(prisma);
  const result = await service.bulkApprove(submissionIds, user.id);
  res.status(200).json({ message: `Processed ${result.total} submissions.`, ...result });
});

// ─── Legacy: Keep old request endpoints for backward-compat ──────────────────

export const getCourseRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const request = await prisma.courseRequest.findUnique({ where: { studentId: user.id } });
  res.status(200).json({ requested: !!request, data: request });
});

export const createCourseRequest = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  const { studentName, faculty, department } = req.body;
  if (!studentName || !faculty || !department) {
    return res.status(400).json({
      status: 400,
      message: 'Missing required fields: studentName, faculty, department',
    });
  }

  const request = await prisma.courseRequest.upsert({
    where: { studentId: user.id },
    update: { studentName, faculty, department },
    create: { studentId: user.id, studentName, faculty, department },
  });
  res.status(201).json({ data: request });
});

// ─── Admin: Seed University Data ─────────────────────────────────────────────

export const runUniversitySeed = asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const user = getUser(req);
  if (!user) return res.status(401).json({ status: 401, message: 'Unauthorized' });

  // Safety check: require confirmation flag to avoid accidental triggers
  if (req.body?.confirm !== 'SEED_UNIVERSITIES') {
    return res.status(400).json({
      status: 400,
      message: 'Send { "confirm": "SEED_UNIVERSITIES" } in body to run the seed.',
    });
  }

  await seedUniversityData(prisma);

  const uniCount = await prisma.university.count();
  const courseCount = await prisma.course.count();

  res.status(200).json({
    message: '✅ University seed completed.',
    universities: uniCount,
    courses: courseCount,
  });
});
