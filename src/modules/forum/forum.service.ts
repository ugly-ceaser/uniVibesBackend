import { PrismaClient, Forum, Question, Answer, Comment } from '@prisma/client';
import { PostRankingService } from './post-ranking.service';

export const createForumService = (prisma: PrismaClient) => {
  return {
    // Paginated questions list
    listQuestions: async (
      page: number = 1,
      pageSize: number = 20,
      forumId?: string,
      category?: string,
      cursor?: string,
      userId?: string | null,
      profileName: 'forum' | 'homeTrending' = 'forum'
    ) => {
      const rankingService = new PostRankingService(prisma);
      
      // Resolve user's department for relevance boosting if authenticated
      let userDepartment: string | null = null;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { department: true }
        });
        userDepartment = user?.department ?? null;
      }

      const { questions, nextCursor } = await rankingService.getRankedQuestions({
        profileName,
        userId: userId ?? null,
        userDepartment,
        cursorStr: cursor,
        limit: pageSize,
        category,
        forumId
      });

      return {
        questions,
        nextCursor
      };
    },

    // Get a single question with all its answers
    getQuestionWithAnswers: async (questionId: string) => {
      // Also increment view count atomically
      await prisma.question.update({
        where: { id: questionId },
        data: { viewCount: { increment: 1 } }
      }).catch(() => null);

      return prisma.question.findUnique({
        where: { id: questionId },
        include: {
          author: {
            select: { id: true, fullname: true, email: true, department: true, faculty: true, level: true, username: true }
          },
          forum: {
            select: { id: true, name: true }
          },
          answers: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, fullname: true, email: true, department: true, faculty: true, level: true, username: true }
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
      forumId?: string,
      category?: string,
      courseCode?: string,
      department?: string
    ) => {
      let resolvedDepartment = department;
      if (!resolvedDepartment && authorId) {
        const author = await prisma.user.findUnique({
          where: { id: authorId },
          select: { department: true }
        });
        resolvedDepartment = author?.department ?? undefined;
      }

      return prisma.question.create({ 
        data: { 
          title, 
          body, 
          authorId, 
          forumId, 
          category: category as any,
          courseCode,
          department: resolvedDepartment
        },
        include: {
          author: {
            select: { id: true, fullname: true, email: true, department: true, faculty: true, level: true, username: true }
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
      const [answer] = await prisma.$transaction([
        prisma.answer.create({ 
          data: { questionId, body, authorId },
          include: {
            author: {
              select: { id: true, fullname: true, email: true, department: true, faculty: true, level: true, username: true }
            }
          }
        }),
        prisma.question.update({
          where: { id: questionId },
          data: { answerCount: { increment: 1 } }
        })
      ]);

      if (questionId && authorId) {
        try {
          const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: { authorId: true, title: true }
          });
          if (question && question.authorId && question.authorId !== authorId) {
            const authorName = answer.author?.fullname || answer.author?.username || 'Someone';
            await prisma.notification.create({
              data: {
                userId: question.authorId,
                title: 'New Answer on Your Question',
                body: `${authorName} answered: "${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}"`,
                type: 'FORUM_ANSWER',
                targetUrl: `/forum?questionId=${questionId}`
              }
            });
          }
        } catch (err) {
          console.error('Failed to create notification for answer:', err);
        }
      }

      return answer;
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
          author: {
            select: { id: true, fullname: true, email: true, department: true, faculty: true, level: true, username: true }
          },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, fullname: true, email: true, department: true, faculty: true, level: true, username: true }
              },
              replies: {
                orderBy: { createdAt: 'asc' },
                include: {
                  author: {
                    select: { id: true, fullname: true, email: true, department: true, faculty: true, level: true, username: true }
                  }
                }
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
            select: { id: true, fullname: true, email: true, department: true, faculty: true, level: true, username: true }
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
    },

    // Report a question
    reportQuestion: async (questionId: string, userId: string, reason: string) => {
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { authorId: true }
      });
      if (!question) throw new Error('Question not found');
      if (question.authorId === userId) {
        throw new Error('You cannot report your own post');
      }

      const result = await prisma.$transaction(async (tx) => {
        const report = await tx.report.create({
          data: {
            userId,
            questionId,
            reason
          }
        });

        const count = await tx.report.count({
          where: { questionId }
        });

        let statusUpdated = false;
        if (count >= 3) {
          await tx.question.update({
            where: { id: questionId },
            data: { status: 'Reported' }
          });
          statusUpdated = true;
        }

        return { report, count, statusUpdated };
      });

      return result;
    },

    // Soft delete a question
    softDeleteQuestion: async (questionId: string, userId: string, isAdmin = false) => {
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { authorId: true }
      });
      if (!question) throw new Error('Question not found');
      if (question.authorId !== userId && !isAdmin) {
        throw new Error('Permission denied to delete this question');
      }

      return prisma.question.update({
        where: { id: questionId },
        data: {
          status: 'Deleted',
          deletedAt: new Date()
        }
      });
    },

    // List all reported questions (Admin only)
    listReportedQuestions: async () => {
      return prisma.question.findMany({
        where: { status: 'Reported' },
        include: {
          author: {
            select: { id: true, fullname: true, email: true }
          },
          reports: {
            include: {
              user: {
                select: { id: true, fullname: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // Restore a reported question (Admin only)
    restoreQuestion: async (questionId: string) => {
      return prisma.$transaction([
        prisma.question.update({
          where: { id: questionId },
          data: { status: 'Cleared' }
        }),
        prisma.report.deleteMany({
          where: { questionId }
        })
      ]);
    }
  };
};
