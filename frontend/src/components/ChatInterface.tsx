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
import "../styles/chat.css";
import axios from "../api/axios";
import { useUser } from "../context/UserContext";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const { user } = useUser(); // Assuming useUser is a custom hook to get user context

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

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

    try {
      const response = await axios.post("/chat", {
        query: textToSend,
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
                  title="Clear Chat"
                  onojAction={clearChat}
                >
                  <span slot="startIcon" class="oj-ux-ico-refresh"></span>
                </oj-button>
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
            <div class="chat-messages-container">
              <div class="chat-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    class={`chat-message ${message.isUser ? "user-message" : "ai-message"}`}
                  >
                    <div class="message-content">
                      <div class="message-text" style={{
                        whiteSpace: "pre-wrap", wordBreak: "break-word"
                      }}>{message.text}</div>
                      <div class="message-time">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div class="chat-message ai-message typing-indicator">
                    <div class="message-content">
                      <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Chat Input */}
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
        </div>
      </div>
    </>
  );
}
