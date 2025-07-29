import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import { ChatbotAPI, ChatHistoryResponse, MCPStatusResponse } from "../api/chatbot";
import { useUser } from "../context/UserContext";
import "../styles/chatbot.css";

type Props = {
  path?: string; // required by preact-router
};

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  isUser: boolean;
  functionCalls?: any[];
}

const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const renderFunctionCalls = (functionCalls: any[]) => {
  if (!functionCalls || functionCalls.length === 0) return null;

  return (
    <div class="function-calls">
      <details>
        <summary>Function Calls ({functionCalls.length})</summary>
        <div class="function-calls-content">
          {functionCalls.map((call, index) => (
            <div key={index} class="function-call">
              <strong>{call.name}</strong>
              <pre>{JSON.stringify(call.arguments, null, 2)}</pre>
              {call.result && (
                <div class="function-result">
                  <strong>Result:</strong>
                  <pre>{call.result}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default function Chatbot(props: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [useMCP, setUseMCP] = useState(true);
  const [mcpServerPath, setMcpServerPath] = useState("");
  const [mcpStatus, setMcpStatus] = useState<MCPStatusResponse | null>(null);
  const [showMCPConfig, setShowMCPConfig] = useState(false);
  const [isRestartingMongo, setIsRestartingMongo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
    checkMCPStatus();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await ChatbotAPI.getChatHistory(50, 0);

      if (response.success) {
        const chatMessages: ChatMessage[] = response.messages.map((msg: any) => ({
          id: `${msg.timestamp}-${Math.random()}`,
          message: msg.message,
          response: msg.response,
          timestamp: new Date(msg.timestamp),
          isUser: true
        }));

        // Add assistant responses
        const assistantMessages: ChatMessage[] = response.messages.map((msg: any) => ({
          id: `${msg.timestamp}-assistant-${Math.random()}`,
          message: "",
          response: msg.response,
          timestamp: new Date(msg.timestamp),
          isUser: false
        }));

        // Interleave user and assistant messages
        const allMessages: ChatMessage[] = [];
        chatMessages.forEach((userMsg, index) => {
          allMessages.push(userMsg);
          if (assistantMessages[index]) {
            allMessages.push(assistantMessages[index]);
          }
        });

        setMessages(allMessages);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setError("Failed to load chat history");
    }
  };

  const checkMCPStatus = async () => {
    try {
      const status = await ChatbotAPI.getMCPStatus();
      setMcpStatus(status);
    } catch (err) {
      console.error("Failed to check MCP status:", err);
    }
  };

  const connectMCPServer = async () => {
    if (!mcpServerPath.trim()) {
      setError("Please enter a valid MCP server path");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ChatbotAPI.connectMCPServer(mcpServerPath);
      
      if (response.success) {
        setUseMCP(true);
        setShowMCPConfig(false);
        await checkMCPStatus();
        
        // Add system message about MCP connection
        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
          message: "",
          response: `✅ Connected to MCP server! Available tools: ${response.availableTools.map(t => t.name).join(', ')}`,
          timestamp: new Date(),
          isUser: false
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (err: any) {
      console.error("Failed to connect to MCP server:", err);
      setError(err.response?.data?.error || "Failed to connect to MCP server");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectMCPServer = async () => {
    try {
      const response = await ChatbotAPI.disconnectMCPServer();
      
      if (response.success) {
        setUseMCP(false);
        setMcpServerPath("");
        await checkMCPStatus();
        
        // Add system message about disconnection
        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
          message: "",
          response: "🔌 Disconnected from MCP server",
          timestamp: new Date(),
          isUser: false
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (err: any) {
      console.error("Failed to disconnect from MCP server:", err);
      setError(err.response?.data?.error || "Failed to disconnect from MCP server");
    }
  };

  const restartMongoDBServer = async () => {
    try {
      setIsRestartingMongo(true);
      setError(null);
      
      const response = await ChatbotAPI.restartMongoDBServer();
      
      if (response.success) {
        await checkMCPStatus();
        
        // Add system message about restart
        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
          message: "",
          response: "🔄 MongoDB MCP server restarted successfully",
          timestamp: new Date(),
          isUser: false
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (err: any) {
      console.error("Failed to restart MongoDB MCP server:", err);
      setError(err.response?.data?.error || "Failed to restart MongoDB MCP server");
    } finally {
      setIsRestartingMongo(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: inputMessage,
      response: "",
      timestamp: new Date(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await ChatbotAPI.sendMessage(
        inputMessage, 
        sessionId, 
        useMCP, 
        useMCP ? mcpServerPath : undefined
      );

      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: "",
          response: response.response,
          timestamp: new Date(),
          isUser: false,
          functionCalls: response.functionCalls
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (response.sessionId && !sessionId) {
          setSessionId(response.sessionId);
        }

        // Update MCP status if provided
        if (response.mcpConnected !== undefined) {
          setMcpStatus(prev => prev ? { ...prev, connected: response.mcpConnected as boolean } : null);
        }
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(err.response?.data?.error || "Failed to send message");
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: "",
        response: "Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      await ChatbotAPI.clearChatHistory();
      setMessages([]);
      setSessionId("");
      setError(null);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
      setError("Failed to clear chat history");
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div class="chatbot-container">
      <div class="chatbot-header">
        <div class="chatbot-title">
          <span class="oj-icon oj-ux-ico-chat"></span>
          <h2>AI Assistant</h2>
          {useMCP && (
            <span class="mcp-badge">
              <span class="oj-icon oj-ux-ico-connection"></span>
              MCP
            </span>
          )}
        </div>
        <div class="chatbot-actions">
          <button
            class="oj-button oj-button-text"
            onClick={() => setShowMCPConfig(!showMCPConfig)}
            title="MCP Configuration"
          >
            <span class="oj-icon oj-ux-ico-settings"></span>
            MCP
          </button>
          <button
            class="oj-button oj-button-text"
            onClick={clearChatHistory}
            disabled={messages.length === 0}
          >
            <span class="oj-icon oj-ux-ico-delete"></span>
            Clear History
          </button>
        </div>
      </div>

      {showMCPConfig && (
        <div class="mcp-config-panel">
          <h3>MCP Configuration</h3>
          <div class="mcp-status">
            <span>Status: </span>
            <span class={`status-indicator ${mcpStatus?.connected ? 'connected' : 'disconnected'}`}>
              {mcpStatus?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {mcpStatus?.mongoDBStatus && (
            <div class="mongo-status">
              <span>MongoDB: </span>
              <span class={`status-indicator ${mcpStatus.mongoDBStatus.connected ? 'connected' : 'disconnected'}`}>
                {mcpStatus.mongoDBStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
              <button
                onClick={restartMongoDBServer}
                disabled={isRestartingMongo}
                class="oj-button oj-button-text restart-button"
                title="Restart MongoDB MCP Server"
              >
                <span class="oj-icon oj-ux-ico-refresh"></span>
                {isRestartingMongo ? 'Restarting...' : 'Restart'}
              </button>
            </div>
          )}
          
          {mcpStatus?.connected && mcpStatus.availableTools && (
            <div class="available-tools">
              <strong>Available Tools:</strong>
              <ul>
                {mcpStatus.availableTools.map(tool => (
                  <li key={tool.name}>{tool.name}: {tool.description}</li>
                ))}
              </ul>
            </div>
          )}

          <div class="mcp-controls">
            {!mcpStatus?.connected ? (
              <div class="connect-section">
                <input
                  type="text"
                  placeholder="Enter MCP server path (e.g., /path/to/server.js)"
                  value={mcpServerPath}
                  onChange={(e) => setMcpServerPath((e.target as HTMLInputElement).value)}
                  class="mcp-server-input"
                />
                <button
                  onClick={connectMCPServer}
                  disabled={!mcpServerPath.trim() || isLoading}
                  class="oj-button oj-button-primary"
                >
                  Connect
                </button>
              </div>
            ) : (
              <button
                onClick={disconnectMCPServer}
                class="oj-button oj-button-text"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}

      <div class="chatbot-messages">
        {messages.length === 0 && !isLoading && (
          <div class="empty-state">
            <span class="oj-icon oj-ux-ico-chat"></span>
            <h3>Welcome to the AI Assistant!</h3>
            <p>Ask me anything about your logs, applications, dashboard, or settings.</p>
            {useMCP && (
              <div class="mcp-info">
                <p><strong>🤖 MCP Mode Active</strong></p>
                <p>You're connected to an MCP server with enhanced capabilities!</p>
                {mcpStatus?.mongoDBStatus?.connected && (
                  <p><strong>📊 MongoDB Integration:</strong> Direct database access available</p>
                )}
              </div>
            )}
            <div class="example-queries">
              <p><strong>Try asking:</strong></p>
              <ul>
                <li>"Show me the recent error logs"</li>
                <li>"What are my pinned applications?"</li>
                <li>"Show me all active applications"</li>
                <li>"Analyze the log activity for the past week"</li>
                {mcpStatus?.mongoDBStatus?.connected && (
                  <>
                    <li>"Query the database for user statistics"</li>
                    <li>"Show me the latest log entries from MongoDB"</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            class={`message ${message.isUser ? "user-message" : "assistant-message"}`}
          >
            <div class="message-content">
              {message.isUser ? (
                <div class="user-bubble">
                  <p>{message.message}</p>
                  <span class="message-time">{formatTimestamp(message.timestamp)}</span>
                </div>
              ) : (
                <div class="assistant-bubble">
                  <div class="assistant-avatar">
                    <span class="oj-icon oj-ux-ico-robot"></span>
                  </div>
                  <div class="assistant-content">
                    <p>{message.response}</p>
                    {message.functionCalls && renderFunctionCalls(message.functionCalls)}
                    <span class="message-time">{formatTimestamp(message.timestamp)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div class="message assistant-message">
            <div class="message-content">
              <div class="assistant-bubble">
                <div class="assistant-avatar">
                  <span class="oj-icon oj-ux-ico-robot"></span>
                </div>
                <div class="assistant-content">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div class="error-message">
            <span class="oj-icon oj-ux-ico-error"></span>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div class="chatbot-input">
        <div class="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage((e.target as HTMLTextAreaElement).value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your logs, applications, or settings..."
            disabled={isLoading}
            rows={1}
            class="message-input"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            class="send-button"
          >
            <span class="oj-icon oj-ux-ico-send"></span>
          </button>
        </div>
        <div class="input-hint">
          Press Enter to send, Shift+Enter for new line
          {useMCP && " • MCP Mode Active"}
          {mcpStatus?.mongoDBStatus?.connected && " • MongoDB Connected"}
        </div>
      </div>
    </div>
  );
} 