import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import config from 'config';

export class MongoMCPManager extends EventEmitter {
  private mongoMCPServer: ChildProcess | null = null;
  private isConnected: boolean = false;
  private connectionString: string;
  private serverPath: string;
  private readyPromise: Promise<void> | null = null;
  private outputBuffer: string = '';

  constructor() {
    super();
    this.connectionString = config.get<string>('mongoUri') || 'mongodb://localhost:27017/log-tracker';
    this.serverPath = 'mongodb-mcp-server';
  }

  /**
   * Start the MongoDB MCP server
   */
  async startMCPServer(): Promise<void> {
    try {
      console.log('Starting MongoDB MCP server...');

      // Create a promise that resolves when the server is ready
      this.readyPromise = new Promise<void>((resolve, reject) => {
        console.log('Creating MongoDB MCP server process...');
        
        // Spawn the MongoDB MCP server process
        this.mongoMCPServer = spawn('npx', [
          '-y',
          'mongodb-mcp-server@latest',
          '--connectionString=' + this.connectionString
        ], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env }
        });

        console.log('MongoDB MCP server process spawned with PID:', this.mongoMCPServer.pid);
        console.log('Connection string:', this.connectionString);

        let hasReceivedResponse = false;

        // Handle stdout from the server
        this.mongoMCPServer.stdout?.on('data', (data) => {
          const output = data.toString();
          this.outputBuffer += output;
          console.log('MongoDB MCP Server Output:', output);
          console.log('Current output buffer length:', this.outputBuffer.length);
          
          // Check if server is ready by looking for MCP protocol response
          if (this.outputBuffer.includes('"jsonrpc":"2.0"') && 
              (this.outputBuffer.includes('"protocolVersion"') || this.outputBuffer.includes('"result"')) &&
              !hasReceivedResponse) {
            hasReceivedResponse = true;
            console.log('✅ Detected MCP protocol response');
            this.isConnected = true;
            this.emit('connected');
            console.log('✅ MongoDB MCP server is ready and connected');
            resolve();
          }
        });

        // Handle stderr from the server
        this.mongoMCPServer.stderr?.on('data', (data) => {
          const error = data.toString();
          console.error('MongoDB MCP Server Error:', error);
          
          // Check for connection errors
          if (error.includes('ECONNREFUSED') || error.includes('Authentication failed') || error.includes('ENOTFOUND')) {
            this.isConnected = false;
            this.emit('error', new Error(`MongoDB connection failed: ${error}`));
            reject(new Error(`MongoDB connection failed: ${error}`));
          }
        });

        // Handle process exit
        this.mongoMCPServer.on('exit', (code) => {
          console.log(`MongoDB MCP Server exited with code ${code}`);
          this.isConnected = false;
          this.emit('disconnected');
          if (!this.isConnected && !hasReceivedResponse) {
            reject(new Error(`MongoDB MCP server exited with code ${code}`));
          }
        });

        // Handle process errors
        this.mongoMCPServer.on('error', (error) => {
          console.error('MongoDB MCP Server process error:', error);
          this.isConnected = false;
          this.emit('error', error);
          if (!hasReceivedResponse) {
            reject(error);
          }
        });

        // Send initialization message after a longer delay to ensure server is ready
        setTimeout(() => {
          if (this.mongoMCPServer && this.mongoMCPServer.stdin && !hasReceivedResponse) {
            const initMessage = {
              jsonrpc: '2.0',
              id: 1,
              method: 'initialize',
              params: {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: {}
                },
                clientInfo: {
                  name: 'log-tracker-mcp-client',
                  version: '1.0.0'
                }
              }
            };
            
            console.log('📤 Sending initialization message to MongoDB MCP server');
            console.log('📤 Init message:', JSON.stringify(initMessage));
            this.mongoMCPServer.stdin.write(JSON.stringify(initMessage) + '\n');
            console.log('📤 Init message sent');
          } else {
            console.warn('❌ Cannot send init message - server not ready or already received response');
          }
        }, 5000); // Wait 5 seconds before sending init message (increased from 3s)

        // Set a timeout for the entire startup process
        setTimeout(() => {
          if (!this.isConnected && !hasReceivedResponse) {
            console.warn('❌ MongoDB MCP server startup timeout - will continue without MCP');
            console.debug('Output buffer content:', this.outputBuffer);
            console.debug('Has received response:', hasReceivedResponse);
            console.debug('Is connected:', this.isConnected);
            // Don't reject, just resolve without connection
            resolve();
          }
        }, 20000); // 20 second timeout (increased from 15s)
      });

      // Wait for the server to be ready
      console.log('⏳ Waiting for MongoDB MCP server to be ready...');
      await this.readyPromise;
      console.log('✅ MongoDB MCP server startup complete');

    } catch (error) {
      console.error('❌ Failed to start MongoDB MCP server:', error);
      // Don't throw the error, just log it
      this.isConnected = false;
    }
  }

  /**
   * Stop the MongoDB MCP server
   */
  async stopMCPServer(): Promise<void> {
    if (this.mongoMCPServer) {
      console.log('Stopping MongoDB MCP server...');
      this.mongoMCPServer.kill();
      this.mongoMCPServer = null;
      this.isConnected = false;
      this.readyPromise = null;
      this.outputBuffer = '';
      this.emit('disconnected');
    }
  }

  /**
   * Check if the MongoDB MCP server is running
   */
  isServerRunning(): boolean {
    return this.isConnected && this.mongoMCPServer !== null;
  }

  /**
   * Get the server process for stdio communication
   */
  getServerProcess(): ChildProcess | null {
    return this.mongoMCPServer;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; connectionString: string } {
    return {
      connected: this.isConnected,
      connectionString: this.connectionString
    };
  }

  /**
   * Restart the MongoDB MCP server
   */
  async restartMCPServer(): Promise<void> {
    await this.stopMCPServer();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup
    await this.startMCPServer();
  }
}

// Export a singleton instance
export const mongoMCPManager = new MongoMCPManager(); 