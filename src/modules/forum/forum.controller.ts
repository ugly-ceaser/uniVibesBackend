import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createForumService } from './forum.service';
import { invalidateCacheKeys } from '../../middlewares/cacheMiddleware';
import { Status } from '@prisma/client';

// List questions with pagination
export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createForumService(prisma);

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const forumId = req.query.forumId as string | undefined;
  const category = req.query.category as string | undefined;
  const cursor = req.query.cursor as string | undefined;
  const profileName = (req.query.profileName as 'forum' | 'homeTrending') || 'forum';
  const userId = (req as any).user?.id || null;

  const data = await service.listQuestions(
    page,
    pageSize,
    forumId,
    category,
    cursor,
    userId,
    profileName
  );
  res.status(200).json({ data });
});

// Add a new question
export const addQuestion = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  const redis = req.container?.cradle.redis;
  if (!prisma || !redis) {
    throw new Error("Dependencies not found in request container");
  }

  const service = createForumService(prisma);
  const { title, body, forumId, category, courseCode, department } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({
      status: 400,
      message: 'title and body required',
      requestId: req.id,
    });
  }

  const authorId = (req as any).user?.id;
  const question = await service.addQuestion(
    title,
    body,
    authorId,
    forumId,
    category,
    courseCode,
    department
  );

  await invalidateCacheKeys(redis, ['cache:GET:/api/v1/forum/questions*']);
  res.status(201).json({ data: question });
});

// Add an answer to a question
export const addAnswer = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  const redis = req.container?.cradle.redis;
  if (!prisma || !redis) {
    throw new Error("Dependencies not found in request container");
  }

  const questionId = req.params.id;

  // Verify target question exists and is Cleared
  const targetQuestion = await prisma.question.findUnique({
    where: { id: questionId },
    select: { status: true }
  });

  if (!targetQuestion) {
    return res.status(404).json({
      status: 404,
      message: 'Question not found',
      requestId: req.id,
    });
  }

  if (targetQuestion.status !== 'Cleared') {
    return res.status(400).json({
      status: 400,
      message: 'Cannot answer a question that is deleted or under review',
      requestId: req.id,
    });
  }

  const service = createForumService(prisma);
  const { body } = req.body || {};

  if (!body) {
    return res.status(400).json({
      status: 400,
      message: 'body required',
      requestId: req.id,
    });
  }

  const authorId = (req as any).user?.id;
  const answer = await service.addAnswer(questionId, body, authorId);

  await invalidateCacheKeys(redis, ['cache:GET:/api/v1/forum/questions*']);
  res.status(201).json({ data: answer });
});

// Fetch comments and nested replies for an answer
export const fetchComments = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createForumService(prisma);
  const answerId = req.params.answerId;

  const comments = await service.fetchCommentsWithReplies(answerId);
  res.status(200).json({ data: comments });
});

// Post a comment or reply
export const postComment = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  const redis = req.container?.cradle.redis;
  if (!prisma || !redis) {
    throw new Error("Dependencies not found in request container");
  }

  const service = createForumService(prisma);
  const { body, answerId, parentId } = req.body || {};

  if (!body) {
    return res.status(400).json({
      status: 400,
      message: 'Comment body is required',
      requestId: req.id,
    });
  }

  const authorId = (req as any).user?.id;
  const comment = await service.postComment(body, authorId, answerId, parentId);

  await invalidateCacheKeys(redis, [`cache:GET:/api/v1/forum/answers/${answerId}/comments*`]);
  res.status(201).json({ data: comment });
});

export const createForum = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  const redis = req.container?.cradle.redis; // optional: may be undefined in some envs

  if (!prisma) {
    throw new Error('Prisma client not found in request container');
  }

  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      status: 400,
      message: 'Forum name is required',
      requestId: (req as any).id,
    });
  }

  const authorId = (req as any).user?.id;

  const service = createForumService(prisma);

  try {
    const forum = await service.createForum(name.trim(), authorId);

    // invalidate forum list caches if redis exists
    if (redis) {
      await invalidateCacheKeys(redis, ['cache:GET:/api/v1/forums*']);
    }

    res.status(201).json({ data: forum });
  } catch (err: any) {
    // handle unique constraint on forum.name
    if (err.code === 'P2002' && err.meta?.target?.includes('name')) {
      return res.status(409).json({
        status: 409,
        message: 'Forum with that name already exists',
        requestId: (req as any).id,
      });
    }

    // rethrow so your global errorHandler logs it and responds appropriately
    throw err;
  }
});

// Get a single question with all its answers
export const getQuestionById = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  const redis = req.container?.cradle.redis;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createForumService(prisma);
  const questionId = req.params.id;

  const question = await service.getQuestionWithAnswers(questionId);
  
  if (!question) {
    return res.status(404).json({
      status: 404,
      message: 'Question not found',
      requestId: req.id,
    });
  }

  // Access checks for Deleted and Reported states
  const userId = (req as any).user?.id || null;
  const userRole = (req as any).user?.role || null;
  const isAuthor = question.authorId === userId;
  const isAdmin = userRole === 'ADMIN';

  // Use the generated enum for status comparison to avoid type mismatch
  // Import Status from @prisma/client at the top of the file
  if (question.status === Status.Deleted && !isAuthor && !isAdmin) {
    return res.status(404).json({
      status: 404,
      message: 'Question not found',
      requestId: req.id,
    });
  }

  if (question.status === Status.Reported && !isAuthor && !isAdmin) {
    return res.status(403).json({
      status: 403,
      message: 'This post has been hidden due to multiple reports',
      requestId: req.id,
    });
  }

  // Deduplicate views using Redis with a fail-safe fallback
  let alreadyViewed = false;
  
  if (redis) {
    try {
      const viewCacheKey = `question:view:${userId || req.ip}:${questionId}`;
      const val = await redis.get(viewCacheKey);
      if (val) {
        alreadyViewed = true;
      } else {
        await redis.setex(viewCacheKey, 900, '1'); // 15 minutes TTL
      }
    } catch (err) {
      console.error('Redis error during view counting (failing safe):', err);
    }
  }

  if (!alreadyViewed) {
    try {
      await prisma.question.update({
        where: { id: questionId },
        data: { viewCount: { increment: 1 } }
      });
    } catch (err) {
      console.error('Failed to increment viewCount on question:', err);
    }
  }

  res.status(200).json({ data: question });
});

// Report a question (flag it)
export const reportQuestion = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  const redis = req.container?.cradle.redis;
  if (!prisma || !redis) {
    throw new Error("Dependencies not found in request container");
  }

  const service = createForumService(prisma);
  const questionId = req.params.id;
  const userId = (req as any).user?.id;
  const { reason } = req.body || {};

  if (!reason) {
    return res.status(400).json({
      status: 400,
      message: 'reason required',
      requestId: req.id,
    });
  }

  try {
    const result = await service.reportQuestion(questionId, userId, reason);
    
    if (result.statusUpdated) {
      // Invalidate cache if hidden
      await invalidateCacheKeys(redis, ['cache:GET:/api/v1/forum/questions*', 'cache:GET:/api/v1/forum/posts*']);
    }

    res.status(201).json({
      message: 'Question reported successfully',
      data: result
    });
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        status: 404,
        message: err.message,
        requestId: req.id,
      });
    }
    if (err.message.includes('cannot report') || err.message.includes('already reported')) {
      return res.status(400).json({
        status: 400,
        message: err.message,
        requestId: req.id,
      });
    }
    throw err;
  }
});

// Soft delete a question
export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  const redis = req.container?.cradle.redis;
  if (!prisma || !redis) {
    throw new Error("Dependencies not found in request container");
  }

  const service = createForumService(prisma);
  const questionId = req.params.id;
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  const isAdmin = userRole === 'ADMIN';

  try {
    await service.softDeleteQuestion(questionId, userId, isAdmin);
    await invalidateCacheKeys(redis, ['cache:GET:/api/v1/forum/questions*', 'cache:GET:/api/v1/forum/posts*']);
    res.status(200).json({
      message: 'Question deleted successfully'
    });
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        status: 404,
        message: err.message,
        requestId: req.id,
      });
    }
    if (err.message.includes('Permission denied')) {
      return res.status(403).json({
        status: 403,
        message: err.message,
        requestId: req.id,
      });
    }
    throw err;
  }
});

// List all reported questions (Admin only)
export const getReportedQuestions = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createForumService(prisma);
  const questions = await service.listReportedQuestions();
  res.status(200).json({ data: questions });
});

// Restore a reported question (Admin only)
export const restoreQuestion = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  const redis = req.container?.cradle.redis;
  if (!prisma || !redis) {
    throw new Error("Dependencies not found in request container");
  }

  const service = createForumService(prisma);
  const questionId = req.params.id;

  try {
    await service.restoreQuestion(questionId);
    await invalidateCacheKeys(redis, ['cache:GET:/api/v1/forum/questions*', 'cache:GET:/api/v1/forum/posts*']);
    res.status(200).json({
      message: 'Question restored successfully'
    });
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        status: 404,
        message: err.message,
        requestId: req.id,
      });
    }
    throw err;
  }
});

// Get home trending questions (engagement ranked, limit 5)
export const getHomeTrending = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createForumService(prisma);
  const userId = (req as any).user?.id || null;

  const data = await service.listQuestions(
    1,
    5,
    undefined,
    undefined,
    undefined,
    userId,
    'homeTrending'
  );
  res.status(200).json({ data });
});

// Get all visible categories (forums mapped to slugs)
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const forums = await prisma.forum.findMany({
    where: { visibiltyStatus: true },
    orderBy: { createdAt: 'asc' }
  });

  const slugify = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const categories = forums.map(f => ({
    id: f.id,
    name: f.name,
    slug: slugify(f.name)
  }));

  res.status(200).json({ data: categories });
});
