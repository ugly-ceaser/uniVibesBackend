const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Use a valid JWT token (you'll need to get this from login)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0Yjg2YzM5NS00YjE1LTQ4YzYtODM5YS0xODQ4NmQ2NWQ4NzIiLCJyb2xlIjoiU1RVREVOVCJ9.example';

async function testCourseAIChat() {
  console.log('🧪 Testing Course AI Chat with real course...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
      message: "What are the key topics covered in this course?",
      courseId: "CSC101", // Using course code
      context: {
        courseCode: "CSC101",
        courseName: "Introduction to Computer Science",
        instructor: "Dr. Smith",
        department: "Computer Science",
        unitLoad: 3,
        semester: 1,
        outline: ["Programming Basics", "Data Structures", "Algorithms"],
        assessment: [
          { type: "Assignment", percentage: 30 },
          { type: "Exam", percentage: 70 }
        ],
        description: "Foundational programming course"
      },
      conversationHistory: [],
      userMode: "balanced"
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Course AI Chat Success!');
    console.log('Status:', response.status);
    console.log('Session ID:', response.data.sessionId);
    console.log('AI Response:', response.data.data.response.substring(0, 200) + '...');
    console.log('Cost:', response.data.data.cost);
    console.log('');
    
    return response.data.sessionId;
  } catch (error) {
    console.error('❌ Course AI Chat Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    console.log('');
    return null;
  }
}

// Run the test
testCourseAIChat().catch(console.error);