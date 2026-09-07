const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function loginAndTestChat() {
  console.log('🔐 Logging in to get valid token...\n');
  
  try {
    // First, login to get a valid token
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: "user@example.com",
      password: "password123"
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful!');
    console.log('Token received:', token.substring(0, 50) + '...');
    console.log('');

    // Now test the course AI chat
    console.log('🧪 Testing Course AI Chat...\n');
    
    const chatResponse = await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
      message: "What are the main topics I should focus on in this course?",
      courseId: "SWE101", // Using actual course code from your data
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
          "Functions and Procedures",
          "Basic Debugging",
          "Introduction to Software Tools"
        ],
        assessment: [
          { type: "Assignment", percentage: 40 },
          { type: "Midterm", percentage: 25 },
          { type: "Final Exam", percentage: 35 }
        ],
        description: "An introductory course covering fundamental programming concepts"
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
    console.log('AI Response Preview:', chatResponse.data.data.response.substring(0, 300) + '...');
    console.log('Tokens Used:', chatResponse.data.data.usage?.total_tokens || 'N/A');
    console.log('Cost:', chatResponse.data.data.cost || 'N/A');
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

// Run the complete test
loginAndTestChat().then(result => {
  if (result) {
    console.log('🎉 All tests completed successfully!');
    console.log('Token and session created for further testing.');
  } else {
    console.log('❌ Tests failed. Check the errors above.');
  }
}).catch(console.error);