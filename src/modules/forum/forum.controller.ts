import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createForumService } from './forum.service';
import { invalidateCacheKeys } from '../../middlewares/cacheMiddleware';

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

  const data = await service.listQuestions(page, pageSize, forumId);
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
  const { title, body, forumId } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({
      status: 400,
      message: 'title and body required',
      requestId: req.id,
    });
  }

  const authorId = (req as any).user?.id;
  const question = await service.addQuestion(title, body, authorId, forumId);

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
  const answer = await service.addAnswer(req.params.id, body, authorId);

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
