import { mongoMCPManager } from '../services/mongoMCPManager';

/**
 * Initialize MCP services on startup
 */
export async function initializeMCPServices(): Promise<void> {
  try {
    console.log('Initializing MCP services...');
    
    // Start MongoDB MCP server in background
    mongoMCPManager.startMCPServer().catch(error => {
      console.error('MongoDB MCP server failed to start:', error);
      console.log('Application will continue without MCP functionality');
    });

    // Set up event listeners
    mongoMCPManager.on('connected', () => {
      console.log('MongoDB MCP server connected successfully');
    });

    mongoMCPManager.on('disconnected', () => {
      console.warn('MongoDB MCP server disconnected');
    });

    mongoMCPManager.on('error', (error) => {
      console.error('MongoDB MCP server error:', error);
    });

    console.log('MCP services initialization started (non-blocking)');

  } catch (error) {
    console.error('Failed to initialize MCP services:', error);
    console.log('Application will continue without MCP functionality');
  }
}

/**
 * Cleanup MCP services on shutdown
 */
export async function cleanupMCPServices(): Promise<void> {
  try {
    console.log('Cleaning up MCP services...');
    await mongoMCPManager.stopMCPServer();
    console.log('MCP services cleanup completed');
  } catch (error) {
    console.error('Error during MCP services cleanup:', error);
  }
} 