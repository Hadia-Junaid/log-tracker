import { Request, Response } from 'express';
import { mcpClient } from '../services/mcpClient';
import { ChatMessage } from '../models/ChatMessage';
import { v4 as uuidv4 } from 'uuid';
import config from 'config';

export const processChatbotMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body;
    const userId = (req as any).user?.id || (req as any).user?.email;
    const sessionId = context?.sessionId || uuidv4();
    const authToken = req.headers.authorization?.replace('Bearer ', '') || '';

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required and must be a string' });
      return;
    }

    // Get recent conversation history (last 10 messages)
    const recentMessages = await ChatMessage.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Convert to conversation format
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    recentMessages.reverse().forEach(msg => {
      conversationHistory.push({
        role: 'user' as const,
        content: msg.message
      });
      conversationHistory.push({
        role: 'assistant' as const,
        content: msg.response
      });
    });

    // Get the JWT token from cookies for internal API calls
    const jwtToken = req.cookies?.jwt;
    
    let result: any;

    try {
      // Check if MCP client is connected (auto-connects to MongoDB)
      if (!mcpClient.isServerConnected()) {
        console.log('MCP client not connected, attempting to connect...');
        // The MCP client will auto-connect to MongoDB MCP server
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for auto-connection
      }

      if (mcpClient.isServerConnected()) {
        result = await mcpClient.processQuery(message, conversationHistory, jwtToken, userId);
      } else {
        throw new Error('MCP client connection failed');
      }
    } catch (mcpError) {
      console.error('MCP client error:', mcpError);
      res.status(500).json({ 
        success: false, 
        error: 'MCP server is not available. Please ensure the MCP server is running.',
        details: mcpError instanceof Error ? mcpError.message : 'Unknown error'
      });
      return;
    }

    // Save the conversation
    const chatMessage = new ChatMessage({
      userId,
      sessionId,
      message,
      response: result.response,
      functionCalls: result.toolCalls,
      tokensUsed: result.tokensUsed,
      modelUsed: 'gpt-4o-mini'
    });

    await chatMessage.save();

    // Get MongoDB MCP server status
    const mongoDBStatus = mcpClient.getMongoDBStatus();

    res.json({
      success: true,
      response: result.response,
      sessionId,
      tokensUsed: result.tokensUsed,
      functionCalls: result.toolCalls,
      mcpConnected: mcpClient.isServerConnected(),
      mongoDBStatus,
      availableTools: mcpClient.getAvailableTools().map(t => t.name)
    });

  } catch (error) {
    console.error('Error processing chatbot message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.email;
    const { limit = 50, offset = 0 } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const messages = await ChatMessage.find({ userId })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .lean();

    res.json({
      success: true,
      messages,
      total: messages.length
    });

  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const clearChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.email;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await ChatMessage.deleteMany({ userId });

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const connectMCPServer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serverPath } = req.body;

    if (!serverPath) {
      res.status(400).json({ error: 'Server path is required' });
      return;
    }

    await mcpClient.connectToServer(serverPath);

    res.json({
      success: true,
      message: 'MCP server connected successfully',
      connected: mcpClient.isServerConnected(),
      availableTools: mcpClient.getAvailableTools().map(t => t.name)
    });

  } catch (error) {
    console.error('Error connecting to MCP server:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect to MCP server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const disconnectMCPServer = async (req: Request, res: Response): Promise<void> => {
  try {
    await mcpClient.disconnect();

    res.json({
      success: true,
      message: 'MCP server disconnected successfully',
      connected: mcpClient.isServerConnected()
    });

  } catch (error) {
    console.error('Error disconnecting from MCP server:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect from MCP server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getMCPStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const mongoDBStatus = mcpClient.getMongoDBStatus();

    res.json({
      success: true,
      connected: mcpClient.isServerConnected(),
      availableTools: mcpClient.getAvailableTools().map(t => t.name),
      mongoDBStatus
    });

  } catch (error) {
    console.error('Error getting MCP status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get MCP status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const restartMongoDBServer = async (req: Request, res: Response): Promise<void> => {
  try {
    await mcpClient.restartMongoDBServer();

    res.json({
      success: true,
      message: 'MongoDB MCP server restarted successfully',
      connected: mcpClient.isServerConnected(),
      mongoDBStatus: mcpClient.getMongoDBStatus()
    });

  } catch (error) {
    console.error('Error restarting MongoDB MCP server:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to restart MongoDB MCP server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 