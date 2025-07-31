import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import { ChatbotAPI, ChatHistoryResponse, MCPStatusResponse } from "../api/chatbot";
import { useUser } from "../context/UserContext";
import SavedPromptsDialog from "./SavedPromptsDialog";
import "../styles/floatingChat.css";

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

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [mcpStatus, setMcpStatus] = useState<MCPStatusResponse | null>(null);
  const [showSavedPrompts, setShowSavedPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history and check MCP status when chat is opened
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      checkMCPStatus();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const response = await ChatbotAPI.getChatHistory(50, 0);

      if (response.success) {
        // Create pairs of user and assistant messages
        const messagePairs: ChatMessage[] = [];
        
        response.messages.forEach((msg: any) => {
          const timestamp = new Date(msg.timestamp);
          
          // Add user message
          messagePairs.push({
            id: `${msg.timestamp}-user-${Math.random()}`,
            message: msg.message,
            response: "",
            timestamp: timestamp,
            isUser: true
          });
          
          // Add assistant response
          messagePairs.push({
            id: `${msg.timestamp}-assistant-${Math.random()}`,
            message: "",
            response: msg.response,
            timestamp: timestamp,
            isUser: false
          });
        });

        // Sort messages by timestamp in ascending order (oldest first)
        const sortedMessages = messagePairs.sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );

        setMessages(sortedMessages);
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
      const response = await ChatbotAPI.sendMessage(inputMessage, sessionId);

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

  const savePrompt = async (prompt: string) => {
    try {
      await ChatbotAPI.savePrompt(prompt);
    } catch (err: any) {
      console.error("Failed to save prompt:", err);
      setError(err.response?.data?.error || "Failed to save prompt");
    }
  };

  const handleSelectSavedPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div class="floating-chat-container">
      {/* Floating Chat Button */}
      <button
        class={`floating-chat-button ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
        title="AI Assistant"
      >
        <span class="oj-icon oj-ux-ico-chat"></span>
        {isOpen && <span class="oj-icon oj-ux-ico-close"></span>}
      </button>

      {/* Chat Dialog */}
      {isOpen && (
        <div class="floating-chat-dialog">
          {/* Header */}
          <div class="chat-header">
            <div class="chat-title">
              <span class="oj-icon oj-ux-ico-chat"></span>
              <h3>AI Assistant</h3>
              <span class="mcp-badge">
                <span class="oj-icon oj-ux-ico-connection"></span>
                MCP
              </span>
            </div>
            <div class="chat-actions">
              <button
                class="oj-button oj-button-text"
                onClick={() => setShowSavedPrompts(true)}
                title="Saved Prompts"
              >
                <span class="oj-icon oj-ux-ico-bookmark"></span>
              </button>
              <button
                class="oj-button oj-button-text"
                onClick={clearChatHistory}
                disabled={messages.length === 0}
                title="Clear History"
              >
                <span class="oj-icon oj-ux-ico-delete"></span>
              </button>
              <button
                class="oj-button oj-button-text"
                onClick={toggleChat}
                title="Close"
              >
                <span class="oj-icon oj-ux-ico-close"></span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div class="chat-messages">
            {messages.length === 0 && !isLoading && (
              <div class="empty-state">
                <span class="oj-icon oj-ux-ico-chat"></span>
                <h4>Welcome to the AI Assistant!</h4>
                <p>Ask me anything about your logs, applications, dashboard, or settings.</p>
                <div class="mcp-info">
                  <p><strong>🤖 MCP Mode Active</strong></p>
                  <p>You're connected to an MCP server with enhanced capabilities!</p>
                  {mcpStatus?.mongoDBStatus?.connected && (
                    <p><strong>📊 MongoDB Integration:</strong> Direct database access available</p>
                  )}
                </div>
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
                      <div class="user-message-header">
                        <p>{message.message}</p>
                        <button
                          class="oj-button oj-button-text save-prompt-button"
                          onClick={() => savePrompt(message.message)}
                          title="Save this prompt"
                        >
                          <span class="oj-icon oj-ux-ico-bookmark"></span>
                        </button>
                      </div>
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

          {/* Input */}
          <div class="chat-input">
            <div class="input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage((e.target as HTMLTextAreaElement).value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
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
              {" • MCP Mode Active"}
              {mcpStatus?.mongoDBStatus?.connected && " • MongoDB Connected"}
            </div>
          </div>
        </div>
      )}

      <SavedPromptsDialog
        isOpen={showSavedPrompts}
        onClose={() => setShowSavedPrompts(false)}
        onSelectPrompt={handleSelectSavedPrompt}
      />
    </div>
  );
} 