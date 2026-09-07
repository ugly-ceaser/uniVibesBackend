# Course-Specific Chat History Implementation 🎯

## Overview

The AI chat system has been refactored to support **course-specific chat sessions**, allowing users to organize their AI conversations by course and easily retrieve their previous chat history for specific courses.

## 🗄️ Database Schema Changes

### Updated ChatSession Model
```prisma
model ChatSession {
  id         String       @id @default(uuid())
  student    User         @relation(fields: [studentId], references: [id])
  studentId  String
  course     Course?      @relation(fields: [courseId], references: [id])
  courseId   String?      // NEW: Link to specific course
  title      String?
  createdAt  DateTime     @default(now())
  messages   ChatMessage[]

  @@index([studentId, courseId]) // NEW: Fast retrieval index
}
```

### Updated Course Model
```prisma
model Course {
  id           String        @id @default(uuid())
  name         String
  code         String
  // ... other fields
  chatSessions ChatSession[] // NEW: Course-specific chat sessions
}
```

## 🔧 Service Layer Enhancements

### New Methods in `ai-chat.service.ts`

#### 1. **getUserChatSessionsByCourse**
```typescript
getUserChatSessionsByCourse: async (studentId: string, courseId: string)
```
- Retrieves all chat sessions for a specific user and course
- Returns sessions with latest message and message count
- Ordered by creation date (newest first)

#### 2. **getOrCreateCourseChat**
```typescript
getOrCreateCourseChat: async (studentId: string, courseId: string, title?: string)
```
- Finds existing chat session for the course
- Creates new session if none exists
- Returns session with full message history
- Ensures one active chat session per course per user

### Updated Methods

#### **createChatSession**
- Now accepts optional `courseId` parameter
- Links chat sessions to specific courses
- Maintains backward compatibility for general chats

## 🎯 API Endpoints

### 1. **Get Course Chat Sessions**
```http
GET /api/v1/ai/courses/{courseId}/chats
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "data": {
    "course": {
      "id": "course-uuid-123",
      "name": "Introduction to Computer Science",
      "code": "CSC101"
    },
    "sessions": [
      {
        "id": "session-uuid-456",
        "title": "CSC101: Show me the course outline...",
        "createdAt": "2025-10-04T10:00:00Z",
        "messages": [...], // Latest message
        "_count": {
          "messages": 15
        }
      }
    ]
  },
  "message": "Course chat sessions retrieved successfully"
}
```

### 2. **Get or Create Course Chat Session**
```http
GET /api/v1/ai/courses/{courseId}/chats/session
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "data": {
    "session": {
      "id": "session-uuid-456",
      "studentId": "user-uuid-789",
      "courseId": "course-uuid-123",
      "title": "CSC101 Chat Session",
      "createdAt": "2025-10-04T10:00:00Z",
      "messages": [...] // Full conversation history
    },
    "course": {
      "id": "course-uuid-123",
      "name": "Introduction to Computer Science",
      "code": "CSC101"
    }
  },
  "message": "Course chat session ready"
}
```

### 3. **Enhanced Course AI Chat**
```http
POST /api/v1/ai/chat/course
```
- Now automatically creates/uses course-specific chat sessions
- Links conversations to the specified course
- Maintains conversation context within the course

## 🔄 Migration Guide

### Step 1: Run Database Migration
```bash
# Run the migration script
./run-migration.bat

# Or manually:
npx prisma migrate dev --name add_course_id_to_chat_session
npx prisma generate
```

### Step 2: Updated Usage Patterns

#### **Frontend Integration Example**
```typescript
// Get chat history for a specific course
const getCourseChats = async (courseId: string) => {
  const response = await fetch(`/api/v1/ai/courses/${courseId}/chats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Start or continue course chat
const startCourseChat = async (courseId: string) => {
  const response = await fetch(`/api/v1/ai/courses/${courseId}/chats/session`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Send message to course chat
const sendCourseMessage = async (courseId: string, message: string, context: CourseContext) => {
  const response = await fetch('/api/v1/ai/chat/course', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      courseId,
      context,
      conversationHistory: [] // Previous messages from session
    })
  });
  return response.json();
};
```

## 🎨 UI/UX Implications

### Course-Specific Chat Organization
```
📚 My Courses
├── 🖥️ CSC101 - Intro to Computer Science
│   ├── 💬 Chat History (15 messages)
│   ├── 📋 Course Outline
│   └── 🎯 AI Assistant
├── 🧮 MATH201 - Calculus II  
│   ├── 💬 Chat History (8 messages)
│   └── 🎯 AI Assistant
└── 📖 ENG102 - Technical Writing
    ├── 💬 Chat History (22 messages)
    └── 🎯 AI Assistant
```

### Benefits for Users
1. **Organized Conversations**: Chat history grouped by course
2. **Context Continuity**: AI remembers previous course discussions
3. **Easy Navigation**: Quick access to course-specific chat history
4. **Academic Progress**: Track learning discussions per course

## 🔐 Security & Privacy

- **User Isolation**: Users can only access their own course chats
- **Course Authorization**: Validates course access permissions
- **Session Ownership**: Chat sessions tied to specific user-course combinations
- **Data Privacy**: Course-specific data remains isolated

## 🚀 Performance Optimizations

- **Database Indexing**: `@@index([studentId, courseId])` for fast retrieval
- **Lazy Loading**: Load chat history only when requested
- **Caching Strategy**: Course information cached for frequent access
- **Pagination Support**: Message history can be paginated for large conversations

## 📊 Usage Analytics Possibilities

With course-specific chat sessions, you can now track:
- Most discussed topics per course
- Student engagement levels by course
- AI assistance patterns across different subjects
- Course-specific learning difficulties

## 🔄 Backward Compatibility

- Existing general chat sessions remain functional
- Non-course-specific chats have `courseId: null`
- All existing API endpoints continue to work
- Gradual migration path for existing users

## 🎯 Next Steps

1. **Run the database migration** using the provided script
2. **Update your frontend** to use course-specific endpoints
3. **Test the new functionality** with existing courses
4. **Consider UI/UX improvements** for course-based chat organization
5. **Monitor performance** and optimize as needed

This implementation provides a solid foundation for course-organized AI chat functionality while maintaining full backward compatibility! 🚀