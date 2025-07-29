#!/usr/bin/env node

/**
 * Test script for MongoDB MCP server integration
 */

const { spawn } = require('child_process');

async function testMongoMCP() {
  console.log('Testing MongoDB MCP server integration...');
  
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
    let errorOutput = '';
    let isReady = false;

    mcpServer.stdout.on('data', (data) => {
      output += data.toString();
      console.log('MCP Server Output:', data.toString());
      
      // Check if server is ready by looking for MCP protocol response
      if (data.toString().includes('"jsonrpc":"2.0"') || data.toString().includes('"protocolVersion"')) {
        isReady = true;
        console.log('✅ MongoDB MCP server is ready and responding');
      }
    });

    mcpServer.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('MCP Server Error:', data.toString());
    });

    mcpServer.on('exit', (code) => {
      console.log(`MCP Server exited with code ${code}`);
      if (isReady) {
        console.log('✅ MongoDB MCP server test passed');
      } else {
        console.log('❌ MongoDB MCP server test failed');
        console.log('Error output:', errorOutput);
      }
    });

    // Send a test message to the MCP server
    setTimeout(() => {
      const testMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      mcpServer.stdin.write(JSON.stringify(testMessage) + '\n');
    }, 2000);

    // Cleanup after 15 seconds
    setTimeout(() => {
      if (mcpServer && !mcpServer.killed) {
        mcpServer.kill();
      }
    }, 15000);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testMongoMCP(); 