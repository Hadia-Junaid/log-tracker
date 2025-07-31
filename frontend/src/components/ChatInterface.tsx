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
  isUser: boolean;
  timestamp: Date;
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
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSavedMessages, setShowSavedMessages] = useState(false);
  const [originalMessages, setOriginalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const savedMessagesPopupRef = useRef<any>(null);

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-new",
        text: initialMessageText,
        isUser: false,
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
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    console.log("Sending message:", textToSend);
    if (!textToSend) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Clear input only if we're sending from the input field (not quick actions)
    if (!messageText) {
      setInputValue("");
    }

    setIsTyping(true);

    // Copy last 4 messages but not the welcome message
    const filteredMessages = messages.filter(
      (msg) => msg.id !== "welcome-new" && msg.id !== "welcome"
    );
    const previousChat = filteredMessages.slice(-4).map((msg) => ({
      role: msg.isUser ? "user" : "model",
      content: msg.text,
    }));

    // Build Gemini contents format
    const currentChat = [
      ...previousChat.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      // add the new user message
      { role: "user", parts: [{ text: textToSend }] },
    ];

    try {
      const response = await axios.post("/chat", {
        chat: currentChat,
      });
      console.log("AI response:", response.data);

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: response.data,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Sorry, I couldn't process your request. Please try again later.",
        isUser: false,
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      class={`chat-message ${message.isUser ? "user-message" : "ai-message"}`}
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
                          <div class="message-time">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                        {message.isUser && (
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
                  onrawValueChanged={(e: CustomEvent) => setInputValue(e.detail.value)}
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
