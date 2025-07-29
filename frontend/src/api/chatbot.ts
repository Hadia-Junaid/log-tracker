import axios from './axios';

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  isUser: boolean;
  functionCalls?: any[];
}

export interface ChatHistoryResponse {
  success: boolean;
  messages: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ChatbotResponse {
  success: boolean;
  response: string;
  sessionId: string;
  tokensUsed: number;
  functionCalls: any[];
  mcpConnected?: boolean;
  mongoDBStatus?: {
    connected: boolean;
    connectionString: string;
  };
  availableTools?: string[];
}

export interface MCPStatusResponse {
  success: boolean;
  connected: boolean;
  mongoDBStatus: {
    connected: boolean;
    connectionString: string;
  };
  availableTools: Array<{
    name: string;
    description: string;
  }>;
}

export interface MCPConnectResponse {
  success: boolean;
  message: string;
  availableTools: Array<{
    name: string;
    description: string;
  }>;
}

export class ChatbotAPI {
  // Send a message to the chatbot (MCP mode only)
  static async sendMessage(
    message: string, 
    sessionId?: string
  ): Promise<ChatbotResponse> {
    const payload: any = {
      message
    };

    // Only include context if sessionId is provided and not empty
    if (sessionId && sessionId.trim()) {
      payload.context = { sessionId };
    }

    const response = await axios.post('/chatbot/message', payload);
    return response.data;
  }

  // Get chat history
  static async getChatHistory(limit: number = 50, offset: number = 0): Promise<ChatHistoryResponse> {
    const response = await axios.get(`/chatbot/history?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Clear chat history
  static async clearChatHistory(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const response = await axios.delete('/chatbot/history');
    return response.data;
  }

  // MCP-specific methods
  static async connectMCPServer(serverPath: string): Promise<MCPConnectResponse> {
    const response = await axios.post('/chatbot/mcp/connect', { serverPath });
    return response.data;
  }

  static async disconnectMCPServer(): Promise<{ success: boolean; message: string }> {
    const response = await axios.post('/chatbot/mcp/disconnect');
    return response.data;
  }

  static async getMCPStatus(): Promise<MCPStatusResponse> {
    const response = await axios.get('/chatbot/mcp/status');
    return response.data;
  }

  static async restartMongoDBServer(): Promise<{ success: boolean; message: string }> {
    const response = await axios.post('/chatbot/mcp/restart-mongodb');
    return response.data;
  }
} 