import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { attachUserIfPresent, requireAuth, authorizeRoles } from '../../middlewares/authMiddleware';
import { proxyToRagBackend } from '../../middlewares/ragProxy';
import {
  // University hierarchy browser
  listUniversities,
  listFaculties,
  listDepartments,
  listProgrammes,
  listLevels,
  listSemesters,
  // Course query
  listCourses,
  getCourse,
  searchCourses,
  // Course submission workflow
  submitCourse,
  listSubmissions,
  getSubmission,
  approveSubmission,
  rejectSubmission,
  bulkApproveSubmissions,
  // Legacy requests
  getCourseRequestStatus,
  createCourseRequest,
  // Admin utilities
  runUniversitySeed,
  // Selected courses
  getSelectedCourses,
  enrollCourse,
  unenrollCourse,
} from './courses.controller';

const ADMIN_ROLES = ['ADMIN', 'UNIVERSITY_ADMIN', 'FACULTY_MODERATOR', 'DEPT_MODERATOR', 'SUPER_ADMIN'];
const ALL_AUTH = ['STUDENT', 'ADMIN', 'UNIVERSITY_ADMIN', 'FACULTY_MODERATOR', 'DEPT_MODERATOR', 'SUPER_ADMIN', 'GUEST'];

export const createCoursesRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  const cacheKeyBuilder = (req: any) => {
    const queryString = new URLSearchParams(req.query).toString();
    return `courses:${queryString || 'all'}`;
  };

  // ─── University Hierarchy (public, cached) ──────────────────────────────

  router.get('/universities',
    createCacheMiddleware(redis, { ttlSeconds: 600, key: () => 'universities:all' }),
    listUniversities
  );

  router.get('/universities/:universityId/faculties',
    createCacheMiddleware(redis, { ttlSeconds: 600, key: (req) => `faculties:${req.params.universityId}` }),
    listFaculties
  );

  router.get('/faculties/:facultyId/departments',
    createCacheMiddleware(redis, { ttlSeconds: 600, key: (req) => `depts:${req.params.facultyId}` }),
    listDepartments
  );

  router.get('/departments/:departmentId/programmes',
    createCacheMiddleware(redis, { ttlSeconds: 600, key: (req) => `programmes:${req.params.departmentId}` }),
    listProgrammes
  );

  router.get('/programmes/:programmeId/levels',
    createCacheMiddleware(redis, { ttlSeconds: 600, key: (req) => `levels:${req.params.programmeId}` }),
    listLevels
  );

  router.get('/programmes/:programmeId/semesters',
    createCacheMiddleware(redis, { ttlSeconds: 600, key: (req) => `semesters:${req.params.programmeId}` }),
    listSemesters
  );

  // ─── Course Search (authenticated) ────────────────────────────────────

  router.get('/search',
    attachUserIfPresent,
    requireAuth,
    searchCourses
  );

  // ─── Legacy Course Request Routes (backward compat) ───────────────────

  router.get('/requests/status',
    attachUserIfPresent,
    requireAuth,
    getCourseRequestStatus
  );

  router.post('/requests',
    attachUserIfPresent,
    requireAuth,
    createCourseRequest
  );

  // ─── Course Submission Routes (authenticated students) ─────────────────

  router.post('/submissions',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ALL_AUTH),
    submitCourse
  );

  router.get('/submissions',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ADMIN_ROLES),
    listSubmissions
  );

  router.get('/submissions/:id',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ADMIN_ROLES),
    getSubmission
  );

  router.post('/submissions/:id/approve',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ADMIN_ROLES),
    approveSubmission
  );

  router.post('/submissions/:id/reject',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ADMIN_ROLES),
    rejectSubmission
  );

  router.post('/submissions/bulk-approve',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles('ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN'),
    bulkApproveSubmissions
  );

  // ─── Official Course Routes ────────────────────────────────────────────

  router.get('/',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ALL_AUTH),
    createCacheMiddleware(redis, { ttlSeconds: 300, key: cacheKeyBuilder }),
    listCourses
  );

  router.get('/selected',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ALL_AUTH),
    getSelectedCourses
  );

  router.post('/:id/enroll',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ALL_AUTH),
    enrollCourse
  );

  router.post('/:id/unenroll',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ALL_AUTH),
    unenrollCourse
  );

  // ─── RAG / AI Microservice Proxy Routes ─────────────────────────────
  router.use('/:courseId/materials', proxyToRagBackend);
  router.use('/:courseId/ask', proxyToRagBackend);
  router.use('/:courseId/history', proxyToRagBackend);
  router.use('/:courseId/gaps', proxyToRagBackend);
  router.use('/:courseId/chats/session', proxyToRagBackend);

  router.get('/:id',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles(...ALL_AUTH),
    getCourse
  );

  // ─── Admin Utilities ─────────────────────────────────────────────────

  router.post('/admin/seed',
    attachUserIfPresent,
    requireAuth,
    authorizeRoles('ADMIN', 'SUPER_ADMIN'),
    runUniversitySeed
  );

  return router;
};
