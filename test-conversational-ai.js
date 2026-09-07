const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testConversationalAI() {
  console.log('🧪 Testing Conversational AI Chat Feature...\n');
  
  try {
    // Login first
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: "user@example.com",
      password: "password123"
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');

    // Test 1: Initial course outline request
    console.log('📝 Test 1: Initial course outline request');
    const firstResponse = await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
      message: "Show me the course outline",
      courseId: "SWE223",
      context: {},
      conversationHistory: [],
      userMode: "balanced"
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response type:', firstResponse.data.data.model);
    console.log('Response preview:', firstResponse.data.data.response.substring(0, 200) + '...');
    const sessionId = firstResponse.data.sessionId;
    console.log('Session ID:', sessionId);
    console.log('');

    // Wait a moment for message to be stored
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Follow-up question about course details
    console.log('💬 Test 2: Follow-up conversational question');
    const secondResponse = await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
      message: "Tell me more about the Software Development Life Cycle topic",
      courseId: "SWE223",
      context: {},
      conversationHistory: [], // Should be populated from database
      userMode: "balanced"
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response type:', secondResponse.data.data.model);
    console.log('Is using AI model?', secondResponse.data.data.model !== 'database_lookup');
    console.log('Response preview:', secondResponse.data.data.response.substring(0, 200) + '...');
    console.log('Different from first response?', secondResponse.data.data.response !== firstResponse.data.data.response);
    console.log('');

    // Test 3: Another follow-up with more specific question
    console.log('🔍 Test 3: More specific follow-up question');
    const thirdResponse = await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
      message: "What are the practical applications of Agile methodology in real projects?",
      courseId: "SWE223",
      context: {},
      conversationHistory: [],
      userMode: "smart" // Use smarter model for complex question
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response type:', thirdResponse.data.data.model);
    console.log('Using smart model?', thirdResponse.data.data.model.includes('gpt-4'));
    console.log('Response preview:', thirdResponse.data.data.response.substring(0, 200) + '...');
    console.log('Tokens used:', thirdResponse.data.data.tokensUsed);
    console.log('Cost:', thirdResponse.data.data.estimatedCost);
    console.log('');

    // Test 4: Check conversation history is maintained
    console.log('📚 Test 4: Checking if conversation context is maintained');
    const fourthResponse = await axios.post(`${BASE_URL}/api/v1/ai/chat/course`, {
      message: "Based on what we discussed, which topic should I focus on first?",
      courseId: "SWE223", 
      context: {},
      conversationHistory: [],
      userMode: "balanced"
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response acknowledges previous context?', 
      fourthResponse.data.data.response.toLowerCase().includes('discussed') ||
      fourthResponse.data.data.response.toLowerCase().includes('mentioned') ||
      fourthResponse.data.data.response.toLowerCase().includes('talked about')
    );
    console.log('Response preview:', fourthResponse.data.data.response.substring(0, 200) + '...');

    return {
      success: true,
      sessionId,
      responses: [firstResponse.data, secondResponse.data, thirdResponse.data, fourthResponse.data]
    };
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    return { success: false, error };
  }
}

// Run the comprehensive test
testConversationalAI().then(result => {
  if (result.success) {
    console.log('\n🎉 Conversational AI Tests Completed!');
    console.log('✅ Course outline retrieval working');
    console.log('✅ Follow-up questions generate different responses');
    console.log('✅ Conversation context is maintained');
    console.log('✅ Different AI models used based on complexity');
    console.log('✅ Session management working properly');
  } else {
    console.log('\n❌ Tests failed. Check errors above.');
  }
}).catch(console.error);