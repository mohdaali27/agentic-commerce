/**
 * Test Google Gemini Integration
 * Run: node test-gemini.js
 */

require('dotenv').config();
const { createLLMProvider } = require('./actions/utils/llm-provider');

async function testGemini() {
  console.log('🧪 Testing Google Gemini Integration');
  console.log('====================================');
  console.log('');

  // Check API key
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY not found in .env');
    console.log('');
    console.log('To fix:');
    console.log('1. Get API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Add to .env: GOOGLE_API_KEY=AIza...');
    return;
  }

  console.log('✅ API Key found');
  console.log('');

  // Create provider
  try {
    console.log('Creating Gemini provider...');
    const provider = createLLMProvider({
      LLM_PROVIDER: 'gemini',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    });
    console.log('✅ Provider created');
    console.log('');

    // Test simple completion
    console.log('Test 1: Simple greeting');
    console.log('------------------------');
    const messages1 = [
      { role: 'user', content: 'Say hello in one sentence' }
    ];

    const response1 = await provider.generateCompletion(messages1, {
      temperature: 0,
      maxTokens: 100,
    });

    console.log('✅ Response received');
    console.log('Response:', response1.content);
    console.log('Tokens used:', response1.usage.totalTokens);
    console.log('');

    // Test with system message
    console.log('Test 2: Shopping assistant simulation');
    console.log('--------------------------------------');
    const messages2 = [
      { role: 'system', content: 'You are a helpful shopping assistant.' },
      { role: 'user', content: 'I want to buy a red shirt' }
    ];

    const response2 = await provider.generateCompletion(messages2, {
      temperature: 0.7,
      maxTokens: 200,
    });

    console.log('✅ Response received');
    console.log('Response:', response2.content);
    console.log('Tokens used:', response2.usage.totalTokens);
    console.log('');

    // Test conversation
    console.log('Test 3: Multi-turn conversation');
    console.log('--------------------------------');
    const messages3 = [
      { role: 'system', content: 'You are a helpful shopping assistant.' },
      { role: 'user', content: 'Show me shirts' },
      { role: 'assistant', content: 'I can help you find shirts! What color are you looking for?' },
      { role: 'user', content: 'Red shirts under $50' }
    ];

    const response3 = await provider.generateCompletion(messages3, {
      temperature: 0.7,
      maxTokens: 300,
    });

    console.log('✅ Response received');
    console.log('Response:', response3.content);
    console.log('Tokens used:', response3.usage.totalTokens);
    console.log('');

    console.log('====================================');
    console.log('✅ All Gemini tests passed!');
    console.log('');
    console.log('You can now use Gemini by setting:');
    console.log('LLM_PROVIDER=gemini in your .env file');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    if (error.message.includes('Invalid')) {
      console.log('Possible causes:');
      console.log('- Invalid API key');
      console.log('- API key not enabled for Gemini API');
      console.log('- Network connectivity issues');
    }
  }
}

testGemini().catch(console.error);