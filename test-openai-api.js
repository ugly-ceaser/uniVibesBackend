#!/usr/bin/env node

/**
 * OpenAI API Key Test Script
 * 
 * This script tests your OpenAI API key configuration
 */

require('dotenv').config();
const https = require('https');

const API_KEY = process.env.AI_SERVICE_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

if (!API_KEY) {
  console.log('❌ No API key found in environment variables');
  process.exit(1);
}

console.log('🔑 Testing OpenAI API Key...');
console.log(`📍 API Key: ${API_KEY.substring(0, 20)}...${API_KEY.substring(API_KEY.length - 10)}`);

const testPayload = JSON.stringify({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "user",
      content: "Hello! This is a test message to verify API connectivity."
    }
  ],
  max_tokens: 50,
  temperature: 0.7
});

const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Length': Buffer.byteLength(testPayload)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        console.log('✅ API Key is working correctly!');
        console.log('🤖 Test Response:', response.choices[0]?.message?.content || 'No content');
        console.log('📈 Usage:', response.usage);
        console.log('💰 Estimated Cost: $' + (response.usage?.total_tokens * 0.00015 / 1000).toFixed(6));
      } catch (error) {
        console.log('⚠️  Valid response but JSON parsing failed');
        console.log('📄 Raw Response:', data.substring(0, 200) + '...');
      }
    } else {
      console.log('❌ API request failed');
      console.log('📄 Error Response:', data);
      
      if (res.statusCode === 401) {
        console.log('🔐 Authentication failed - check your API key');
      } else if (res.statusCode === 429) {
        console.log('⏳ Rate limit exceeded - wait a moment and try again');
      } else if (res.statusCode === 400) {
        console.log('📝 Bad request - check request format');
      }
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed:', error.message);
});

// Send the request
req.write(testPayload);
req.end();

console.log('⏳ Making test request to OpenAI API...');