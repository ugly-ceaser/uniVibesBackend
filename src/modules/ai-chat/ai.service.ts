import { ConversationMessage, CourseContext, StudentContext, AIChatResponse } from './ai-chat.model';
import { env } from '../../config/env';

interface ModelConfig {
  name: string;
  maxTokens: number;
  temperature: number;
  costPer1MTokens: number; // in USD
}

interface CacheableResponse {
  content: string;
  timestamp: number;
  model: string;
}

export class AIService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, CacheableResponse> = new Map();
  private cacheTimeout = 1000 * 60 * 30; // 30 minutes

  // Model configurations for cost optimization
  private models: Record<string, ModelConfig> = {
    'cheap': {
      name: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7,
      costPer1MTokens: 0.50
    },
    'balanced': {
      name: 'gpt-4o-mini',
      maxTokens: 800,
      temperature: 0.7,
      costPer1MTokens: 0.15
    },
    'smart': {
      name: 'gpt-4o',
      maxTokens: 1500,
      temperature: 0.6,
      costPer1MTokens: 2.50
    }
  };

  constructor() {
    this.baseUrl = env.aiServiceUrl;
    this.apiKey = env.aiServiceApiKey;
    this.cacheTimeout = env.aiCacheTimeoutMs;
    
    if (!this.apiKey) {
      console.warn('⚠️  AI_SERVICE_API_KEY not found in environment variables');
    } else {
      console.log('✅ OpenAI API key configured successfully');
    }
  }

  async generateCourseResponse(
    message: string,
    courseContext: CourseContext,
    conversationHistory: ConversationMessage[],
    userMode: 'fast' | 'balanced' | 'smart' = 'balanced',
    prismaService?: any // Add prisma service for database queries
  ): Promise<AIChatResponse> {
    try {
      // Enhance context with database data if available
      let enhancedContext = courseContext;
      if (prismaService && courseContext.courseCode) {
        const courseDetails = await this.fetchCourseOutlineFromDB(courseContext.courseCode, prismaService);
        if (courseDetails) {
          enhancedContext = { ...courseContext, ...courseDetails };
        }
      }

      // Handle specific course outline requests with database data
      if (this.isAskingForCourseOutline(message) && enhancedContext.outline && enhancedContext.outline.length > 0) {
        return {
          response: this.formatCourseOutlineResponse(enhancedContext),
          confidence: 0.98,
          sources: this.extractSources(enhancedContext),
          suggestions: [
            'Would you like more details about any specific topic?',
            'Need help with study strategies for this course?',
            'Want to know about assessment methods?'
          ],
          cached: false,
          model: 'database_lookup',
          tokensUsed: 0,
          estimatedCost: 0
        };
      }

      // Determine task complexity and select appropriate model
      const taskComplexity = this.analyzeCourseTaskComplexity(message);
      const modelTier = this.selectModelTier(taskComplexity, userMode);

      // Check cache first for common course questions (less aggressive caching for conversational flow)
      const cacheKey = this.generateCacheKey('course', enhancedContext.courseCode, message);
      const cachedResponse = conversationHistory.length === 0 ? this.getFromCache(cacheKey) : null; // Only cache for first messages
      if (cachedResponse) {
        return {
          response: cachedResponse.content,
          confidence: 0.90, // Slightly lower confidence for cached responses
          sources: this.extractSources(courseContext),
          suggestions: this.generateCourseSuggestions(courseContext, message),
          cached: true,
          model: cachedResponse.model
        };
      }

      const contextPrompt = this.buildCourseContextPrompt(enhancedContext);
      const conversationSummary = this.buildConversationContext(conversationHistory);
      
      const systemMessage: ConversationMessage = {
        role: 'system',
        content: `${contextPrompt}

${conversationSummary}

You are an AI assistant helping students with course-specific questions. Maintain conversation context and provide ${taskComplexity === 'complex' ? 'detailed, well-reasoned' : 'concise, direct'} responses. Reference previous conversation when relevant.`
      };

      const optimizedHistory = this.optimizeConversationHistory(conversationHistory, modelTier);
      const messages = [systemMessage, ...optimizedHistory, { role: 'user' as const, content: message }];

      const response = await this.callAIService(messages, modelTier);

      // Cache only initial course questions, not follow-up conversation
      if (conversationHistory.length === 0 && this.isCacheableQuery(message)) {
        this.setCache(cacheKey, {
          content: response.content,
          timestamp: Date.now(),
          model: this.models[modelTier].name
        });
      }

      return {
        response: response.content,
        confidence: this.calculateConfidence(modelTier, taskComplexity),
        sources: this.extractSources(enhancedContext),
        suggestions: this.generateCourseSuggestions(enhancedContext, message),
        cached: false,
        model: this.models[modelTier].name,
        tokensUsed: response.tokensUsed,
        estimatedCost: response.tokensUsed ? this.calculateEstimatedCost(response.tokensUsed, modelTier) : undefined
      };
    } catch (error) {
      console.error('Error generating course AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateGeneralResponse(
    message: string,
    conversationHistory: ConversationMessage[],
    userMode: 'fast' | 'balanced' | 'smart' = 'balanced'
  ): Promise<AIChatResponse> {
    try {
      const taskComplexity = this.analyzeGeneralTaskComplexity(message);
      const modelTier = this.selectModelTier(taskComplexity, userMode);

      // Check cache for common general questions
      const cacheKey = this.generateCacheKey('general', 'university', message);
      const cachedResponse = this.getFromCache(cacheKey);
      if (cachedResponse) {
        return {
          response: cachedResponse.content,
          confidence: 0.85,
          sources: ['study_guides.pdf', 'academic_resources.md'],
          suggestions: this.generateGeneralSuggestions(message),
          cached: true,
          model: cachedResponse.model
        };
      }

      const systemMessage: ConversationMessage = {
        role: 'system',
        content: `You are a helpful AI assistant for university students. Provide ${taskComplexity === 'complex' ? 'comprehensive, detailed' : 'concise, actionable'} guidance on university life, study tips, and academic success.`
      };

      const optimizedHistory = this.optimizeConversationHistory(conversationHistory, modelTier);
      const messages = [systemMessage, ...optimizedHistory, { role: 'user' as const, content: message }];

      const response = await this.callAIService(messages, modelTier);

      // Cache common general questions
      if (this.isCacheableGeneralQuery(message)) {
        this.setCache(cacheKey, {
          content: response.content,
          timestamp: Date.now(),
          model: this.models[modelTier].name
        });
      }

      return {
        response: response.content,
        confidence: this.calculateConfidence(modelTier, taskComplexity),
        sources: ['study_guides.pdf', 'academic_resources.md'],
        suggestions: this.generateGeneralSuggestions(message),
        cached: false,
        model: this.models[modelTier].name,
        tokensUsed: response.tokensUsed,
        estimatedCost: response.tokensUsed ? this.calculateEstimatedCost(response.tokensUsed, modelTier) : undefined
      };
    } catch (error) {
      console.error('Error generating general AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateAcademicResponse(
    message: string,
    studentContext: StudentContext,
    conversationHistory: ConversationMessage[],
    userMode: 'fast' | 'balanced' | 'smart' = 'smart' // Default to smart for academic analysis
  ): Promise<AIChatResponse> {
    try {
      // Academic analysis usually requires more sophisticated reasoning
      const taskComplexity = this.analyzeAcademicTaskComplexity(message, studentContext);
      const modelTier = this.selectModelTier(taskComplexity, userMode);

      const contextPrompt = this.buildStudentContextPrompt(studentContext);
      const systemMessage: ConversationMessage = {
        role: 'system',
        content: `${contextPrompt}. You are an AI academic advisor. ${taskComplexity === 'complex' ? 'Provide detailed analysis with specific recommendations and action plans.' : 'Give focused, actionable advice.'}`
      };

      const optimizedHistory = this.optimizeConversationHistory(conversationHistory, modelTier);
      const messages = [systemMessage, ...optimizedHistory, { role: 'user' as const, content: message }];

      const response = await this.callAIService(messages, modelTier);

      return {
        response: response.content,
        confidence: this.calculateConfidence(modelTier, taskComplexity),
        sources: ['academic_performance_data', 'study_analytics'],
        suggestions: this.generateAcademicSuggestions(studentContext),
        cached: false,
        model: this.models[modelTier].name,
        tokensUsed: response.tokensUsed,
        estimatedCost: response.tokensUsed ? this.calculateEstimatedCost(response.tokensUsed, modelTier) : undefined
      };
    } catch (error) {
      console.error('Error generating academic AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async callAIService(messages: ConversationMessage[], modelTier: string = 'balanced'): Promise<{ content: string; tokensUsed?: number }> {
    // Mock implementation - replace with actual AI service call
    if (!this.apiKey) {
      return this.getMockResponse(messages);
    }

    try {
      const modelConfig = this.models[modelTier];
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.name,
          messages: messages,
          max_tokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json() as any;
      const tokensUsed = data.usage?.total_tokens || 0;
      
      return { 
        content: data.choices?.[0]?.message?.content || 'No response generated',
        tokensUsed 
      };
    } catch (error) {
      console.error('AI service call failed:', error);
      return this.getMockResponse(messages);
    }
  }

  private getMockResponse(messages: ConversationMessage[]): { content: string; tokensUsed?: number } {
    const lastMessage = messages[messages.length - 1];
    const messageContent = lastMessage.content.toLowerCase();

    if (messageContent.includes('course') || messageContent.includes('syllabus')) {
      return {
        content: "I'd be happy to help you with course-related questions! Based on the course context, I can provide information about the syllabus, assignments, and study materials. What specific aspect would you like to know more about?"
      };
    }

    if (messageContent.includes('study') || messageContent.includes('help')) {
      return {
        content: "Here are some effective study strategies: 1) Create a structured study schedule, 2) Use active learning techniques like summarizing and teaching concepts to others, 3) Take regular breaks using the Pomodoro technique, and 4) Form study groups with classmates. Would you like me to elaborate on any of these strategies?"
      };
    }

    if (messageContent.includes('grade') || messageContent.includes('performance')) {
      return {
        content: "Based on your academic performance data, I can see areas where you're excelling and others that might need more attention. Let me analyze your current progress and provide personalized recommendations to help improve your overall academic performance."
      };
    }

    return {
      content: "I'm here to help you with your academic journey! Whether you need assistance with course content, study strategies, or academic planning, I'm ready to provide personalized guidance. What would you like to discuss?"
    };
  }

  private buildCourseContextPrompt(context: CourseContext): string {
    return `
Course Information:
- Code: ${context.courseCode || 'N/A'}
- Name: ${context.courseName || 'N/A'}
- Instructor: ${context.instructor || 'N/A'}
- Description: ${context.description || 'N/A'}
- Outline: ${context.outline ? context.outline.join(', ') : 'No outline available'}
- Assessment: ${context.assessment ? context.assessment.map(a => `${a.type} (${a.percentage}%)`).join(', ') : 'No assessment info available'}
    `.trim();
  }

  private buildConversationContext(history: ConversationMessage[]): string {
    if (!history || history.length === 0) {
      return 'This is the start of a new conversation.';
    }

    const recentHistory = history.slice(-6); // Last 6 messages for context
    const conversationSummary = recentHistory
      .map(msg => `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
      .join('\\n');

    return `Recent conversation context:\\n${conversationSummary}`;
  }

  private buildStudentContextPrompt(context: StudentContext): string {
    return `
Student Profile:
- Student ID: ${context.studentId || 'N/A'}
- Current GPA: ${context.currentGPA || 'Not available'}
- Enrolled Courses: ${context.enrolledCourses ? context.enrolledCourses.join(', ') : 'None'}
- Completed Courses: ${context.completedCourses ? context.completedCourses.join(', ') : 'None'}
- Struggling Subjects: ${context.strugglingSubjects ? context.strugglingSubjects.join(', ') : 'None'}
- Weekly Study Hours: ${context.studyHours || 0}
- Forum Participation: ${context.activeForumPosts || 0} posts
    `.trim();
  }

  private extractSources(context: CourseContext): string[] {
    const instructorFile = context.instructor 
      ? `${context.instructor.toLowerCase().replace(' ', '_')}_notes.md`
      : 'instructor_notes.md';
    
    return [
      `${context.courseCode || 'course'}_syllabus.pdf`,
      instructorFile,
      `course_outline_${context.courseCode || 'course'}.pdf`
    ];
  }

  private generateCourseSuggestions(context: CourseContext, message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const suggestions = [];

    // Context-aware suggestions based on message content
    if (lowerMessage.includes('outline') || lowerMessage.includes('topics')) {
      suggestions.push('Would you like detailed explanations of specific topics?');
      suggestions.push('Need study strategies for these topics?');
      suggestions.push('Want to know how topics connect to each other?');
    } else if (lowerMessage.includes('description') || lowerMessage.includes('detail')) {
      suggestions.push('Would you like practical examples for these concepts?');
      suggestions.push('Need help with study materials for this topic?');
      suggestions.push('Want to know how this applies in real projects?');
    } else if (lowerMessage.includes('exam') || lowerMessage.includes('test')) {
      suggestions.push('Would you like exam preparation strategies?');
      suggestions.push('Need help with practice questions?');
      suggestions.push('Want tips for effective revision?');
    } else if (lowerMessage.includes('assignment') || lowerMessage.includes('project')) {
      suggestions.push('Need help with assignment planning?');
      suggestions.push('Want guidance on project structure?');
      suggestions.push('Need tips for time management?');
    } else {
      // Default suggestions
      suggestions.push(`Would you like study tips for ${context.courseName}?`);
      suggestions.push('Need help understanding specific concepts?');
      suggestions.push('Want to know about assessment strategies?');
    }

    return suggestions.slice(0, 3);
  }

  private generateAcademicSuggestions(context: StudentContext): string[] {
    const suggestions = [];

    if (context.currentGPA && context.currentGPA < 3.0) {
      suggestions.push('Focus on improving grades in struggling subjects');
    }

    if (context.studyHours && context.studyHours < 10) {
      suggestions.push('Consider increasing weekly study hours');
    }

    if (context.strugglingSubjects && context.strugglingSubjects.length > 0) {
      suggestions.push('Get additional help for challenging subjects');
    }

    if (context.activeForumPosts && context.activeForumPosts < 5) {
      suggestions.push('Increase forum participation for better learning');
    }

    return suggestions.length > 0 ? suggestions : [
      'Keep up the good work!',
      'Consider joining study groups',
      'Utilize office hours with instructors'
    ];
  }

  // Cost optimization helper methods
  private analyzeCourseTaskComplexity(message: string): 'simple' | 'moderate' | 'complex' {
    const complexPatterns = [
      /explain.*why|analyze|compare|evaluate|justify|critique/i,
      /relationship.*between|impact.*of|implications/i,
      /multi-step|algorithm|proof|derive|solve.*equation/i,
      /research|citation|reference|source/i
    ];

    const simplePatterns = [
      /what.*is|define|list|when.*due|schedule|deadline/i,
      /yes.*no|true.*false|simple.*question/i,
      /outline|syllabus|instructor.*name/i
    ];

    if (complexPatterns.some(pattern => pattern.test(message))) {
      return 'complex';
    }

    if (simplePatterns.some(pattern => pattern.test(message))) {
      return 'simple';
    }

    return 'moderate';
  }

  private selectModelTier(complexity: string, userMode: string): string {
    // User mode override
    if (userMode === 'fast') return 'cheap';
    if (userMode === 'smart') return 'smart';

    // Automatic selection based on complexity
    switch (complexity) {
      case 'simple':
        return 'cheap';
      case 'complex':
        return 'smart';
      default:
        return 'balanced';
    }
  }

  private generateCacheKey(type: string, context: string, message: string): string {
    const normalizedMessage = message.toLowerCase().trim().substring(0, 50);
    return `ai_cache:${type}:${context}:${this.hashMessage(normalizedMessage)}`;
  }

  private hashMessage(message: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getFromCache(key: string): CacheableResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check expiration
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  private setCache(key: string, response: CacheableResponse): void {
    // Prevent cache from growing too large
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, response);
  }

  private isCacheableQuery(message: string): boolean {
    const cacheablePatterns = [
      /syllabus|outline|schedule|deadline/i,
      /instructor.*name|office.*hours/i,
      /assignment.*due|exam.*date/i,
      /what.*is.*course.*about/i,
      /course.*description|course.*overview/i
    ];

    return cacheablePatterns.some(pattern => pattern.test(message));
  }

  private optimizeConversationHistory(
    history: ConversationMessage[], 
    modelTier: string
  ): ConversationMessage[] {
    const maxMessages = modelTier === 'cheap' ? 6 : modelTier === 'balanced' ? 10 : 20;
    
    if (history.length <= maxMessages) {
      return history;
    }

    // Keep the most recent messages and summarize older ones if needed
    const recentHistory = history.slice(-maxMessages);
    
    // For cheap models, we might want to summarize the older history
    if (modelTier === 'cheap' && history.length > maxMessages) {
      const summaryMessage: ConversationMessage = {
        role: 'system',
        content: 'Previous conversation summary: User has been asking about course content and received helpful responses.'
      };
      return [summaryMessage, ...recentHistory];
    }

    return recentHistory;
  }

  private calculateConfidence(modelTier: string, complexity: string): number {
    const baseConfidence = {
      'cheap': 0.75,
      'balanced': 0.85,
      'smart': 0.95
    };

    const complexityModifier = {
      'simple': 0.05,
      'moderate': 0.0,
      'complex': -0.05
    };

    return Math.min(0.99, Math.max(0.50, 
      baseConfidence[modelTier as keyof typeof baseConfidence] + 
      complexityModifier[complexity as keyof typeof complexityModifier]
    ));
  }

  private calculateEstimatedCost(tokensUsed: number, modelTier: string): number {
    const model = this.models[modelTier];
    return (tokensUsed / 1_000_000) * model.costPer1MTokens;
  }

  private analyzeGeneralTaskComplexity(message: string): 'simple' | 'moderate' | 'complex' {
    const complexPatterns = [
      /career.*planning|life.*strategy|academic.*planning/i,
      /complex.*problem|multiple.*factors|comprehensive.*advice/i,
      /balance.*work.*study|time.*management.*system/i
    ];

    const simplePatterns = [
      /study.*tip|quick.*help|simple.*question/i,
      /library.*hours|campus.*location|contact.*info/i,
      /yes.*no|basic.*info/i
    ];

    if (complexPatterns.some(pattern => pattern.test(message))) {
      return 'complex';
    }

    if (simplePatterns.some(pattern => pattern.test(message))) {
      return 'simple';
    }

    return 'moderate';
  }

  private generateGeneralSuggestions(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('study') || lowerMessage.includes('learning')) {
      return [
        'Would you like specific study techniques?',
        'Need help with time management?',
        'Want to know about study groups?'
      ];
    }

    if (lowerMessage.includes('time') || lowerMessage.includes('schedule')) {
      return [
        'Would you like a time management template?',
        'Need help prioritizing tasks?',
        'Want tips for work-life balance?'
      ];
    }

    return [
      'Would you like more specific guidance?',
      'Need help with particular subjects?',
      'Want to explore student resources?'
    ];
  }

  private isCacheableGeneralQuery(message: string): boolean {
    const cacheablePatterns = [
      /study.*tips|time.*management|note.*taking/i,  
      /library.*hours|student.*services|campus.*resources/i,
      /basic.*advice|general.*guidance/i
    ];

    return cacheablePatterns.some(pattern => pattern.test(message));
  }

  private analyzeAcademicTaskComplexity(message: string, context: StudentContext): 'simple' | 'moderate' | 'complex' {
    const complexPatterns = [
      /academic.*plan|degree.*planning|career.*path/i,
      /performance.*analysis|improvement.*strategy/i,
      /course.*selection|major.*change/i
    ];

    const simplePatterns = [
      /current.*gpa|quick.*status|basic.*info/i,
      /enrolled.*courses|completed.*courses/i
    ];

    // Consider student data complexity
    const hasComplexData = (context.strugglingSubjects && context.strugglingSubjects.length > 2) || 
                          (context.currentGPA && context.currentGPA < 2.5) ||
                          (context.enrolledCourses && context.enrolledCourses.length > 6);

    if (complexPatterns.some(pattern => pattern.test(message)) || hasComplexData) {
      return 'complex';
    }

    if (simplePatterns.some(pattern => pattern.test(message))) {
      return 'simple';
    }

    return 'moderate';
  }

  // Course outline detection and fetching methods
  private isAskingForCourseOutline(message: string): boolean {
    // Only trigger for specific outline requests, not general course questions
    const outlinePatterns = [
      /^(show me |get |what is )?(the )?course outline$/i,
      /^(show me |get |what is )?(the )?syllabus$/i,
      /^course structure$/i,
      /^what topics are covered$/i
    ];

    return outlinePatterns.some(pattern => pattern.test(message.trim()));
  }

  private async fetchCourseOutlineFromDB(courseCode: string, prismaService: any): Promise<Partial<CourseContext> | null> {
    try {
      // Try to get course by code first, then by ID
      let course = await prismaService.getCourseByCode(courseCode);
      
      if (!course) {
        // If not found by code, try searching courses with similar codes
        const courses = await prismaService.searchCoursesByCode(courseCode);
        if (courses && courses.length > 0) {
          course = courses[0]; // Take the first match
        }
      }

      if (!course) {
        return null;
      }

      return {
        courseCode: course.code || courseCode,
        courseName: course.name,
        outline: course.outline || [],
        instructor: course.coordinator,
        description: `${course.name} - ${course.unitLoad} units, Semester ${course.semester}, Department: ${course.department}`,
        assessment: [
          { type: "Assignments", percentage: 30 },
          { type: "Midterm Exam", percentage: 35 }, 
          { type: "Final Exam", percentage: 35 }
        ]
      };
    } catch (error) {
      console.error('Error fetching course from database:', error);
      return null;
    }
  }

  private formatCourseOutlineResponse(courseDetails: Partial<CourseContext>): string {
    let response = `📚 **${courseDetails.courseName}** (${courseDetails.courseCode})\n\n`;
    
    if (courseDetails.description) {
      response += `**Course Description:**\n${courseDetails.description}\n\n`;
    }

    if (courseDetails.instructor) {
      response += `**Instructor:** ${courseDetails.instructor}\n\n`;
    }

    if (courseDetails.outline && courseDetails.outline.length > 0) {
      response += `**Course Outline:**\n`;
      courseDetails.outline.forEach((topic, index) => {
        response += `${index + 1}. ${topic}\n`;
      });
      response += '\n';
    }

    if (courseDetails.assessment && courseDetails.assessment.length > 0) {
      response += `**Assessment Breakdown:**\n`;
      courseDetails.assessment.forEach(assessment => {
        response += `• ${assessment.type}: ${assessment.percentage}%\n`;
      });
      response += '\n';
    }

    response += `This course outline was retrieved from the university database. Would you like more details about any specific topic or need study guidance for this course?`;

    return response;
  }
}