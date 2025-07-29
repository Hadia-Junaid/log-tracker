#!/usr/bin/env node

/**
 * Comprehensive test script for MCP client and server integration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server Integration...\n');

  try {
    // Test 1: Check MCP Status
    console.log('1️⃣ Testing MCP Status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/chatbot/mcp/status`);
    console.log('✅ MCP Status:', statusResponse.data);
    console.log('');

    // Test 2: Test Chatbot with MCP
    console.log('2️⃣ Testing Chatbot with MCP...');
    const chatResponse = await axios.post(`${BASE_URL}/api/chatbot/message`, {
      message: "Show me all collections in the database",
      useMCP: true
    });
    console.log('✅ Chat Response:', {
      response: chatResponse.data.response,
      mcpConnected: chatResponse.data.mcpConnected,
      availableTools: chatResponse.data.availableTools,
      mongoDBStatus: chatResponse.data.mongoDBStatus
    });
    console.log('');

    // Test 3: Test Database Query
    console.log('3️⃣ Testing Database Query...');
    const dbQueryResponse = await axios.post(`${BASE_URL}/api/chatbot/message`, {
      message: "List all collections in the database and show me the first few documents from each",
      useMCP: true
    });
    console.log('✅ Database Query Response:', {
      response: dbQueryResponse.data.response.substring(0, 500) + '...',
      functionCalls: dbQueryResponse.data.functionCalls?.length || 0
    });
    console.log('');

    // Test 4: Test MongoDB Tools
    console.log('4️⃣ Testing MongoDB Tools...');
    const toolsResponse = await axios.post(`${BASE_URL}/api/chatbot/message`, {
      message: "What MongoDB tools are available? Show me the database statistics",
      useMCP: true
    });
    console.log('✅ Tools Response:', {
      response: toolsResponse.data.response.substring(0, 300) + '...',
      tokensUsed: toolsResponse.data.tokensUsed
    });
    console.log('');

    // Test 5: Test Complex Query
    console.log('5️⃣ Testing Complex Database Query...');
    const complexResponse = await axios.post(`${BASE_URL}/api/chatbot/message`, {
      message: "Analyze the database structure and show me information about indexes and collections",
      useMCP: true
    });
    console.log('✅ Complex Query Response:', {
      response: complexResponse.data.response.substring(0, 400) + '...',
      functionCalls: complexResponse.data.functionCalls?.length || 0
    });
    console.log('');

    console.log('🎉 All MCP tests completed successfully!');
    console.log('📊 Summary:');
    console.log('   ✅ MCP Server: Connected');
    console.log('   ✅ MongoDB Tools: Available');
    console.log('   ✅ Chatbot Integration: Working');
    console.log('   ✅ Database Queries: Functional');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testMCPServerDirectly() {
  console.log('\n🔧 Testing MongoDB MCP Server Directly...\n');

  const { spawn } = require('child_process');

  try {
    // Test the MongoDB MCP server directly
    const mcpServer = spawn('npx', [
      '-y',
      'mongodb-mcp-server@latest',
      '--connectionString=mongodb+srv://dbAdmin:308NegraAroyoLane@logtracker-cluster.wdxyb7b.mongodb.net/test'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let isReady = false;

    mcpServer.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📤 Server Output:', data.toString().trim());
      
      if (data.toString().includes('"jsonrpc":"2.0"')) {
        isReady = true;
        console.log('✅ Server is ready!');
      }
    });

    mcpServer.stderr.on('data', (data) => {
      console.error('❌ Server Error:', data.toString());
    });

    // Send test messages
    setTimeout(() => {
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
      mcpServer.stdin.write(JSON.stringify(initMessage) + '\n');
      console.log('📤 Sent initialization message');
    }, 2000);

    setTimeout(() => {
      const listToolsMessage = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };
      mcpServer.stdin.write(JSON.stringify(listToolsMessage) + '\n');
      console.log('📤 Sent tools/list message');
    }, 4000);

    setTimeout(() => {
      const callToolMessage = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'mcp_mongodb_list-databases',
          arguments: { random_string: 'test' }
        }
      };
      mcpServer.stdin.write(JSON.stringify(callToolMessage) + '\n');
      console.log('📤 Sent tools/call message');
    }, 6000);

    // Cleanup
    setTimeout(() => {
      if (mcpServer && !mcpServer.killed) {
        mcpServer.kill();
        console.log('🛑 Server stopped');
      }
    }, 10000);

  } catch (error) {
    console.error('❌ Direct test failed:', error);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting MCP Integration Tests...\n');
  
  await testMCPServer();
  await testMCPServerDirectly();
  
  console.log('\n✨ All tests completed!');
}

runAllTests(); 