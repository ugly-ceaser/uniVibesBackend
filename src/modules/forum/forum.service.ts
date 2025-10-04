import { PrismaClient, Forum, Question, Answer, Comment } from '@prisma/client';

export const createForumService = (prisma: PrismaClient) => {
  return {
    // Paginated questions list
    listQuestions: async (
      page: number = 1,
      pageSize: number = 20,
      forumId?: string,
      category?: string
    ) => {
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (forumId) where.forumId = forumId;
      if (category) where.category = category;

      const [questions, totalCount] = await Promise.all([
        prisma.question.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          include: { 
            author: {
              select: { id: true, fullname: true, email: true }
            },
            _count: { select: { answers: true } } 
          }
        }),
        prisma.question.count({ where })
      ]);

      return {
        questions,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page
      };
    },

    // Get a single question with all its answers
    getQuestionWithAnswers: async (questionId: string) => {
      return prisma.question.findUnique({
        where: { id: questionId },
        include: {
          author: {
            select: { id: true, fullname: true, email: true }
          },
          forum: {
            select: { id: true, name: true }
          },
          answers: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, fullname: true, email: true }
              },
              _count: {
                select: { comments: true }
              }
            }
          },
          _count: {
            select: { answers: true }
          }
        }
      });
    },

    // Create a question
    addQuestion: async (
      title: string,
      body: string,
      authorId?: string,
      forumId?: string
    ) => {
      return prisma.question.create({ 
        data: { title, body, authorId, forumId },
        include: {
          author: {
            select: { id: true, fullname: true, email: true }
          }
        }
      });
    },

    // Create an answer
    addAnswer: async (
      questionId: string,
      body: string,
      authorId?: string
    ) => {
      return prisma.answer.create({ 
        data: { questionId, body, authorId },
        include: {
          author: {
            select: { id: true, fullname: true, email: true }
          }
        }
      });
    },

    // Create a forum
    createForum: async (
      name: string,
      ownerId?: string
    ): Promise<Forum> => {
      return prisma.forum.create({
        data: { name, creatorId: ownerId }
      });
    },

    // Fetch comments + deep replies for an answer
    fetchCommentsWithReplies: async (answerId: string) => {
      return prisma.comment.findMany({
        where: { answerId, parentId: null },
        orderBy: { createdAt: 'asc' },
        include: {
          author: true,
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: true,
              replies: {
                orderBy: { createdAt: 'asc' },
                include: { author: true }
              }
            }
          }
        }
      });
    },

    // Post a comment or a reply
    postComment: async (
      body: string,
      authorId?: string,
      answerId?: string,
      parentId?: string
    ): Promise<Comment> => {
      if (!body.trim()) throw new Error('Comment body is required');
      if (!answerId && !parentId) {
        throw new Error('Either answerId or parentId must be provided');
      }

      let resolvedAnswerId = answerId;

      // If replying to another comment, find its answerId
      if (parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { answerId: true }
        });
        if (!parent) throw new Error('Parent comment not found');
        resolvedAnswerId = parent.answerId ?? undefined;
      }

      // Create the comment
      const comment = await prisma.comment.create({
        data: {
          body,
          authorId,
          answerId: resolvedAnswerId,
          parentId
        },
        include: {
          author: {
            select: { id: true, fullname: true, email: true }
          }
        }
      });

      // Update counts for efficiency
      if (parentId) {
        // Increment replyCount for parent comment
        await prisma.comment.update({
          where: { id: parentId },
          data: { replyCount: { increment: 1 } }
        });
      } else if (resolvedAnswerId) {
        // Increment commentsCount for the answer
        await prisma.answer.update({
          where: { id: resolvedAnswerId },
          data: { commentsCount: { increment: 1 } }
        });
      }

      return comment;
    }
  };
};
