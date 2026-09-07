import { PrismaClient } from '@prisma/client';
import { 
  CreateChatSessionInput, 
  CreateChatMessageInput, 
  ChatSessionWithMessages,
  CourseInsightsResponse,
  PersonalizedRecommendationsResponse,
  StudentData,
  ActiveSessionResponse,     // New enhanced types
  CourseChatsResponse,
  ChatAnalyticsData
} from './ai-chat.model';

export const createAIChatService = (prisma: PrismaClient) => {
  // Define the service object first
  const service = {
    // Chat Session Management
    createChatSession: async (input: CreateChatSessionInput) => {
      return prisma.chatSession.create({
        data: {
          studentId: input.studentId,
          courseId: input.courseId || null,
          title: input.title || 'New Chat Session'
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    },

    getChatSession: async (sessionId: string, studentId: string): Promise<ChatSessionWithMessages | null> => {
      return prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          studentId: studentId
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }) as Promise<ChatSessionWithMessages | null>;
    },

    getUserChatSessions: async (studentId: string) => {
      return prisma.chatSession.findMany({
        where: { studentId },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // Get chat sessions for a specific course
    getUserChatSessionsByCourse: async (studentId: string, courseId: string) => {
      return prisma.chatSession.findMany({
        where: { 
          studentId,
          courseId 
        },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // Enhanced: Get or create active session for a course (from requirements)
    getCourseActiveSession: async (courseId: string, studentId: string): Promise<ActiveSessionResponse> => {
      // First, try to find course by code (most common), then by ID as fallback
      let course = await prisma.course.findFirst({ where: { code: courseId } });
      if (!course) {
        course = await prisma.course.findUnique({ where: { id: courseId } });
      }
      const actualCourseId = course?.id || courseId;
      
      // Try to find existing active session using the actual course ID
      let session = await prisma.chatSession.findFirst({
        where: {
          studentId,
          courseId: actualCourseId,
          sessionType: 'course',
          status: 'active'
        },
        include: {
          messages: {
            orderBy: { sequenceNumber: 'asc' }
          }
        }
      });

      // If no session exists, create one
      if (!session) {
        if (!course) {
          throw new Error(`Course not found with ID or code: ${courseId}`);
        }
        
        session = await prisma.chatSession.create({
          data: {
            studentId,
            courseId: course.id, // Always use the actual course ID
            sessionType: 'course',
            title: `${course.code} Chat Session`,
            metadata: {
              courseCode: course.code,
              courseName: course.name,
              outline: course.outline,
              instructor: course.coordinator
            }
          },
          include: {
            messages: {
              orderBy: { sequenceNumber: 'asc' }
            }
          }
        });
      }

      return {
        id: session.id,
        courseId: session.courseId,
        title: session.title,
        sessionType: session.sessionType,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          metadata: msg.metadata,
          sequenceNumber: msg.sequenceNumber
        })),
        messageCount: session.messages.length
      };
    },

    // Enhanced: Get all chat sessions for a specific course (from requirements)
    getCourseChatSessions: async (courseId: string, studentId: string): Promise<CourseChatsResponse> => {
      // Get course info
      // Try by code first, then by ID
      let course = await prisma.course.findFirst({ where: { code: courseId } });
      if (!course) {
        course = await prisma.course.findUnique({ where: { id: courseId } });
      }
      
      if (!course) {
        throw new Error('Course not found');
      }

      // Get all sessions for this course and user
      const sessions = await prisma.chatSession.findMany({
        where: {
          studentId,
          courseId,
          status: 'active'
        },
        include: {
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      return {
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
          description: `${course.name} - ${course.unitLoad} units, Semester ${course.semester}`
        },
        chatSessions: sessions.map(session => ({
          id: session.id,
          title: session.title,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          lastMessageAt: session.lastMessageAt?.toISOString() || null,
          messageCount: session._count.messages,
          lastMessage: session.messages[0] ? {
            role: session.messages[0].role as 'user' | 'assistant',
            content: session.messages[0].content,
            createdAt: session.messages[0].createdAt.toISOString()
          } : undefined
        })),
        totalSessions: sessions.length
      };
    },

    // Helper: Get next sequence number for message ordering
    getNextSequenceNumber: async (sessionId: string): Promise<number> => {
      const lastMessage = await prisma.chatMessage.findFirst({
        where: { sessionId },
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true }
      });
      
      return (lastMessage?.sequenceNumber || 0) + 1;
    },

    // Enhanced: Add message with sequence tracking
    addChatMessageWithSequence: async (input: CreateChatMessageInput) => {
      const sequenceNumber = input.sequenceNumber || await service.getNextSequenceNumber(input.sessionId);
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
          contentType: input.contentType || 'text',
          metadata: input.metadata,
          sequenceNumber
        }
      });

      // Update session last message timestamp
      await prisma.chatSession.update({
        where: { id: input.sessionId },
        data: { 
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      });

      return message;
    },

    // Analytics: Track chat usage and costs
    trackChatAnalytics: async (data: ChatAnalyticsData) => {
      return prisma.chatAnalytics.create({
        data: {
          sessionId: data.sessionId,
          messageId: data.messageId,
          tokensUsed: data.tokensUsed,
          modelUsed: data.modelUsed,
          responseTimeMs: data.responseTimeMs,
          costUsd: data.costUsd,
          confidenceScore: data.confidenceScore
        }
      });
    },

    // Session Management: Archive old sessions
    archiveOldSessions: async (monthsOld: number = 6) => {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
      
      return prisma.chatSession.updateMany({
        where: {
          lastMessageAt: { lt: cutoffDate },
          status: 'active'
        },
        data: {
          status: 'archived',
          updatedAt: new Date()
        }
      });
    },

    // GDPR: Export user chat data
    exportUserChatData: async (studentId: string) => {
      const sessions = await prisma.chatSession.findMany({
        where: { studentId },
        include: {
          messages: {
            orderBy: { sequenceNumber: 'asc' }
          },
          course: true
        }
      });
      
      return {
        user_id: studentId,
        export_date: new Date().toISOString(),
        total_sessions: sessions.length,
        sessions: sessions.map(session => ({
          id: session.id,
          title: session.title,
          course: session.course,
          created_at: session.createdAt,
          messages: session.messages
        }))
      };
    },

    // Backwards compatibility - keep existing method
    getOrCreateCourseChat: async (studentId: string, courseId: string, title?: string) => {
      const response = await service.getCourseActiveSession(courseId, studentId);
      return {
        id: response.id,
        studentId,
        courseId: response.courseId,
        title: response.title,
        createdAt: new Date(response.createdAt),
        messages: []
      };
    },

    updateChatSessionTitle: async (sessionId: string, studentId: string, title: string) => {
      return prisma.chatSession.updateMany({
        where: {
          id: sessionId,
          studentId: studentId
        },
        data: { title }
      });
    },

    deleteChatSession: async (sessionId: string, studentId: string) => {
      // Delete messages first due to foreign key constraint
      await prisma.chatMessage.deleteMany({
        where: { sessionId }
      });

      return prisma.chatSession.deleteMany({
        where: {
          id: sessionId,
          studentId: studentId
        }
      });
    },

    // Chat Message Management
    addChatMessage: async (input: CreateChatMessageInput) => {
      // Auto-generate sequence number if not provided
      const sequenceNumber = input.sequenceNumber ?? await service.getNextSequenceNumber(input.sessionId);
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
          contentType: input.contentType || 'text',
          metadata: input.metadata,
          sequenceNumber
        }
      });

      // Update session last message timestamp
      await prisma.chatSession.update({
        where: { id: input.sessionId },
        data: { 
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      });

      return message;
    },

    getChatMessages: async (sessionId: string, limit: number = 50) => {
      return prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: limit
      });
    },

    // Course-related queries
    getCourseById: async (courseId: string) => {
      // Try by ID first for backward compatibility, then by code
      let course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        course = await prisma.course.findFirst({ where: { code: courseId } });
      }
      return course;
    },

    getCourseByCode: async (courseCode: string) => {
      return prisma.course.findFirst({
        where: { code: courseCode }
      });
    },

    // Enhanced course data retrieval with full details
    getCourseWithFullDetails: async (courseId: string) => {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) return null;

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        level: course.level,
        coordinator: course.coordinator,
        outline: course.outline || [],
        unitLoad: course.unitLoad,
        semester: course.semester,
        department: course.department,
        description: `${course.name} - ${course.unitLoad} units, Semester ${course.semester}`,
        assessment: [
          { type: "Assignments", percentage: 30 },
          { type: "Midterm Exam", percentage: 35 }, 
          { type: "Final Exam", percentage: 35 }
        ] // Default assessment structure - can be made dynamic later
      };
    },

    searchCoursesByCode: async (courseCode: string) => {
      return prisma.course.findMany({
        where: {
          code: {
            contains: courseCode,
            mode: 'insensitive'
          }
        },
        take: 5
      });
    },

    getUserCourses: async (studentId: string) => {
      // This would need to be implemented based on your enrollment system
      // For now, returning all courses as mock data
      return prisma.course.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    },

    // Analytics and Insights
    getUserAcademicData: async (studentId: string) => {
      // Mock implementation - replace with actual academic data queries
      const user = await prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          level: true,
          department: true,
          faculty: true,
          questions: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          answers: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) return null;

      return {
        studentId: user.id,
        currentGPA: 3.2, // Mock data - implement actual GPA calculation
        enrolledCourses: ['CS101', 'MATH201', 'ENG102'], // Mock data
        completedCourses: ['CS100', 'MATH101'], // Mock data
        strugglingSubjects: [], // Mock data
        studyHours: 15, // Mock data
        activeForumPosts: user.questions.length + user.answers.length
      };
    },

    // Course insights generation
    generateCourseInsights: async (courseId: string): Promise<CourseInsightsResponse> => {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Generate insights based on course data
      return {
        studyPlan: [
          `Week 1-2: Master ${course.outline[0] || 'foundational concepts'}`,
          `Week 3-4: Practice ${course.outline[1] || 'intermediate topics'}`,
          `Week 5-6: Dive into ${course.outline[2] || 'advanced concepts'}`
        ],
        keyTopics: course.outline || [
          'Core Concepts',
          'Practical Applications',
          'Advanced Topics'
        ],
        assessmentTips: [
          'Start assignments early to avoid last-minute rush',
          'Review past exam questions for pattern recognition',
          'Practice problems daily for better understanding'
        ],
        resources: [
          `${course.code}_textbook.pdf`,
          `${course.code}_practice_problems.md`,
          `${course.code}_video_tutorials.mp4`
        ],
        difficultyRating: calculateDifficultyRating(course.level || '100'),
        estimatedStudyHours: course.unitLoad * 2 // 2 hours per unit load
      };
    },

    // Personalized recommendations
    generatePersonalizedRecommendations: async (
      courseId: string, 
      studentData: StudentData
    ): Promise<PersonalizedRecommendationsResponse> => {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      const recommendations: string[] = [];
      const focusAreas: string[] = [];
      const timeAllocation: Record<string, number> = {};

      // Generate recommendations based on student data
      if (studentData.strugglingAreas.length > 0) {
        studentData.strugglingAreas.forEach(area => {
          recommendations.push(`Spend extra 2 hours weekly on ${area} practice`);
          focusAreas.push(area);
          timeAllocation[area.toLowerCase().replace(' ', '_')] = 3;
        });
      }

      if (studentData.lastAssignmentScore < 80) {
        recommendations.push('Join study group for better understanding');
        recommendations.push('Schedule office hours with instructor');
      }

      if (studentData.attendanceRate < 0.8) {
        recommendations.push('Improve class attendance for better outcomes');
      }

      return {
        recommendations: recommendations.length > 0 ? recommendations : [
          'Keep up the excellent work!',
          'Continue with current study patterns',
          'Consider helping other students'
        ],
        focusAreas: focusAreas.length > 0 ? focusAreas : ['Review and reinforcement'],
        timeAllocation: Object.keys(timeAllocation).length > 0 ? timeAllocation : {
          review: 2,
          practice: 3,
          new_topics: 4
        },
        nextSteps: [
          'Complete next assignment early',
          'Attend upcoming review session',
          'Form study group with classmates'
        ]
      };
    }
  };

  // Helper function to calculate difficulty rating
  function calculateDifficultyRating(level: string): 'Beginner' | 'Intermediate' | 'Advanced' {
    const levelNum = parseInt(level) || 100;
    if (levelNum <= 200) return 'Beginner';
    if (levelNum <= 300) return 'Intermediate';
    return 'Advanced';
  }

  // Return the service object
  return service;
};