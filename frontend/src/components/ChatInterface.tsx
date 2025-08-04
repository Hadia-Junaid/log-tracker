/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { h } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import "ojs/ojbutton";
import "ojs/ojinputtext";
import "ojs/ojformlayout";
import "ojs/ojpopup";
import "ojs/ojlistview";
import "ojs/ojlistitemlayout";
import "../styles/chat.css";
import axios from "../api/axios";
import { useUser } from "../context/UserContext";

interface ChatMessage {
  id: string;
  text: string;
  role: string; // "user", "model", "function", etc.
  timestamp: Date;
  type?: string;
  toolId?: string; // For confirmation messages
}

interface SavedMessage {
  id: string;
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const { user, setUser } = useUser();
  const initialMessageText = user?.is_admin
    ? "Hello! I'm your AI assistant. I can help you with log analysis, performing various read and write tasks, and answering questions about your applications. How can I assist you today?"
    : "Hello! I'm your AI assistant. I can help you with log analysis, troubleshooting, and answering questions about your applications. How can I assist you today?";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: initialMessageText,
      role: "model",
      timestamp: new Date(),
      type: "response",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSavedMessages, setShowSavedMessages] = useState(false);
  const [originalMessages, setOriginalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-new",
        text: initialMessageText,
        role: "model",
        timestamp: new Date(),
      },
    ]);
  };

  const saveOrUnsaveMessage = async (messageText: string) => {
    try {
      const isAlreadySaved = user?.saved_messages?.includes(messageText);

      if (isAlreadySaved) {
        // Unsave the message
        const response = await axios.delete("/chat/unsave-message", {
          data: { message: messageText },
        });

        setUser({
          ...user!,
          saved_messages: response.data.saved_messages,
        });
      } else {
        // Save the message
        const response = await axios.post("/chat/save-message", {
          message: messageText,
        });

        setUser({
          ...user!,
          saved_messages: response.data.saved_messages,
        });
      }
    } catch (err) {
      console.error("Failed to save/unsave message:", err);
    }
  };

  const isMessageSaved = (messageText: string) => {
    return user?.saved_messages?.includes(messageText) || false;
  };

  const loadSavedMessage = (messageText: string) => {
    setInputValue(messageText);
    // Go back to original conversation
    if (originalMessages.length > 0) {
      setMessages(originalMessages);
      setOriginalMessages([]);
    }
    setShowSavedMessages(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleSavedMessages = () => {
    if (!showSavedMessages) {
      // Store current conversation and show saved messages
      setOriginalMessages(messages);
    } else {
      // Go back to original conversation
      if (originalMessages.length > 0) {
        setMessages(originalMessages);
        setOriginalMessages([]);
      }
    }
    setShowSavedMessages(!showSavedMessages);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const validateAndCleanChatHistory = (messages: ChatMessage[]) => {
    const filteredMessages = messages
      .filter(
        (msg) =>
          msg.id !== "welcome-new" &&
          msg.id !== "welcome" &&
          msg.type !== "confirmed" &&
          msg.type !== "confirmation_required"
      );

    const cleanedChat: any[] = [];
    let expectingFunctionResponse = false;
    let lastFunctionCallName = "";

    for (let i = 0; i < filteredMessages.length; i++) {
      const msg = filteredMessages[i];

      if (msg.role === "user") {
        // User messages reset the expectation
        expectingFunctionResponse = false;
        cleanedChat.push({
          role: "user",
          parts: [{ text: msg.text }],
        });
      } else if (msg.role === "model" && msg.type === "function_call") {
        // Function call - parse and add
        try {
          const functionCall = JSON.parse(msg.text);
          expectingFunctionResponse = true;
          lastFunctionCallName = functionCall.name;
          cleanedChat.push({
            role: "model",
            parts: [{ functionCall: functionCall }],
          });
        } catch (e) {
          console.error("Error parsing function call:", e);
          // Skip malformed function calls
        }
      } else if (msg.role === "function") {
        // Function response - only add if we're expecting one
        if (expectingFunctionResponse) {
          try {
            const functionResponse = JSON.parse(msg.text);
            expectingFunctionResponse = false;
            cleanedChat.push({
              role: "function",
              parts: [{ functionResponse: functionResponse }],
            });
          } catch (e) {
            console.error("Error parsing function response:", e);
            // Skip malformed function responses
          }
        } else {
          console.warn("Skipping orphaned function response:", msg.text);
        }
      } else if (msg.role === "model" && msg.type === "response") {
        // Regular model response
        expectingFunctionResponse = false;
        cleanedChat.push({
          role: "model",
          parts: [{ text: msg.text }],
        });
      }
      // Skip other message types (like toolDetails)
    }

    // If we end with an incomplete function call, remove it
    if (expectingFunctionResponse && cleanedChat.length > 0) {
      const lastMessage = cleanedChat[cleanedChat.length - 1];
      if (lastMessage.role === "model" && lastMessage.parts?.[0]?.functionCall) {
        console.warn("Removing incomplete function call at end:", lastMessage);
        cleanedChat.pop();
      }
    }

    return cleanedChat.slice(-15); // Keep last 15 messages
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Clear input only if we're sending from the input field (not quick actions)
    if (!messageText) {
      setInputValue("");
    }

    setIsTyping(true);

    // Build clean and validated chat history
    const chatHistory = validateAndCleanChatHistory(messages);

    // Add the new user message
    const currentChat = [
      ...chatHistory,
      { role: "user", parts: [{ text: textToSend }] },
    ];

    try {
      console.log("Sending validated chat history:", currentChat);
      const response = await axios.post("/chat", {
        chat: currentChat,
      });

      const newMessages: ChatMessage[] = [];

      // If there are toolDetails, this means there was a function call that needs confirmation
      // Store the function call in the proper format for chat history
      if (response.data.toolDetails) {
        const functionCall = {
          name: response.data.toolDetails.toolName,
          args: response.data.toolDetails.toolArgs,
        };

        newMessages.push({
          id: "functionCall" + Date.now().toString(),
          type: "function_call",
          text: JSON.stringify(functionCall, null, 2),
          role: "model",
          timestamp: new Date(),
          toolId: response.data.toolId,
        });
      }

      // If there was a function call that was executed immediately, store it properly for chat history
      if (response.data.functionCall) {
        newMessages.push({
          id: "functionCall" + Date.now().toString(),
          type: "function_call",
          text: JSON.stringify(response.data.functionCall, null, 2),
          role: "model",
          timestamp: new Date(),
          toolId: response.data.toolId,
        });
      }

      // If there was a function response from confirmation (the backend executed a tool)
      if (response.data.role === "function" && response.data.parts) {
        newMessages.push({
          id: "functionResponse" + Date.now().toString(),
          type: "function_response",
          text: JSON.stringify(
            response.data.parts[0].functionResponse,
            null,
            2
          ),
          role: "function",
          timestamp: new Date(),
        });
      }

      // If toolMessage was returned (role === "function") - this is for immediate execution
      if (response.data.toolResponse) {
        newMessages.push({
          id: "functionResponse" + Date.now().toString(),
          type: "function_response",
          text: JSON.stringify(
            response.data.toolResponse.parts[0].functionResponse,
            null,
            2
          ),
          role: "function",
          timestamp: new Date(),
        });
      }

      // Then push the actual AI response (only if there's a message)
      if (response.data.message) {
        newMessages.push({
          id: "model" + Date.now().toString(),
          type: response.data.type || "response",
          text: response.data.message,
          role: "model",
          timestamp: new Date(),
          toolId: response.data.toolId,
        });
      }

      setMessages((prev) => [...prev, ...newMessages]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Sorry, I couldn't process your request. Please try again later.",
        role: "model",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleConfirmation = async (
    message: ChatMessage,
    confirmed: boolean
  ) => {
    // Update the message type to "confirmed" to hide the buttons
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === message.id ? { ...msg, type: "confirmed" } : msg
      )
    );

    if (!confirmed) {
      // If cancelled, add a cancellation message
      const cancellationMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Operation cancelled.",
        role: "model",
        timestamp: new Date(),
        type: "response",
      };
      setMessages((prev) => [...prev, cancellationMessage]);

      // Optimistically send an API call to delete the pending operation from MongoDB
      try {
        axios.delete("/chat/pending-operation", {
          data: { toolId: message.toolId },
        });
      } catch (error) {
        console.error("Error deleting operation:", error);
      }

      return;
    }

    setIsTyping(true);

    // Build clean and validated chat history for confirmation
    const chatHistory = validateAndCleanChatHistory(messages);

    console.log("Clean chat history for confirmation:", chatHistory);

    // Build Gemini contents format with confirmation
    const currentChat = [
      ...chatHistory,
      {
        role: "user",
        parts: [{ text: "I confirm this tool call." }],
        type: "confirmation",
        toolId: message.toolId,
      },
    ];

    try {
      console.log("Sending confirmation with validated history:", currentChat);
      const response = await axios.post("/chat", {
        chat: currentChat,
      });

      const newMessages: ChatMessage[] = [];

      // If there are toolDetails, this means there was a function call that needs confirmation
      // Store the function call in the proper format for chat history
      if (response.data.toolDetails) {
        const functionCall = {
          name: response.data.toolDetails.toolName,
          args: response.data.toolDetails.toolArgs,
        };

        newMessages.push({
          id: "functionCall" + Date.now().toString(),
          type: "function_call",
          text: JSON.stringify(functionCall, null, 2),
          role: "model",
          timestamp: new Date(),
          toolId: response.data.toolId,
        });
      }

      // If there was a function call that was executed immediately, store it properly for chat history
      if (response.data.functionCall) {
        newMessages.push({
          id: "functionCall" + Date.now().toString(),
          type: "function_call",
          text: JSON.stringify(response.data.functionCall, null, 2),
          role: "model",
          timestamp: new Date(),
          toolId: response.data.toolId,
        });
      }

      // If there was a function response from confirmation (the backend executed a tool)
      if (response.data.role === "function" && response.data.parts) {
        newMessages.push({
          id: "functionResponse" + Date.now().toString(),
          type: "function_response",
          text: JSON.stringify(
            response.data.parts[0].functionResponse,
            null,
            2
          ),
          role: "function",
          timestamp: new Date(),
        });
      }

      // If toolMessage was returned (role === "function") - this is for immediate execution
      if (response.data.toolResponse) {
        newMessages.push({
          id: "functionResponse" + Date.now().toString(),
          type: "function_response",
          text: JSON.stringify(
            response.data.toolResponse.parts[0].functionResponse,
            null,
            2
          ),
          role: "function",
          timestamp: new Date(),
        });
      }

      // Then push the actual AI response (only if there's a message)
      if (response.data.message) {
        newMessages.push({
          id: Date.now().toString(),
          type: response.data.type || "response",
          text: response.data.message,
          role: "model",
          timestamp: new Date(),
          toolId: response.data.toolId,
        });
      }

      setMessages((prev) => [...prev, ...newMessages]);
    } catch (error) {
      console.error("Error sending confirmation:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Sorry, I couldn't process the confirmation. Please try again later.",
        role: "model",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (event: any) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      const textToSend = inputValue.trim();
      if (textToSend) {
        handleSendMessage();
      }
    }
  };

  const handleSendClick = () => {
    const textToSend = inputValue.trim();
    if (textToSend) {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <>
      <div class="chat-backdrop" onClick={onClose}></div>
      <div class="chat-overlay">
        <div class="chat-panel">
          {/* Chat Header */}
          <div class="chat-header">
            <div class="chat-header-content">
              <div class="chat-header-left">
                <span class="chat-icon">🤖</span>
                <div class="chat-title-container">
                  <h3 class="chat-title">AI Assistant</h3>
                  <div class="chat-status">
                    <span class="status-indicator"></span>
                    <span class="status-text">Ready to help</span>
                  </div>
                </div>
              </div>
              <div class="chat-header-right">
                <oj-button
                  class="chat-action-button"
                  chroming="borderless"
                  display="icons"
                  title={showSavedMessages ? "Back to Chat" : "Saved Messages"}
                  onojAction={toggleSavedMessages}
                >
                  <span
                    slot="startIcon"
                    class={
                      showSavedMessages
                        ? "oj-ux-ico-arrow-left"
                        : "oj-ux-ico-bookmark"
                    }
                  ></span>
                </oj-button>
                {!showSavedMessages && (
                  <>
                    <oj-button
                      class="chat-action-button"
                      chroming="borderless"
                      display="icons"
                      title="Clear Chat"
                      onojAction={clearChat}
                    >
                      <span slot="startIcon" class="oj-ux-ico-refresh"></span>
                    </oj-button>
                  </>
                )}
                <oj-button
                  class="chat-close-button"
                  chroming="borderless"
                  display="icons"
                  title="Close Chat"
                  onojAction={onClose}
                >
                  <span slot="startIcon" class="oj-ux-ico-close"></span>
                </oj-button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div class="chat-body">
            {showSavedMessages ? (
              <div class="saved-messages-view">
                <div class="saved-messages-header">
                  <h3 class="saved-messages-title">Your Saved Messages</h3>
                  <p class="saved-messages-subtitle">
                    Click on any message to use it
                  </p>
                </div>
                <div class="saved-messages-list">
                  {user?.saved_messages?.length === 0 ? (
                    <div class="no-saved-messages">
                      <span class="no-saved-messages-icon">📌</span>
                      <p>No saved messages yet</p>
                      <p class="no-saved-messages-hint">
                        Save user messages to quickly access them later
                      </p>
                    </div>
                  ) : (
                    user?.saved_messages?.map((savedMessage, index) => (
                      <div key={index} class="saved-message-item">
                        <div
                          class="saved-message-content"
                          onClick={() => loadSavedMessage(savedMessage)}
                        >
                          <div class="saved-message-text">{savedMessage}</div>
                        </div>
                        <oj-button
                          class="unsave-message-button"
                          chroming="borderless"
                          display="icons"
                          size="sm"
                          title="Remove saved message"
                          onojAction={() => saveOrUnsaveMessage(savedMessage)}
                        >
                          <span slot="startIcon" class="oj-ux-ico-close"></span>
                        </oj-button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div class="chat-messages-container">
                <div class="chat-messages">
                  {messages
                    .filter(
                      (message) =>
                        message.role === "user" ||
                        (message.role === "model" &&
                          message.type !== "function" &&
                          message.type !== "function_call")
                    )
                    .map((message) => (
                      <div
                        key={message.id}
                        class={`chat-message ${message.role === "user" ? "user-message" : "ai-message"}`}
                      >
                        <div class="message-wrapper">
                          <div class="message-content">
                            <div
                              class="message-text"
                              style={{
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {message.text}
                            </div>
                            {message.type === "confirmation_required" && (
                              <div class="confirmation-buttons">
                                <oj-button
                                  class="confirmation-button confirm-button"
                                  chroming="callToAction"
                                  size="sm"
                                  onojAction={() =>
                                    handleConfirmation(message, true)
                                  }
                                >
                                  Continue
                                </oj-button>
                                <oj-button
                                  class="confirmation-button cancel-button"
                                  chroming="outlined"
                                  size="sm"
                                  onojAction={() =>
                                    handleConfirmation(message, false)
                                  }
                                >
                                  Cancel
                                </oj-button>
                              </div>
                            )}
                            <div class="message-time">
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                          {message.role === "user" && (
                            <div class="message-actions">
                              <oj-button
                                class="save-message-button"
                                chroming="borderless"
                                display="icons"
                                size="sm"
                                title={
                                  isMessageSaved(message.text)
                                    ? "Unsave message"
                                    : "Save message"
                                }
                                onojAction={() =>
                                  saveOrUnsaveMessage(message.text)
                                }
                              >
                                <span slot="startIcon">
                                  {isMessageSaved(message.text) ? (
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="16"
                                      height="16"
                                      fill="currentColor"
                                      style="display: inline-block; vertical-align: middle;"
                                    >
                                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                                    </svg>
                                  ) : (
                                    <span class="oj-ux-ico-bookmark"></span>
                                  )}
                                </span>
                              </oj-button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  {/* Typing indicator */}
                  {isTyping && (
                    <div class="chat-message ai-message typing-indicator">
                      <div class="message-wrapper">
                        <div class="message-content">
                          <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}{" "}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          {!showSavedMessages && (
            <div class="chat-footer">
              <div class="chat-input-form">
                <oj-input-text
                  ref={inputRef}
                  class="chat-input"
                  value={inputValue}
                  placeholder="Type your message..."
                  onkeydown={handleKeyPress}
                  onrawValueChanged={(e: CustomEvent) =>
                    setInputValue(e.detail.value)
                  }
                ></oj-input-text>
                <oj-button
                  class="chat-send-button"
                  chroming="callToAction"
                  disabled={!inputValue.trim()}
                  onojAction={handleSendClick}
                  title="Send message"
                >
                  <span class="oj-ux-ico-send"></span>
                </oj-button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
