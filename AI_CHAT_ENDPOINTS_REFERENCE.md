# 🔌 AI Chat API Endpoints Reference

## 📋 **Overview**
Complete reference for all AI chat endpoints with descriptions, request/response formats, and usage examples.

---

## 🎯 **Core AI Chat Endpoints**

### **1. Course-Specific AI Chat**
```http
POST /api/v1/ai/chat/course
```

**Description**: Engage in AI conversations specific to a course. Automatically manages course-specific chat sessions and maintains conversation context.

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "message": "Can you explain the course outline for this subject?",
  "courseId": "61a61b34-68fc-4f2c-989d-8d86214b4bd9",
  "context": {
    "courseCode": "CSC101",
    "courseName": "Introduction to Computer Science",
    "outline": ["History of Computing", "Basic Logic Gates", "Binary Number System"],
    "instructor": "Dr. Computer Adebayo"
  },
  "conversationHistory": [
    {
      "role": "user",
      "content": "What is this course about?"
    },
    {
      "role": "assistant", 
      "content": "This course introduces fundamental concepts of computer science..."
    }
  ],
  "userMode": "balanced"
}
```

**Response**:
```json
{
  "data": {
    "response": "📚 **Introduction to Computer Science** (CSC101)\n\n**Course Description:**\nIntroduction to Computer Science - 3 units, Semester 1...",
    "confidence": 0.98,
    "sources": ["CSC101_syllabus.pdf", "dr._computer adebayo_notes.md"],
    "suggestions": [
      "Would you like more details about any specific topic?",
      "Need help with study strategies for this course?"
    ],
    "cached": false,
    "model": "database_lookup",
    "tokensUsed": 0,
    "estimatedCost": 0
  },
  "message": "AI response generated successfully",
  "timestamp": "2025-10-04T03:20:01.414Z",
  "sessionId": "4cbeb40b-9673-4e6f-8455-b60643603480"
}
```

**Usage Example**:
```bash
curl -X POST "http://localhost:3000/api/v1/ai/chat/course" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me the course outline",
    "courseId": "61a61b34-68fc-4f2c-989d-8d86214b4bd9",
    "context": {
      "courseCode": "CSC101",
      "courseName": "Introduction to Computer Science"
    }
  }'
```

---

### **2. General AI Chat**
```http
POST /api/v1/ai/chat/general
```

**Description**: General-purpose AI chat for non-course-specific questions about academics, campus life, or general inquiries.

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "message": "What are some effective study techniques?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "I'm struggling with time management"
    },
    {
      "role": "assistant",
      "content": "Here are some time management strategies..."
    }
  ]
}
```

**Response**:
```json
{
  "data": {
    "response": "Here are some proven study techniques that can help improve your learning...",
    "confidence": 0.92,
    "sources": ["study_guides.pdf", "academic_success_tips.md"],
    "suggestions": [
      "Would you like specific techniques for your subjects?",
      "Need help creating a study schedule?"
    ],
    "cached": false,
    "model": "gpt-4o-mini"
  },
  "message": "AI response generated successfully",
  "timestamp": "2025-10-04T10:30:15.123Z"
}
```

---

### **3. Academic AI Chat**
```http
POST /api/v1/ai/chat/academic
```

**Description**: Specialized AI chat for academic counseling, course selection, and personalized academic guidance.

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "message": "What courses should I take next semester based on my current progress?",
  "studentContext": {
    "studentId": "user-uuid-789",
    "currentGPA": 3.5,
    "enrolledCourses": ["CSC101", "MATH201"],
    "completedCourses": ["CSC100", "MATH101"],
    "strugglingSubjects": ["Mathematics"],
    "studyHours": 20,
    "activeForumPosts": 15
  },
  "conversationHistory": []
}
```

**Response**:
```json
{
  "data": {
    "response": "Based on your academic progress and current GPA of 3.5, here are my recommendations for next semester...",
    "confidence": 0.89,
    "sources": ["academic_catalog.pdf", "prerequisite_guide.md"],
    "suggestions": [
      "Would you like detailed information about any specific course?",
      "Need help planning your study schedule?"
    ],
    "cached": false,
    "model": "gpt-4o-mini"
  },
  "message": "AI response generated successfully",
  "timestamp": "2025-10-04T10:45:22.456Z"
}
```

---

## 🏗️ **Session Management Endpoints**

### **4. Get Course Chat Sessions**
```http
GET /api/v1/ai/courses/{courseId}/chats
```

**Description**: Retrieve all chat sessions for a specific course, including session metadata and recent messages.

**Authentication**: Required (Bearer Token)

**Parameters**:
- `courseId` (path) - The UUID of the course

**Response**:
```json
{
  "data": {
    "course": {
      "id": "61a61b34-68fc-4f2c-989d-8d86214b4bd9",
      "name": "Introduction to Computer Science",
      "code": "CSC101"
    },
    "sessions": [
      {
        "id": "4cbeb40b-9673-4e6f-8455-b60643603480",
        "title": "CSC101: Show me the course outline...",
        "createdAt": "2025-10-04T03:19:57.291Z",
        "messages": [
          {
            "id": "msg-uuid-1",
            "role": "assistant",
            "content": "📚 **Introduction to Computer Science** (CSC101)...",
            "createdAt": "2025-10-04T03:20:01.414Z"
          }
        ],
        "_count": {
          "messages": 2
        }
      }
    ]
  },
  "message": "Course chat sessions retrieved successfully"
}
```

**Usage Example**:
```bash
curl -X GET "http://localhost:3000/api/v1/ai/courses/61a61b34-68fc-4f2c-989d-8d86214b4bd9/chats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### **5. Get or Create Course Chat Session**
```http
GET /api/v1/ai/courses/{courseId}/chats/session
```

**Description**: Get an existing active chat session for a course or create a new one if none exists. Ensures one active session per student per course.

**Authentication**: Required (Bearer Token)

**Parameters**:
- `courseId` (path) - The UUID of the course

**Response**:
```json
{
  "data": {
    "session": {
      "id": "4cbeb40b-9673-4e6f-8455-b60643603480",
      "studentId": "bdd3a128-8981-41ca-92c6-0923ecc385bb",
      "courseId": "61a61b34-68fc-4f2c-989d-8d86214b4bd9",
      "title": "CSC101 Chat Session",
      "createdAt": "2025-10-04T03:19:57.291Z",
      "messages": [
        {
          "id": "msg-uuid-1",
          "role": "user",
          "content": "Show me the course outline",
          "createdAt": "2025-10-04T03:19:57.291Z"
        },
        {
          "id": "msg-uuid-2",
          "role": "assistant",
          "content": "📚 **Introduction to Computer Science** (CSC101)...",
          "createdAt": "2025-10-04T03:20:01.414Z"
        }
      ]
    },
    "course": {
      "id": "61a61b34-68fc-4f2c-989d-8d86214b4bd9",
      "name": "Introduction to Computer Science",
      "code": "CSC101"
    }
  },
  "message": "Course chat session ready"
}
```

---

### **6. Get All User Chat Sessions**
```http
GET /api/v1/ai/sessions
```

**Description**: Retrieve all chat sessions for the authenticated user across all courses and session types.

**Authentication**: Required (Bearer Token)

**Response**:
```json
{
  "data": [
    {
      "id": "session-uuid-1",
      "title": "CSC101 Chat Session",
      "createdAt": "2025-10-04T03:19:57.291Z",
      "messages": [
        {
          "id": "msg-uuid",
          "role": "assistant",
          "content": "Latest message preview...",
          "createdAt": "2025-10-04T03:20:01.414Z"
        }
      ],
      "_count": {
        "messages": 5
      }
    }
  ],
  "message": "Chat sessions retrieved successfully"
}
```

---

### **7. Get Specific Chat Session**
```http
GET /api/v1/ai/sessions/{sessionId}
```

**Description**: Retrieve a specific chat session with full conversation history.

**Authentication**: Required (Bearer Token)

**Parameters**:
- `sessionId` (path) - The UUID of the chat session

**Response**:
```json
{
  "data": {
    "id": "4cbeb40b-9673-4e6f-8455-b60643603480",
    "title": "CSC101 Chat Session",
    "createdAt": "2025-10-04T03:19:57.291Z",
    "messages": [
      {
        "id": "msg-uuid-1",
        "role": "user",
        "content": "Show me the course outline",
        "createdAt": "2025-10-04T03:19:57.291Z"
      },
      {
        "id": "msg-uuid-2",
        "role": "assistant",
        "content": "📚 **Introduction to Computer Science** (CSC101)...",
        "createdAt": "2025-10-04T03:20:01.414Z"
      }
    ]
  },
  "message": "Chat session retrieved successfully"
}
```

---

### **8. Delete Chat Session**
```http
DELETE /api/v1/ai/sessions/{sessionId}
```

**Description**: Delete a specific chat session and all its messages.

**Authentication**: Required (Bearer Token)

**Parameters**:
- `sessionId` (path) - The UUID of the chat session to delete

**Response**:
```json
{
  "message": "Chat session deleted successfully"
}
```

---

## 📚 **Course Information Endpoints**

### **9. Get Course Outline**
```http
GET /api/v1/ai/course/{courseId}/outline
```

**Description**: Get detailed course outline information including topics, assessment, and instructor details.

**Authentication**: Required (Bearer Token)

**Parameters**:
- `courseId` (path) - The UUID or code of the course

**Response**:
```json
{
  "data": {
    "courseCode": "CSC101",
    "courseName": "Introduction to Computer Science",
    "instructor": "Dr. Computer Adebayo",
    "department": "Computer Science",
    "unitLoad": 3,
    "semester": 1,
    "outline": [
      "History of Computing",
      "Basic Logic Gates",
      "Binary Number System",
      "Overview of Programming Languages",
      "Problem-Solving in CS"
    ],
    "description": "Introduction to Computer Science - 3 units, Semester 1"
  },
  "message": "Course outline retrieved successfully"
}
```

---

## 🎯 **Analytics & Insights Endpoints**

### **10. Get Course Insights**
```http
GET /api/v1/ai/insights/course/{courseId}
```

**Description**: Get AI-generated insights and study recommendations for a specific course.

**Authentication**: Required (Bearer Token)

**Parameters**:
- `courseId` (path) - The UUID of the course

**Response**:
```json
{
  "data": {
    "studyPlan": [
      "Week 1-2: Master History of Computing",
      "Week 3-4: Practice Basic Logic Gates",
      "Week 5-6: Dive into Binary Number System"
    ],
    "keyTopics": [
      "History of Computing",
      "Basic Logic Gates",
      "Binary Number System"
    ],
    "assessmentTips": [
      "Start assignments early to avoid last-minute rush",
      "Review past exam questions for pattern recognition",
      "Practice problems daily for better understanding"
    ],
    "resources": [
      "CSC101_textbook.pdf",
      "CSC101_practice_problems.md",
      "CSC101_video_tutorials.mp4"
    ],
    "difficultyRating": "Beginner",
    "estimatedStudyHours": 6
  },
  "message": "Course insights generated successfully"
}
```

---

### **11. Get Personalized Recommendations**
```http
GET /api/v1/ai/recommendations
```

**Description**: Get personalized study recommendations based on user's academic performance and preferences.

**Authentication**: Required (Bearer Token)

**Response**:
```json
{
  "data": {
    "recommendations": [
      "Keep up the excellent work!",
      "Continue with current study patterns",
      "Consider helping other students"
    ],
    "focusAreas": [
      "Review and reinforcement"
    ],
    "timeAllocation": {
      "review": 2,
      "practice": 3,
      "new_topics": 4
    },
    "nextSteps": [
      "Complete next assignment early",
      "Attend upcoming review session",
      "Form study group with classmates"
    ]
  },
  "message": "Personalized recommendations generated successfully"
}
```

---

## 🔐 **Authentication**

All endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer your_jwt_token_here
```

### **Getting a Token**:
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "your_password"
  }'
```

---

## 📱 **Usage Examples**

### **Complete Chat Flow Example**:
```bash
# 1. Login to get token
TOKEN=$(curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password"}' \
  | jq -r '.data.token')

# 2. Get available courses
curl -X GET "http://localhost:3000/api/v1/courses" \
  -H "Authorization: Bearer $TOKEN"

# 3. Start a course chat session
curl -X GET "http://localhost:3000/api/v1/ai/courses/COURSE_ID/chats/session" \
  -H "Authorization: Bearer $TOKEN"

# 4. Ask about course outline
curl -X POST "http://localhost:3000/api/v1/ai/chat/course" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What topics are covered in this course?",
    "courseId": "COURSE_ID",
    "context": {
      "courseCode": "CSC101",
      "courseName": "Introduction to Computer Science"
    }
  }'

# 5. View chat history
curl -X GET "http://localhost:3000/api/v1/ai/courses/COURSE_ID/chats" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚡ **Error Responses**

All endpoints return consistent error responses:

```json
{
  "error": "ValidationError",
  "message": "Course ID is required",
  "status": 400
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## 🎯 **Testing with Seeded Data**

Your database has **240 courses** seeded. You can use any course ID from:
- Computer Science courses (CSC101, CSC102, etc.)
- Mathematics courses (MATH101, MATH102, etc.)
- Engineering courses (ENG101, ENG102, etc.)

Get course IDs using: `GET /api/v1/courses`

---

## 🚀 **Server Information**

- **Base URL**: `http://localhost:3000`
- **API Base**: `http://localhost:3000/api/v1`
- **Documentation**: Available at `/api-docs` (Swagger UI)
- **Status**: All endpoints are functional and ready for testing

---

This comprehensive API provides everything needed for an intelligent, course-aware AI chat system with full conversation management and analytics! 🎉