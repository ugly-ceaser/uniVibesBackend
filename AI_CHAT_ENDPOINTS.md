# AI Chat Endpoints Documentation

## 🤖 **AI Chat Endpoints**

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## 1. **Course-Specific AI Chat**

### **Endpoint:** `POST /api/v1/ai/chat/course`

**Description:** Get AI assistance tailored to specific course content and context.

### **Request Object:**
```json
{
  "message": "Show me the course outline",
  "courseId": "CS101",
  "context": {
    "courseCode": "CS101",
    "courseName": "Introduction to Programming",
    "outline": [
      "Variables and Data Types",
      "Functions and Loops",
      "Object-Oriented Programming"
    ],
    "assessment": [
      {"type": "Assignment", "percentage": 30},
      {"type": "Midterm Exam", "percentage": 35},
      {"type": "Final Exam", "percentage": 35}
    ],
    "instructor": "Dr. Smith",
    "description": "Foundational programming course covering basic to intermediate concepts"
  },
  "conversationHistory": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help with CS101?"}
  ],
  "userMode": "balanced"  // Optional: "fast" | "balanced" | "smart"
}
```

### **Response Object:**
```json
{
  "data": {
    "response": "Here's the course outline for CS101: Introduction to Programming...",
    "confidence": 0.95,
    "sources": ["course_syllabus.pdf", "instructor_notes.md"],
    "suggestions": [
      "Would you like study tips for any specific topic?",
      "Need help understanding the assessment breakdown?",
      "Want to know more about the instructor's teaching style?"
    ],
    "cached": false,
    "model": "gpt-4o-mini",
    "tokensUsed": 150,
    "estimatedCost": 0.0000225
  },
  "message": "AI response generated successfully",
  "timestamp": "2025-10-04T10:30:00Z",
  "sessionId": "session-uuid-here"
}
```

---

## 2. **General AI Chat**

### **Endpoint:** `POST /api/v1/ai/chat/general`

**Description:** Get broad AI assistance for general university life questions and guidance.

### **Request Object:**
```json
{
  "message": "How can I improve my study habits?",
  "conversationHistory": [
    {"role": "user", "content": "I'm struggling with time management"},
    {"role": "assistant", "content": "Time management is crucial for academic success..."}
  ],
  "userMode": "balanced"  // Optional: "fast" | "balanced" | "smart"
}
```

### **Response Object:**
```json
{
  "data": {
    "response": "Here are some effective study strategies for university students: 1. Create a structured study schedule...",
    "confidence": 0.88,
    "sources": ["study_guides.pdf", "academic_resources.md"],
    "suggestions": [
      "Would you like time management tips?",
      "Need help with specific subjects?",
      "Want to learn about study groups?"
    ],
    "cached": false,
    "model": "gpt-4o-mini",
    "tokensUsed": 120,
    "estimatedCost": 0.000018
  },
  "message": "AI response generated successfully",
  "timestamp": "2025-10-04T10:30:00Z",
  "sessionId": "session-uuid-here"
}
```

---

## 3. **Academic Progress AI Chat**

### **Endpoint:** `POST /api/v1/ai/chat/academic`

**Description:** Get personalized academic performance analysis and recommendations.

### **Request Object:**
```json
{
  "message": "How is my academic performance this semester?",
  "studentContext": {
    "studentId": "12345",
    "currentGPA": 3.2,
    "enrolledCourses": ["CS101", "MATH201", "ENG102"],
    "completedCourses": ["CS100", "MATH101"],
    "strugglingSubjects": ["Calculus", "Data Structures"],
    "studyHours": 15,
    "activeForumPosts": 8
  },
  "conversationHistory": [],
  "userMode": "smart"  // Optional: "fast" | "balanced" | "smart" (defaults to "smart")
}
```

### **Response Object:**
```json
{
  "data": {
    "response": "Based on your current GPA of 3.2 and study patterns, here's my analysis...",
    "confidence": 0.92,
    "sources": ["academic_performance_data", "study_analytics"],
    "suggestions": [
      "Focus more time on struggling subjects",
      "Consider forming study groups",
      "Utilize office hours for difficult topics"
    ],
    "cached": false,
    "model": "gpt-4o",
    "tokensUsed": 200,
    "estimatedCost": 0.0005
  },
  "message": "Academic analysis completed",
  "timestamp": "2025-10-04T10:30:00Z",
  "sessionId": "session-uuid-here"
}
```

---

## 🧠 **AI Insights Endpoints**

## 4. **Get Course Insights**

### **Endpoint:** `GET /api/v1/ai/insights/course/{courseId}`

**Description:** Get AI-generated study plans and course-specific insights.

### **Request Parameters:**
- **Path:** `courseId` (string, required) - Course identifier

### **Response Object:**
```json
{
  "data": {
    "studyPlan": [
      "Week 1-2: Master variables and basic syntax",
      "Week 3-4: Practice functions and control structures",
      "Week 5-6: Dive into object-oriented concepts"
    ],
    "keyTopics": [
      "Variables and Data Types",
      "Functions and Methods",
      "Loops and Conditionals",
      "Object-Oriented Programming"
    ],
    "assessmentTips": [
      "Start assignments early to avoid last-minute rush",
      "Review past exam questions for pattern recognition",
      "Practice coding problems daily for 30 minutes"
    ],
    "resources": [
      "textbook_chapters_1-5.pdf",
      "practice_problems_set1.md",
      "video_tutorials_basics.mp4"
    ],
    "difficultyRating": "Intermediate",
    "estimatedStudyHours": 8
  },
  "message": "Course insights generated successfully"
}
```

---

## 5. **Get Personalized Recommendations**

### **Endpoint:** `POST /api/v1/ai/recommendations/course/{courseId}`

**Description:** Generate personalized study recommendations based on student progress.

### **Request Parameters:**
- **Path:** `courseId` (string, required) - Course identifier

### **Request Object:**
```json
{
  "studentData": {
    "completedTopics": ["Variables", "Functions", "Basic Loops"],
    "strugglingAreas": ["Nested Loops", "Arrays", "Object Methods"],
    "studyHours": 15,
    "lastAssignmentScore": 75,
    "attendanceRate": 0.85,
    "forumParticipation": "moderate"
  }
}
```

### **Response Object:**
```json
{
  "data": {
    "recommendations": [
      "Spend extra 2 hours weekly on nested loops practice",
      "Join study group for object-oriented programming",
      "Complete additional practice problems for arrays"
    ],
    "focusAreas": [
      "Nested control structures",
      "Array manipulation",
      "Object method implementation"
    ],
    "timeAllocation": {
      "nested_loops": 3,
      "arrays": 4,
      "object_methods": 3,
      "review": 2
    },
    "nextSteps": [
      "Complete practice set #3 by next week",
      "Attend Thursday's review session",
      "Schedule office hours with instructor"
    ]
  },
  "message": "Personalized recommendations generated"
}
```

---

## 💬 **Chat Session Management Endpoints**

## 6. **Get User Chat Sessions**

### **Endpoint:** `GET /api/v1/ai/sessions`

**Description:** Retrieve all chat sessions for the authenticated user.

### **Response Object:**
```json
{
  "data": [
    {
      "id": "session-uuid-1",
      "studentId": "user-uuid",
      "title": "CS101: Course outline question",
      "createdAt": "2025-10-04T10:00:00Z",
      "messages": [
        {
          "id": "msg-uuid-1",
          "role": "user",
          "content": "Show me the course outline",
          "createdAt": "2025-10-04T10:00:00Z"
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

## 7. **Get Specific Chat Session**

### **Endpoint:** `GET /api/v1/ai/sessions/{sessionId}`

**Description:** Retrieve a specific chat session with all messages.

### **Request Parameters:**
- **Path:** `sessionId` (string, required) - Chat session ID

### **Response Object:**
```json
{
  "data": {
    "id": "session-uuid",
    "studentId": "user-uuid",
    "title": "CS101: Course outline question",
    "createdAt": "2025-10-04T10:00:00Z",
    "messages": [
      {
        "id": "msg-uuid-1",
        "role": "user",
        "content": "Show me the course outline",
        "createdAt": "2025-10-04T10:00:00Z"
      },
      {
        "id": "msg-uuid-2",
        "role": "assistant",
        "content": "Here's the course outline for CS101...",
        "createdAt": "2025-10-04T10:00:05Z"
      }
    ]
  },
  "message": "Chat session retrieved successfully"
}
```

---

## 8. **Delete Chat Session**

### **Endpoint:** `DELETE /api/v1/ai/sessions/{sessionId}`

**Description:** Delete a specific chat session and all its messages.

### **Request Parameters:**
- **Path:** `sessionId` (string, required) - Chat session ID

### **Response Object:**
```json
{
  "message": "Chat session deleted successfully"
}
```

---

## 🔧 **Common Request/Response Properties**

### **User Mode Options (Cost Optimization):**
- **`"fast"`** - Uses gpt-3.5-turbo (~$0.50/1M tokens) - 10x cheaper
- **`"balanced"`** - Uses gpt-4o-mini (~$0.15/1M tokens) - 17x cheaper (default)
- **`"smart"`** - Uses gpt-4o (~$2.50/1M tokens) - Premium quality

### **Conversation History Format:**
```json
{
  "role": "user|assistant|system",
  "content": "Message content here"
}
```

### **Common Error Response:**
```json
{
  "error": "ValidationError",
  "message": "Message content exceeds maximum length",
  "details": {
    "field": "message",
    "maxLength": 500,
    "actualLength": 750
  },
  "status": 400,
  "timestamp": "2025-10-04T10:30:00Z"
}
```

---

## 🔐 **Authentication Requirements**

All endpoints require:
- **Header:** `Authorization: Bearer <jwt_token>`
- **Content-Type:** `application/json`

### **Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/chat/general \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I improve my study habits?",
    "userMode": "balanced"
  }'
```

---

## 📊 **Rate Limiting**

- **30 requests per minute** per authenticated user
- **500 character limit** on message content
- **20 message limit** on conversation history
- **Cache timeout:** 30 minutes for common queries