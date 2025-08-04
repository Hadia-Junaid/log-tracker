require('dotenv').config(); // Load .env file
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('config');

async function testGeminiIntegration() {
  try {
    console.log('🧪 Testing Gemini AI Integration...');
    
    // Check if API key is configured
    const apiKey = config.get('gemini.apiKey');
    if (!apiKey) {
      console.log('❌ Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
      return;
    }
    
    console.log('✅ Gemini API key found');
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('✅ Gemini client initialized');
    
    // Test simple generation
    const result = await model.generateContent('Hello! Please respond with "Gemini integration test successful!"');
    const response = result.response;
    const text = response.text();
    
    console.log('✅ Gemini response received:', text);
    console.log('🎉 Gemini integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Gemini integration test failed:', error.message);
  }
}

// Run the test
testGeminiIntegration(); 