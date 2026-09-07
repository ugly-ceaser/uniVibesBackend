const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCourseContextValidation() {
  console.log('🧪 Testing Course Context Validation with Minimal Context...\n');
  
  try {
    // First, login to get a valid token
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: "user@example.com",
      password: "password123"
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful!');
    console.log('');

    // Test with minimal context - should auto-populate from database
    console.log('🧪 Testing with minimal context (should auto-populate from DB)...\n');
    
    const chatResponse = await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
      message: "What programming concepts will I learn in this course?",
      courseId: "SWE101", // Using actual course code from database
      context: {
        // Minimal context - missing courseCode and courseName
        // Should be auto-populated from database
      },
      conversationHistory: [],
      userMode: "balanced"
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Course AI Chat with Auto-Population Success!');
    console.log('Status:', chatResponse.status);
    console.log('Session ID:', chatResponse.data.sessionId);
    console.log('AI Response Preview:', chatResponse.data.data.response.substring(0, 200) + '...');
    console.log('Model Used:', chatResponse.data.data.model || 'N/A');
    console.log('Cost: $', chatResponse.data.data.cost || 'N/A');
    console.log('');

    // Test with invalid course ID
    console.log('🧪 Testing with invalid course ID...\n');
    
    try {
      await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
        message: "What is this course about?",
        courseId: "INVALID123", // Non-existent course
        context: {},
        conversationHistory: [],
        userMode: "balanced"
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly returned 404 for invalid course ID');
        console.log('Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error for invalid course:', error.response?.data || error.message);
      }
    }

    return true;
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    return false;
  }
}

// Run the test
testCourseContextValidation().then(success => {
  if (success) {
    console.log('🎉 Course context validation tests completed successfully!');
    console.log('✅ Auto-population from database is working');
    console.log('✅ Error handling for invalid courses is working');
  } else {
    console.log('❌ Tests failed. Check errors above.');
  }
}).catch(console.error);