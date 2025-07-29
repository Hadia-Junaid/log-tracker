#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMCPServer() {
  console.log('🔍 Testing MCP Server Connection...\n');

  try {
    // Test 1: Check if server is running
    console.log('📡 Testing server availability...');
    const response = await axios.get(`${BASE_URL}/api/chatbot/mcp/status`);
    console.log('✅ Server is running');
    console.log('📊 MCP Status:', response.data);
    
    // Test 2: Test chatbot with MCP
    console.log('\n🤖 Testing chatbot with MCP...');
    const chatbotResponse = await axios.post(`${BASE_URL}/api/chatbot/message`, {
      message: 'List all databases',
      useMCP: true
    });
    
    console.log('✅ Chatbot response received');
    console.log('📝 Response:', chatbotResponse.data.response);
    console.log('🔧 Function calls:', chatbotResponse.data.functionCalls);
    
    // Test 3: Test specific database query
    console.log('\n🗄️ Testing database query...');
    const dbResponse = await axios.post(`${BASE_URL}/api/chatbot/message`, {
      message: 'Show me all collections in the test database',
      useMCP: true
    });
    
    console.log('✅ Database query response received');
    console.log('📝 Response:', dbResponse.data.response);
    console.log('🔧 Function calls:', dbResponse.data.functionCalls);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📊 Response data:', error.response.data);
    }
  }
}

async function testDirectMCPConnection() {
  console.log('\n🔧 Testing direct MCP connection...\n');
  
  const mcpServer = spawn('npx', [
    '-y', 'mongodb-mcp-server@latest', 
    '--connectionString=mongodb+srv://dbAdmin:308NegraAroyoLane@logtracker-cluster.wdxyb7b.mongodb.net/test'
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  let isReady = false;
  let outputBuffer = '';

  mcpServer.stdout.on('data', (data) => {
    const output = data.toString();
    outputBuffer += output;
    console.log('📤 Server Output:', output);
    
    if (outputBuffer.includes('"jsonrpc":"2.0"') && 
        (outputBuffer.includes('"protocolVersion"') || outputBuffer.includes('"result"')) &&
        !isReady) {
      isReady = true;
      console.log('✅ MongoDB MCP server is ready and responding');
    }
  });

  mcpServer.stderr.on('data', (data) => {
    console.log('❌ Server Error:', data.toString());
  });

  // Send initialization message after delay
  setTimeout(() => {
    if (mcpServer.stdin) {
      const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      };
      console.log('📤 Sending initialization message');
      mcpServer.stdin.write(JSON.stringify(initMessage) + '\n');
    }
  }, 5000);

  // Test tools after initialization
  setTimeout(() => {
    if (mcpServer.stdin && isReady) {
      const listToolsMessage = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };
      console.log('📤 Requesting tools list');
      mcpServer.stdin.write(JSON.stringify(listToolsMessage) + '\n');
    }
  }, 7000);

  // Test database query
  setTimeout(() => {
    if (mcpServer.stdin && isReady) {
      const listDatabasesMessage = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'list-databases',
          arguments: {}
        }
      };
      console.log('📤 Testing list-databases tool');
      mcpServer.stdin.write(JSON.stringify(listDatabasesMessage) + '\n');
    }
  }, 9000);

  // Cleanup
  setTimeout(() => {
    console.log('🛑 Stopping test server');
    mcpServer.kill();
    process.exit(0);
  }, 15000);
}

async function runAllTests() {
  console.log('🚀 Starting MCP Fix Tests...\n');
  
  await testMCPServer();
  await testDirectMCPConnection();
}

runAllTests().catch(console.error); 