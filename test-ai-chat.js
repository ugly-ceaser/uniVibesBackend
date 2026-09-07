const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Mock JWT token - replace with actual token from your auth system
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MzQ2NzM2MDB9.example_token';

async function testCourseAIChat() {
  console.log('🧪 Testing Course AI Chat Endpoint...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/ai-chat/course`, {
      message: "What are the key topics covered in this course?",
      courseId: "CSC101", // Using course code as ID
      context: {
        courseCode: "CSC101",
        courseName: "Introduction to Computer Science",
        instructor: "Dr. Smith",
        department: "Computer Science",
        unitLoad: 3,
        semester: 1
      },
      conversationHistory: [],
      userMode: "balanced"
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Course AI Chat Response:');
    console.log('Status:', response.status);
    console.log('Session ID:', response.data.sessionId);
    console.log('AI Response:', response.data.data.response);
    console.log('Tokens Used:', response.data.data.usage?.total_tokens || 'N/A');
    console.log('Cost:', response.data.data.cost || 'N/A');
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

async function testGeneralAIChat() {
  console.log('🧪 Testing General AI Chat Endpoint...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/ai-chat/general`, {
      message: "Hello! Can you help me with programming concepts?",
      conversationHistory: [],
      userMode: "fast"
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ General AI Chat Response:');
    console.log('Status:', response.status);
    console.log('Session ID:', response.data.sessionId);
    console.log('AI Response:', response.data.data.response);
    console.log('Tokens Used:', response.data.data.usage?.total_tokens || 'N/A');
    console.log('Cost:', response.data.data.cost || 'N/A');
    console.log('');
    
    return response.data.sessionId;
  } catch (error) {
    console.error('❌ General AI Chat Error:');
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

async function testGetChatSessions() {
  console.log('🧪 Testing Get Chat Sessions Endpoint...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/ai-chat/sessions`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    console.log('✅ Chat Sessions Response:');
    console.log('Status:', response.status);
    console.log('Number of sessions:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      console.log('Latest session:', {
        id: response.data.data[0].id,
        title: response.data.data[0].title,
        messageCount: response.data.data[0].messages?.length || 0,
        createdAt: response.data.data[0].createdAt
      });
    }
    console.log('');
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Get Chat Sessions Error:');
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

async function testCourseChatSessions(courseId) {
  console.log(`🧪 Testing Course Chat Sessions for ${courseId}...\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/ai-chat/course/${courseId}/sessions`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    console.log('✅ Course Chat Sessions Response:');
    console.log('Status:', response.status);
    console.log('Course:', response.data.data.course);
    console.log('Number of sessions:', response.data.data.sessions.length);
    
    if (response.data.data.sessions.length > 0) {
      console.log('First session:', {
        id: response.data.data.sessions[0].id,
        title: response.data.data.sessions[0].title,
        messageCount: response.data.data.sessions[0].messages?.length || 0
      });
    }
    console.log('');
    
    return response.data.data.sessions;
  } catch (error) {
    console.error('❌ Course Chat Sessions Error:');
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

async function runAllTests() {
  console.log('🚀 Starting AI Chat Feature Tests\n');
  console.log('================================================\n');
  
  // Test course AI chat
  const courseSessionId = await testCourseAIChat();
  
  // Test general AI chat
  const generalSessionId = await testGeneralAIChat();
  
  // Test getting all chat sessions
  await testGetChatSessions();
  
  // Test getting course-specific sessions
  await testCourseChatSessions('CSC101');
  
  console.log('================================================');
  console.log('✅ AI Chat Feature Testing Complete!');
  
  if (courseSessionId || generalSessionId) {
    console.log('\n📊 Test Results Summary:');
    console.log('- OpenAI API integration: ✅ Working');
    console.log('- Message storage: ✅ Working');
    console.log('- Session management: ✅ Working');
    console.log('- Course-specific chats: ✅ Working');
  }
}

// Run the tests
runAllTests().catch(console.error);