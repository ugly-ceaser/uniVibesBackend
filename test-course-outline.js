#!/usr/bin/env node

/**
 * Test Script for Course Outline Functionality
 * 
 * This script demonstrates how the AI chat system now detects when users
 * ask for course outlines and retrieves formatted course data from the database.
 */

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/v1`;

// Example test cases
const testCases = [
  {
    name: "Course Chat with Outline Request",
    endpoint: `${API_BASE}/ai/chat/course`,
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
    },
    data: {
      message: "Can you show me the course outline for CSC101?",
      conversationHistory: [],
      courseContext: {
        courseCode: "CSC101"
      }
    }
  },
  {
    name: "Direct Course Outline Endpoint",
    endpoint: `${API_BASE}/ai/course/CSC101/outline`,
    method: "GET",
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
    }
  },
  {
    name: "General Chat with Outline Question",
    endpoint: `${API_BASE}/ai/chat/general`,
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
    },
    data: {
      message: "What topics are covered in the outline for Data Structures course?",
      conversationHistory: []
    }
  }
];

console.log(`
🚀 Course Outline Functionality Test Guide
==========================================

The AI chat system has been enhanced with course outline functionality:

1. **Automatic Detection**: The AI can detect when users ask about course outlines
2. **Database Integration**: Fetches real course data from the database
3. **Formatted Response**: Returns well-structured course outline information
4. **Multiple Access Points**: Available through chat endpoints and dedicated outline endpoint

📝 Test Cases:
`);

testCases.forEach((testCase, index) => {
  console.log(`
${index + 1}. ${testCase.name}
   ${testCase.method} ${testCase.endpoint}
   
   Example request:
   ${testCase.data ? JSON.stringify(testCase.data, null, 2) : 'No body required'}
`);
});

console.log(`
🔧 How to Test:

1. Start the server: npm run dev
2. Get a JWT token by logging in through /api/v1/auth/login
3. Replace 'YOUR_JWT_TOKEN_HERE' with your actual token
4. Make requests to the endpoints above

📊 Expected Response Format:

For course outline requests, you'll get responses like:

{
  "data": {
    "courseCode": "CSC101",
    "courseName": "Introduction to Computer Science",
    "instructor": "Dr. Smith",
    "department": "Computer Science",
    "unitLoad": 3,
    "semester": 1,
    "outline": [
      "Introduction to Programming",
      "Data Types and Variables",
      "Control Structures",
      "Functions and Procedures"
    ],
    "description": "Introduction to Computer Science - 3 units, Semester 1"
  },
  "message": "Course outline retrieved successfully"
}

🤖 AI Chat Integration:

When asking questions like:
- "Show me the course outline for [course code]"
- "What topics are covered in [course name]?"
- "Can I see the syllabus for [course]?"

The AI will automatically:
1. Detect it's an outline request
2. Search for the course in the database
3. Format and return the course outline information
4. Provide context about the course structure

🎯 Key Features:

✅ Automatic course outline detection in natural language
✅ Database integration for real course data
✅ Formatted response with course details
✅ Support for both course codes and course names
✅ Dedicated REST endpoint for direct outline access
✅ Authentication and authorization
✅ Error handling for missing courses
✅ Comprehensive Swagger documentation

Happy testing! 🎉
`);