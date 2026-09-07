#!/usr/bin/env node

/**
 * Test Script for Course-Specific Chat Functionality
 * 
 * This script demonstrates the new course-specific chat features
 */

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/v1`;

// Example test cases for course-specific chat
const testCases = [
  {
    name: "Get Course Chat Sessions",
    endpoint: `${API_BASE}/ai/courses/course-uuid-123/chats`,
    method: "GET",
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
    },
    description: "Retrieve all chat sessions for a specific course"
  },
  {
    name: "Get or Create Course Chat Session",
    endpoint: `${API_BASE}/ai/courses/course-uuid-123/chats/session`,
    method: "GET",
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
    },
    description: "Get existing or create new chat session for a course"
  },
  {
    name: "Start Course-Specific Chat",
    endpoint: `${API_BASE}/ai/chat/course`,
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
    },
    data: {
      message: "What are the main topics covered in this course?",
      courseId: "course-uuid-123",
      context: {
        courseCode: "CSC101",
        courseName: "Introduction to Computer Science",
        outline: [
          "Programming Fundamentals",
          "Data Structures",
          "Algorithms",
          "Software Engineering"
        ]
      },
      conversationHistory: []
    },
    description: "Send a message to course-specific AI chat"
  },
  {
    name: "Continue Course Chat",
    endpoint: `${API_BASE}/ai/chat/course`,
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
    },
    data: {
      message: "Can you elaborate on data structures?",
      courseId: "course-uuid-123",
      context: {
        courseCode: "CSC101",
        courseName: "Introduction to Computer Science"
      },
      conversationHistory: [
        {
          role: "user",
          content: "What are the main topics covered in this course?"
        },
        {
          role: "assistant", 
          content: "The main topics in CSC101 include Programming Fundamentals, Data Structures, Algorithms, and Software Engineering..."
        }
      ]
    },
    description: "Continue the course conversation with context"
  }
];

console.log(`
🎯 Course-Specific Chat Functionality Test Guide
===============================================

The AI chat system now supports course-specific chat sessions:

✨ New Features:
- 📚 Chat sessions organized by course
- 🔄 Automatic session creation/retrieval per course  
- 📝 Full conversation history per course
- 🎯 Context-aware AI responses based on course
- 🔍 Easy access to previous course discussions

📋 Test Cases:
`);

testCases.forEach((testCase, index) => {
  console.log(`
${index + 1}. ${testCase.name}
   📍 ${testCase.method} ${testCase.endpoint}
   📖 ${testCase.description}
   
   ${testCase.data ? `📤 Request Body:\n   ${JSON.stringify(testCase.data, null, 6)}` : '📤 No request body required'}
`);
});

console.log(`
🚀 How to Test Course-Specific Chat:

1. 🗄️ Run Database Migration:
   ./run-migration.bat
   (This adds courseId to ChatSession table)

2. 🔑 Get Authentication Token:
   POST ${API_BASE}/auth/login
   
3. 📚 Get Course ID:
   - Use an existing course ID from your database
   - Or create a course first via your course endpoints

4. 🧪 Test the Endpoints:
   - Replace 'YOUR_JWT_TOKEN_HERE' with your actual token
   - Replace 'course-uuid-123' with a real course ID
   - Make requests to the endpoints above

📊 Expected Workflow:

1. User selects a course in the frontend
2. Frontend calls GET /courses/{courseId}/chats to load chat history
3. If no session exists, call GET /courses/{courseId}/chats/session to create one
4. Use POST /chat/course to send messages (automatically uses course session)
5. All messages are saved and organized by course

📱 Frontend Integration Example:

// Get course chat history
const courseChats = await getCourseChats('course-uuid-123');

// Start/continue course chat
const session = await startCourseChat('course-uuid-123');

// Send message to course chat
const response = await sendCourseMessage(
  'course-uuid-123',
  'Explain inheritance in OOP',
  { courseCode: 'CSC101', courseName: 'Intro to CS' }
);

🎯 Benefits:

✅ Organized chat history by subject
✅ Context continuity within courses  
✅ Easy access to previous discussions
✅ Better learning experience
✅ Course-specific AI assistance
✅ Academic progress tracking

🔐 Security Features:

✅ User can only access their own course chats
✅ Course authorization validation
✅ Session ownership verification
✅ JWT authentication required

Happy testing! 🎉

Database Schema Changes Applied:
- ✅ Added courseId to ChatSession model
- ✅ Added relationship between Course and ChatSession
- ✅ Added database index for fast retrieval
- ✅ Maintained backward compatibility

API Enhancements:
- ✅ Course-specific chat session endpoints
- ✅ Enhanced chat creation with course linking
- ✅ Comprehensive Swagger documentation
- ✅ Proper error handling and validation
`);

// Export for programmatic use
module.exports = {
  testCases,
  BASE_URL,
  API_BASE
};