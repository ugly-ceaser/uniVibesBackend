import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/http';
import { createAIChatService } from './ai-chat.service';
import { AIService } from './ai.service';
import { 
  CourseAIChatRequest, 
  GeneralAIChatRequest, 
  AcademicAIChatRequest,
  CourseRecommendationsRequest,
  ConversationMessage
} from './ai-chat.model';

const aiService = new AIService();

// Course-specific AI Chat
export const courseAIChat = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  const { message, courseId, context, conversationHistory, userMode }: CourseAIChatRequest & { userMode?: 'fast' | 'balanced' | 'smart' } = req.body;

  // Validate required fields
  if (!message || !courseId || !context) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Message, courseId, and context are required',
      details: {
        message: !message ? 'Message is required' : null,
        courseId: !courseId ? 'Course ID is required' : null,
        context: !context ? 'Course context is required' : null
      },
      status: 400
    });
  }

  // Fetch course data to populate context if missing
  let courseContext = context;
  if (!context.courseCode || !context.courseName) {
    try {
      // Try to get course by code first, then by ID
      let course = await service.getCourseByCode(courseId);
      if (!course) {
        course = await service.getCourseById(courseId);
      }
      
      if (!course) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Course not found',
          details: {
            courseId: `Course with ID or code '${courseId}' not found`
          },
          status: 404
        });
      }

      // Populate context with course data from database
      courseContext = {
        ...context,
        courseCode: course.code,
        courseName: course.name,
        instructor: context.instructor || course.coordinator,
        outline: context.outline || course.outline || [],
        description: context.description || `${course.name} - ${course.unitLoad} units, Semester ${course.semester}`,
        assessment: context.assessment || [
          { type: "Assignments", percentage: 30 },
          { type: "Tests", percentage: 30 },
          { type: "Final Exam", percentage: 40 }
        ]
      };
    } catch (error) {
      console.error('Error fetching course data:', error);
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to fetch course information',
        status: 500
      });
    }
  }

  // Validate message length
  if (message.length > 500) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Message content exceeds maximum length',
      details: {
        field: 'message',
        maxLength: 500,
        actualLength: message.length
      },
      status: 400
    });
  }

  try {
    // Get or create course-specific chat session
    let session = await service.getOrCreateCourseChat(
      userId,
      courseId,
      `${courseContext.courseCode}: ${message.substring(0, 50)}...`
    );

    // Get conversation history from database for context
    const existingMessages = await service.getChatMessages(session.id, 20);
    const dbConversationHistory = existingMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));

    // Add user message to session
    await service.addChatMessage({
      sessionId: session.id,
      role: 'user',
      content: message
    });

    // Generate AI response with database access and conversation history
    const aiResponse = await aiService.generateCourseResponse(
      message, 
      courseContext, 
      dbConversationHistory, // Use actual conversation history from database
      userMode || 'balanced',
      service // Pass the database service for course outline fetching
    );

    // Add AI response to session
    await service.addChatMessage({
      sessionId: session.id,
      role: 'assistant',
      content: aiResponse.response
    });

    res.status(200).json({
      data: aiResponse,
      message: 'AI response generated successfully',
      timestamp: new Date().toISOString(),
      sessionId: session.id
    });

  } catch (error: any) {
    console.error('Course AI chat error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate AI response',
      status: 500
    });
  }
});

// General AI Chat
export const generalAIChat = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  const { message, conversationHistory, userMode }: GeneralAIChatRequest & { userMode?: 'fast' | 'balanced' | 'smart' } = req.body;

  if (!message) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Message is required',
      status: 400
    });
  }

  if (message.length > 500) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Message content exceeds maximum length',
      status: 400
    });
  }

  try {
    // Create chat session
    let session = await service.createChatSession({
      studentId: userId,
      title: `General: ${message.substring(0, 50)}...`
    });

    // Add user message
    await service.addChatMessage({
      sessionId: session.id,
      role: 'user',
      content: message
    });

    // Generate AI response
    const aiResponse = await aiService.generateGeneralResponse(
      message, 
      conversationHistory || [],
      userMode || 'balanced'
    );

    // Add AI response
    await service.addChatMessage({
      sessionId: session.id,
      role: 'assistant',
      content: aiResponse.response
    });

    res.status(200).json({
      data: aiResponse,
      message: 'AI response generated successfully',
      timestamp: new Date().toISOString(),
      sessionId: session.id
    });

  } catch (error: any) {
    console.error('General AI chat error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate AI response',
      status: 500
    });
  }
});

// Academic AI Chat
export const academicAIChat = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  const { message, studentContext, conversationHistory, userMode }: AcademicAIChatRequest & { userMode?: 'fast' | 'balanced' | 'smart' } = req.body;

  if (!message || !studentContext) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Message and studentContext are required',
      status: 400
    });
  }

  try {
    // Create chat session
    let session = await service.createChatSession({
      studentId: userId,
      title: `Academic: ${message.substring(0, 50)}...`
    });

    // Add user message
    await service.addChatMessage({
      sessionId: session.id,
      role: 'user',
      content: message
    });

    // Generate AI response
    const aiResponse = await aiService.generateAcademicResponse(
      message, 
      studentContext, 
      conversationHistory || [],
      userMode || 'smart'
    );

    // Add AI response
    await service.addChatMessage({
      sessionId: session.id,
      role: 'assistant',
      content: aiResponse.response
    });

    res.status(200).json({
      data: aiResponse,
      message: 'Academic analysis completed',
      timestamp: new Date().toISOString(),
      sessionId: session.id
    });

  } catch (error: any) {
    console.error('Academic AI chat error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate AI response',
      status: 500
    });
  }
});

// Get Course Insights
export const getCourseInsights = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;
  const { courseId } = req.params;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  if (!courseId) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Course ID is required',
      status: 400
    });
  }

  try {
    const insights = await service.generateCourseInsights(courseId);
    
    res.status(200).json({
      data: insights,
      message: 'Course insights generated successfully'
    });

  } catch (error: any) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Course not found',
        status: 404
      });
    }

    console.error('Course insights error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate course insights',
      status: 500
    });
  }
});

// Get Course Outline
export const getCourseOutline = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;
  const { courseId } = req.params;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  if (!courseId) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Course ID is required',
      status: 400
    });
  }

  try {
    // Try by ID first, then by code
    let course = await service.getCourseById(courseId);
    
    if (!course) {
      course = await service.getCourseByCode(courseId);
    }

    if (!course) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Course not found',
        status: 404
      });
    }

    const courseOutline = {
      courseCode: course.code,
      courseName: course.name,
      instructor: course.coordinator,
      department: course.department,
      unitLoad: course.unitLoad,
      semester: course.semester,
      outline: course.outline || [],
      description: `${course.name} - ${course.unitLoad} units, Semester ${course.semester}`
    };
    
    res.status(200).json({
      data: courseOutline,
      message: 'Course outline retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get course outline error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve course outline',
      status: 500
    });
  }
});

// Get Personalized Recommendations
export const getPersonalizedRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;
  const { courseId } = req.params;
  const { studentData }: CourseRecommendationsRequest = req.body;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  if (!courseId || !studentData) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Course ID and student data are required',
      status: 400
    });
  }

  try {
    const recommendations = await service.generatePersonalizedRecommendations(courseId, studentData);
    
    res.status(200).json({
      data: recommendations,
      message: 'Personalized recommendations generated'
    });

  } catch (error: any) {
    if (error.message === 'Course not found') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Course not found',
        status: 404
      });
    }

    console.error('Personalized recommendations error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate recommendations',
      status: 500
    });
  }
});

// Chat Session Management
export const getChatSessions = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  try {
    const sessions = await service.getUserChatSessions(userId);
    
    res.status(200).json({
      data: sessions,
      message: 'Chat sessions retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve chat sessions',
      status: 500
    });
  }
});

export const getChatSession = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;
  const { sessionId } = req.params;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  try {
    const session = await service.getChatSession(sessionId, userId);
    
    if (!session) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Chat session not found',
        status: 404
      });
    }

    res.status(200).json({
      data: session,
      message: 'Chat session retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve chat session',
      status: 500
    });
  }
});

export const deleteChatSession = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;
  const { sessionId } = req.params;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  try {
    await service.deleteChatSession(sessionId, userId);
    
    res.status(200).json({
      message: 'Chat session deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete chat session error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete chat session',
      status: 500
    });
  }
});

// Get chat sessions for a specific course
export const getCourseChatSessions = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;
  const { courseId } = req.params;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  if (!courseId) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Course ID is required',
      status: 400
    });
  }

  try {
    const sessions = await service.getUserChatSessionsByCourse(userId, courseId);
    
    // Get course information for context
    const course = await service.getCourseById(courseId);
    
    res.status(200).json({
      data: {
        course: course ? {
          id: course.id,
          name: course.name,
          code: course.code
        } : null,
        sessions: sessions
      },
      message: 'Course chat sessions retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get course chat sessions error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve course chat sessions',
      status: 500
    });
  }
});

// Get or create a chat session for a specific course (for starting new chats)
export const getOrCreateCourseChatSession = asyncHandler(async (req: Request, res: Response) => {
  const prisma = req.container?.cradle.prisma;
  if (!prisma) {
    throw new Error("Prisma client not found in request container");
  }

  const service = createAIChatService(prisma);
  const userId = (req as any).user?.id;
  const { courseId } = req.params;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      status: 401
    });
  }

  if (!courseId) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Course ID is required',
      status: 400
    });
  }

  try {
    // Get course information
    const course = await service.getCourseById(courseId);
    
    if (!course) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Course not found',
        status: 404
      });
    }

    // Get or create chat session for this course
    const session = await service.getOrCreateCourseChat(
      userId,
      courseId,
      `${course.code} Chat Session`
    );
    
    res.status(200).json({
      data: {
        session: session,
        course: {
          id: course.id,
          name: course.name,
          code: course.code
        }
      },
      message: 'Course chat session ready'
    });

  } catch (error: any) {
    console.error('Get or create course chat session error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to get or create course chat session',
      status: 500
    });
  }
});