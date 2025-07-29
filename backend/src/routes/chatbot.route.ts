import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { validateBody } from '../middleware/validate';
import { chatbotMessageSchema, mcpConnectSchema } from '../validators/chatbot';
import { 
  processChatbotMessage,
  getChatHistory,
  clearChatHistory,
  connectMCPServer,
  disconnectMCPServer,
  getMCPStatus,
  restartMongoDBServer
} from '../controllers/chatbot.controller';

const router = Router();

// POST /api/chatbot/message - Process a chatbot message
router.post('/message', authenticate, validateBody(chatbotMessageSchema), processChatbotMessage);

// GET /api/chatbot/history - Get chat history for the authenticated user
router.get('/history', authenticate, getChatHistory);

// DELETE /api/chatbot/history - Clear chat history for the authenticated user
router.delete('/history', authenticate, clearChatHistory);

// MCP-specific endpoints
// POST /api/chatbot/mcp/connect - Connect to an MCP server
router.post('/mcp/connect', authenticate, validateBody(mcpConnectSchema), connectMCPServer);

// POST /api/chatbot/mcp/disconnect - Disconnect from MCP server
router.post('/mcp/disconnect', authenticate, disconnectMCPServer);

// GET /api/chatbot/mcp/status - Get MCP server connection status
router.get('/mcp/status', authenticate, getMCPStatus);

// POST /api/chatbot/mcp/restart-mongodb - Restart MongoDB MCP server
router.post('/mcp/restart-mongodb', authenticate, restartMongoDBServer);

export default router; 