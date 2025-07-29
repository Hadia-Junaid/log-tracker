#!/usr/bin/env node

/**
 * Debug script to test MongoDB MCP server connection
 */

const { spawn } = require('child_process');

async function debugMongoMCP() {
  console.log('🔍 Debugging MongoDB MCP Server Connection...\n');
  
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

    // Send initialization message
    setTimeout(() => {
      const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'debug-client', version: '1.0.0' }
        }
      };
      mcpServer.stdin.write(JSON.stringify(initMessage) + '\n');
      console.log('📤 Sent initialization message');
    }, 2000);

    // List available tools
    setTimeout(() => {
      const listToolsMessage = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };
      mcpServer.stdin.write(JSON.stringify(listToolsMessage) + '\n');
      console.log('📤 Sent tools/list message');
    }, 4000);

    // Test list-databases
    setTimeout(() => {
      const listDatabasesMessage = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'list-databases',
          arguments: {}
        }
      };
      mcpServer.stdin.write(JSON.stringify(listDatabasesMessage) + '\n');
      console.log('📤 Sent list-databases call');
    }, 6000);

    // Test list-collections
    setTimeout(() => {
      const listCollectionsMessage = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'list-collections',
          arguments: { database: 'test' }
        }
      };
      mcpServer.stdin.write(JSON.stringify(listCollectionsMessage) + '\n');
      console.log('📤 Sent list-collections call');
    }, 8000);

    // Test find operation
    setTimeout(() => {
      const findMessage = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'find',
          arguments: { 
            database: 'test', 
            collection: 'logs',
            filter: {},
            limit: 5
          }
        }
      };
      mcpServer.stdin.write(JSON.stringify(findMessage) + '\n');
      console.log('📤 Sent find call');
    }, 10000);

    // Cleanup
    setTimeout(() => {
      if (mcpServer && !mcpServer.killed) {
        mcpServer.kill();
        console.log('🛑 Server stopped');
      }
    }, 15000);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run debug
debugMongoMCP(); 