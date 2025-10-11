import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { requireAuth } from '../../middlewares/authMiddleware';
import {
  courseAIChat,
  generalAIChat,
  academicAIChat,
  getCourseInsights,
  getPersonalizedRecommendations,
  getChatSessions,
  getChatSession,
  deleteChatSession,
  getCourseOutline,
  getCourseChatSessions,
  getOrCreateCourseChatSession
} from './ai-chat.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     ConversationMessage:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, assistant, system]
 *           description: Message role
 *         content:
 *           type: string
 *           description: Message content
 *       required: [role, content]
 *     
 *     CourseContext:
 *       type: object
 *       properties:
 *         courseCode:
 *           type: string
 *           example: SWE101
 *         courseName:
 *           type: string
 *           example: Introduction to Programming
 *         outline:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Introduction to Programming Concepts", "Algorithms and Flowcharts", "Variables and Data Types", "Control Structures", "Functions and Procedures"]
 *         assessment:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: Assignment
 *               percentage:
 *                 type: number
 *                 example: 30
 *         instructor:
 *           type: string
 *           example: Dr. Software Adebayo
 *         description:
 *           type: string
 *           example: Introduction to Programming - 3 units, Semester 1, Department: Software Engineering
 *       required: [courseCode, courseName, outline, assessment, instructor, description]
 *     
 *     StudentContext:
 *       type: object
 *       properties:
 *         studentId:
 *           type: string
 *           format: uuid
 *         currentGPA:
 *           type: number
 *           example: 3.2
 *         enrolledCourses:
 *           type: array
 *           items:
 *             type: string
 *           example: ["CS101", "MATH201"]
 *         completedCourses:
 *           type: array
 *           items:
 *             type: string
 *           example: ["CS100", "MATH101"]
 *         strugglingSubjects:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Calculus", "Data Structures"]
 *         studyHours:
 *           type: number
 *           example: 15
 *         activeForumPosts:
 *           type: number
 *           example: 8
 *       required: [studentId, enrolledCourses, completedCourses, strugglingSubjects, studyHours, activeForumPosts]
 *     
 *     StudentData:
 *       type: object
 *       properties:
 *         completedTopics:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Variables", "Functions"]
 *         strugglingAreas:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Nested Loops", "Arrays"]
 *         studyHours:
 *           type: number
 *           example: 15
 *         lastAssignmentScore:
 *           type: number
 *           example: 75
 *         attendanceRate:
 *           type: number
 *           example: 0.85
 *         forumParticipation:
 *           type: string
 *           enum: [low, moderate, high]
 *           example: moderate
 *       required: [completedTopics, strugglingAreas, studyHours, lastAssignmentScore, attendanceRate, forumParticipation]
 *     
 *     AIChatResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             response:
 *               type: string
 *               description: AI generated response
 *             confidence:
 *               type: number
 *               format: float
 *               minimum: 0
 *               maximum: 1
 *               description: Response confidence score (0.5-0.99)
 *             sources:
 *               type: array
 *               items:
 *                 type: string
 *               description: Source materials referenced
 *               example: ["SWE101_syllabus.pdf", "dr_software_adebayo_notes.md"]
 *             suggestions:
 *               type: array
 *               items:
 *                 type: string
 *               description: Follow-up suggestions
 *               example: ["Would you like study tips for Introduction to Programming?", "Need help understanding the assessment breakdown?"]
 *             cached:
 *               type: boolean
 *               description: Whether response was served from cache
 *             model:
 *               type: string
 *               description: AI model used for response
 *               example: "gpt-4o-mini"
 *             tokensUsed:
 *               type: integer
 *               description: Number of tokens consumed
 *               example: 150
 *             estimatedCost:
 *               type: number
 *               format: float
 *               description: Estimated cost in USD
 *               example: 0.000023
 *         message:
 *           type: string
 *           example: AI response generated successfully
 *         timestamp:
 *           type: string
 *           format: date-time
 *         sessionId:
 *           type: string
 *           format: uuid
 *           description: Chat session ID
 *       required: [data, message, timestamp]
 *     
 *     ChatSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         studentId:
 *           type: string
 *           format: uuid
 *         courseId:
 *           type: string
 *           format: uuid
 *           description: Associated course ID (null for general chats)
 *         sessionType:
 *           type: string
 *           enum: [course, general, academic]
 *           description: Type of chat session
 *         title:
 *           type: string
 *           example: "SWE101: Programming concepts discussion"
 *         status:
 *           type: string
 *           enum: [active, archived, deleted]
 *           description: Session status
 *         metadata:
 *           type: object
 *           description: Additional session metadata (course info, analytics, etc.)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         lastMessageAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last message in session
 *         messages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 enum: [user, assistant, system]
 *               content:
 *                 type: string
 *               sequenceNumber:
 *                 type: integer
 *                 description: Message order in session
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *                 description: Message-specific metadata
 *         messageCount:
 *           type: integer
 *           description: Total number of messages in session
 *       required: [id, studentId, title, createdAt, messages]
 */

/**
 * @swagger
 * /ai/chat/course:
 *   post:
 *     tags: [AI Chat]
 *     summary: Course-specific AI chat
 *     description: Get AI assistance tailored to specific course content and context
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - courseId
 *               - context
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 500
 *                 description: User message/question
 *                 example: Show me the course outline
 *               courseId:
 *                 type: string
 *                 description: Course identifier (course code or UUID)
 *                 example: SWE101
 *               context:
 *                 $ref: '#/components/schemas/CourseContext'
 *               conversationHistory:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   $ref: '#/components/schemas/ConversationMessage'
 *                 description: Previous conversation messages
 *               userMode:
 *                 type: string
 *                 enum: [fast, balanced, smart]
 *                 default: balanced
 *                 description: AI response mode - fast (gpt-3.5-turbo), balanced (gpt-4o-mini), smart (gpt-4o)
 *                 example: balanced
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIChatResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ValidationError
 *                 message:
 *                   type: string
 *                   example: Message content exceeds maximum length
 *                 details:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                       example: message
 *                     maxLength:
 *                       type: number
 *                       example: 500
 *                     actualLength:
 *                       type: number
 *                       example: 750
 *                 status:
 *                   type: number
 *                   example: 400
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /ai/chat/general:
 *   post:
 *     tags: [AI Chat]
 *     summary: General AI chat
 *     description: Get broad AI assistance for general university life questions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 500
 *                 description: User message/question
 *                 example: How can I improve my study habits?
 *               conversationHistory:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   $ref: '#/components/schemas/ConversationMessage'
 *               userMode:
 *                 type: string
 *                 enum: [fast, balanced, smart]
 *                 default: balanced
 *                 description: AI response mode for cost optimization
 *                 example: fast
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIChatResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /ai/chat/academic:
 *   post:
 *     tags: [AI Chat]
 *     summary: Academic progress AI chat
 *     description: Get personalized academic performance analysis and recommendations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - studentContext
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 500
 *                 description: User message/question
 *                 example: How is my academic performance this semester?
 *               studentContext:
 *                 $ref: '#/components/schemas/StudentContext'
 *               conversationHistory:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   $ref: '#/components/schemas/ConversationMessage'
 *     responses:
 *       200:
 *         description: Academic analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIChatResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /ai/insights/course/{courseId}:
 *   get:
 *     tags: [AI Chat]
 *     summary: Get course insights
 *     description: Get AI-generated study plans and course-specific insights
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID or course code
 *         example: "SWE101"
 *     responses:
 *       200:
 *         description: Course insights generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     studyPlan:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Week 1-2: Master variables and basic syntax"]
 *                     keyTopics:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Variables and Data Types", "Functions"]
 *                     assessmentTips:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Start assignments early"]
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["textbook_chapters_1-5.pdf"]
 *                     difficultyRating:
 *                       type: string
 *                       enum: [Beginner, Intermediate, Advanced]
 *                       example: Intermediate
 *                     estimatedStudyHours:
 *                       type: number
 *                       example: 8
 *                 message:
 *                   type: string
 *                   example: Course insights generated successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /ai/recommendations/course/{courseId}:
 *   post:
 *     tags: [AI Chat]
 *     summary: Get personalized recommendations
 *     description: Generate personalized study recommendations based on student progress
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentData
 *             properties:
 *               studentData:
 *                 $ref: '#/components/schemas/StudentData'
 *     responses:
 *       200:
 *         description: Personalized recommendations generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Spend extra 2 hours weekly on nested loops"]
 *                     focusAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Nested control structures"]
 *                     timeAllocation:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example: {"nested_loops": 3, "arrays": 4}
 *                     nextSteps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Complete practice set #3 by next week"]
 *                 message:
 *                   type: string
 *                   example: Personalized recommendations generated
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /ai/sessions:
 *   get:
 *     tags: [AI Chat]
 *     summary: Get user chat sessions
 *     description: Retrieve all chat sessions for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatSession'
 *                 message:
 *                   type: string
 *                   example: Chat sessions retrieved successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /ai/sessions/{sessionId}:
 *   get:
 *     tags: [AI Chat]
 *     summary: Get specific chat session
 *     description: Retrieve a specific chat session with all messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Chat session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ChatSession'
 *                 message:
 *                   type: string
 *                   example: Chat session retrieved successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [AI Chat]
 *     summary: Delete chat session
 *     description: Delete a specific chat session and all its messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Chat session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat session deleted successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const createAIChatRouter = (container: AwilixContainer) => {
  const router = Router();

  // AI Chat endpoints
  router.post('/chat/course', requireAuth, courseAIChat);
  router.post('/chat/general', requireAuth, generalAIChat);
  router.post('/chat/academic', requireAuth, academicAIChat);

  // AI Insights endpoints
  router.get('/insights/course/:courseId', requireAuth, getCourseInsights);
  router.get('/recommendations', requireAuth, getPersonalizedRecommendations);

/**
 * @swagger
 * /api/v1/ai/course/{courseId}/outline:
 *   get:
 *     summary: Get course outline
 *     description: Retrieve detailed outline for a specific course by ID or code
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course code (preferred) or course ID
 *         example: "SWE101"
 *     responses:
 *       200:
 *         description: Course outline retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     courseCode:
 *                       type: string
 *                       example: "SWE101"
 *                     courseName:
 *                       type: string
 *                       example: "Introduction to Programming"
 *                     instructor:
 *                       type: string
 *                       example: "Dr. Software Adebayo"
 *                     department:
 *                       type: string
 *                       example: "Software Engineering"
 *                     unitLoad:
 *                       type: integer
 *                       example: 3
 *                     semester:
 *                       type: integer
 *                       example: 1
 *                     outline:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Introduction to Programming Concepts", "Algorithms and Flowcharts", "Variables and Data Types", "Control Structures", "Functions and Procedures", "Basic Debugging", "Introduction to Software Tools"]
 *                     description:
 *                       type: string
 *                       example: "Introduction to Programming - 3 units, Semester 1"
 *                 message:
 *                   type: string
 *                   example: "Course outline retrieved successfully"
 *       400:
 *         description: Course ID is required
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
  router.get('/course/:courseId/outline', requireAuth, getCourseOutline);

/**
 * @swagger
 * /api/v1/ai/courses/{courseId}/chats:
 *   get:
 *     summary: Get all chat sessions for a specific course
 *     description: Retrieve all AI chat sessions that the authenticated user has had for a specific course. Supports lookup by course code (e.g., SWE101) or course ID.
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course code (preferred) or course ID to get chat sessions for
 *         example: "SWE101"
 *     responses:
 *       200:
 *         description: Course chat sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "course-uuid-123"
 *                         name:
 *                           type: string
 *                           example: "Introduction to Computer Science"
 *                         code:
 *                           type: string
 *                           example: "CSC101"
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "session-uuid-456"
 *                           title:
 *                             type: string
 *                             example: "CSC101: Show me the course outline..."
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           messages:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 role:
 *                                   type: string
 *                                   enum: [user, assistant, system]
 *                                 content:
 *                                   type: string
 *                                 createdAt:
 *                                   type: string
 *                                   format: date-time
 *                           _count:
 *                             type: object
 *                             properties:
 *                               messages:
 *                                 type: integer
 *                                 example: 10
 *                 message:
 *                   type: string
 *                   example: "Course chat sessions retrieved successfully"
 *       400:
 *         description: Course ID is required
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
  router.get('/courses/:courseId/chats', requireAuth, getCourseChatSessions);

/**
 * @swagger
 * /api/v1/ai/courses/{courseId}/chats/session:
 *   get:
 *     summary: Get or create a chat session for a specific course
 *     description: Get an existing active chat session for a course or create a new one if none exists. This endpoint manages course-specific AI chat sessions with automatic session tracking and message sequencing.
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course code (preferred) or course ID to get or create chat session for
 *         example: "SWE101"
 *     responses:
 *       200:
 *         description: Course chat session ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "session-uuid-456"
 *                         studentId:
 *                           type: string
 *                           example: "user-uuid-789"
 *                         courseId:
 *                           type: string
 *                           example: "course-uuid-123"
 *                         title:
 *                           type: string
 *                           example: "CSC101 Chat Session"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               role:
 *                                 type: string
 *                                 enum: [user, assistant, system]
 *                               content:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                     course:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "course-uuid-123"
 *                         name:
 *                           type: string
 *                           example: "Introduction to Computer Science"
 *                         code:
 *                           type: string
 *                           example: "CSC101"
 *                 message:
 *                   type: string
 *                   example: "Course chat session ready"
 *       400:
 *         description: Course ID is required
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
  router.get('/courses/:courseId/chats/session', requireAuth, getOrCreateCourseChatSession);

  // General Chat Session Management
  router.get('/sessions', requireAuth, getChatSessions);
  router.get('/sessions/:sessionId', requireAuth, getChatSession);
  router.delete('/sessions/:sessionId', requireAuth, deleteChatSession);

  return router;
};