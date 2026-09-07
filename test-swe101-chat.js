const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testWithValidCourse() {
  console.log('🧪 Testing AI Chat with valid course code (SWE101)...\n');
  
  try {
    // First, login to get a valid token
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: "user@example.com",
      password: "password123"
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful!');
    console.log('');

    // Test course AI chat with actual course code from database
    const chatResponse = await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
      message: "What topics are covered in this programming course?",
      courseId: "SWE101", // Using actual course code from database
      context: {
        courseCode: "SWE101",
        courseName: "Introduction to Programming",
        instructor: "Dr. Software Adebayo",
        department: "Software Engineering",
        unitLoad: 3,
        semester: 1,
        outline: [
          "Introduction to Programming Concepts",
          "Algorithms and Flowcharts", 
          "Variables and Data Types",
          "Control Structures",
          "Functions and Procedures"
        ],
        assessment: [
          { type: "Assignment", percentage: 40 },
          { type: "Test", percentage: 30 },
          { type: "Exam", percentage: 30 }
        ],
        description: "An introductory programming course for software engineering students"
      },
      conversationHistory: [],
      userMode: "balanced"
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Course AI Chat Success!');
    console.log('Status:', chatResponse.status);
    console.log('Session ID:', chatResponse.data.sessionId);
    console.log('AI Response:', chatResponse.data.data.response);
    console.log('Model Used:', chatResponse.data.data.model || 'N/A');
    console.log('Tokens Used:', chatResponse.data.data.usage?.total_tokens || 'N/A');
    console.log('Estimated Cost: $', chatResponse.data.data.cost || 'N/A');
    console.log('');

    return { token, sessionId: chatResponse.data.sessionId };
    
  } catch (error) {
    console.error('❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    return null;
  }
}

// Run the test
testWithValidCourse().then(result => {
  if (result) {
    console.log('🎉 AI Chat test completed successfully!');
    console.log('The course-specific AI chat is working with real course data.');
  } else {
    console.log('❌ Test failed. Check the errors above.');
  }
}).catch(console.error);