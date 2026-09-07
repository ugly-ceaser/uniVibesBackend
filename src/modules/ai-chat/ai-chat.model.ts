export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CourseContext {
  courseCode: string;
  courseName: string;
  outline?: string[];
  assessment?: {
    type: string;
    percentage: number;
  }[];
  instructor?: string;
  description?: string;
}

export interface StudentContext {
  studentId: string;
  currentGPA?: number;
  enrolledCourses?: string[];
  completedCourses?: string[];
  strugglingSubjects?: string[];
  studyHours?: number;
  activeForumPosts?: number;
}

export interface StudentData {
  completedTopics: string[];
  strugglingAreas: string[];
  studyHours: number;
  lastAssignmentScore: number;
  attendanceRate: number;
  forumParticipation: 'low' | 'moderate' | 'high';
}

// Request types
export interface CourseAIChatRequest {
  message: string;
  courseId: string;
  context: CourseContext;
  conversationHistory: ConversationMessage[];
}

export interface GeneralAIChatRequest {
  message: string;
  conversationHistory: ConversationMessage[];
}

export interface AcademicAIChatRequest {
  message: string;
  studentContext: StudentContext;
  conversationHistory: ConversationMessage[];
}

export interface CourseRecommendationsRequest {
  studentData: StudentData;
}

// Response types
export interface AIChatResponse {
  response: string;
  confidence: number;
  sources?: string[];
  suggestions: string[];
  cached?: boolean;
  model?: string;
  tokensUsed?: number;
  estimatedCost?: number;
}

export interface CourseInsightsResponse {
  studyPlan: string[];
  keyTopics: string[];
  assessmentTips: string[];
  resources: string[];
  difficultyRating: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedStudyHours: number;
}

export interface PersonalizedRecommendationsResponse {
  recommendations: string[];
  focusAreas: string[];
  timeAllocation: Record<string, number>;
  nextSteps: string[];
}

// Enhanced Database types based on requirements
export interface CreateChatSessionInput {
  studentId: string;
  courseId?: string;
  sessionType?: 'course' | 'general' | 'academic' | 'campus';
  title?: string;
  metadata?: any;
}

export interface CreateChatMessageInput {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contentType?: 'text' | 'markdown' | 'json';
  metadata?: any;
  sequenceNumber?: number;
}

export interface ChatSessionWithMessages {
  id: string;
  studentId: string;
  courseId: string | null;
  sessionType: string;
  title: string;
  status: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
  course?: {
    id: string;
    name: string;
    code: string;
  } | null;
  messages: {
    id: string;
    role: string;
    content: string;
    contentType: string;
    metadata?: any;
    sequenceNumber: number;
    createdAt: Date;
  }[];
  messageCount: number;
}

// Enhanced response interfaces
export interface CourseChatsResponse {
  course: {
    id: string;
    code: string;
    name: string;
    description?: string;
  };
  chatSessions: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string | null;
    messageCount: number;
    lastMessage?: {
      role: 'user' | 'assistant';
      content: string;
      createdAt: string;
    };
  }[];
  totalSessions: number;
}

export interface ActiveSessionResponse {
  id: string;
  courseId: string | null;
  title: string;
  sessionType: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
    metadata?: any;
    sequenceNumber: number;
  }[];
  messageCount: number;
}

export interface ChatAnalyticsData {
  sessionId: string;
  messageId?: string;
  tokensUsed?: number;
  modelUsed?: string;
  responseTimeMs?: number;
  costUsd?: number;
  confidenceScore?: number;
}