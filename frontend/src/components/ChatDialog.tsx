import { useState, useRef, useEffect } from 'react';
import axios from "../api/axios";
import '../styles/chat-dialog.css';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {  getPinnedMessages, updatePinnedMessages } from '../services/pinned-messages';
import { useUser } from "../context/UserContext";
type Message = {
    type: 'user' | 'ai';
    content: string;
    timestamp: number;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export function ChatDialog({ isOpen, onClose }: Props) {
    const [messages, setMessages] = useLocalStorage<Message[]>('chat-messages', []);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
    const [showPinnedMessages, setShowPinnedMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pinnedMenuRef = useRef<any>(null);
    // Close pinned messages dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pinnedMenuRef.current && !pinnedMenuRef.current.contains(event.target as Node)) {
                setShowPinnedMessages(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch pinned messages when dialog opens
    useEffect(() => {
        if (isOpen) {
            loadPinnedMessages();
        }
    }, [isOpen]);

    const loadPinnedMessages = async () => {
        const messages = await getPinnedMessages();
        setPinnedMessages(messages);
    };

    const handlePinMessage = async (content: string) => {
        const isAlreadyPinned = pinnedMessages.includes(content);
        const updatedPinnedMessages = isAlreadyPinned
            ? pinnedMessages.filter(msg => msg !== content)
            : [...pinnedMessages, content];

        setPinnedMessages(updatedPinnedMessages);
        await updatePinnedMessages(updatedPinnedMessages);
    };

    const handleSelectPinnedMessage = (message: string) => {
        setInputValue(message);
        setShowPinnedMessages(false);
    };

    const handleUnpinMessage = async (message: string, event: MouseEvent) => {
        event.stopPropagation(); // Prevent triggering selection
        const updatedPinnedMessages = pinnedMessages.filter(msg => msg !== message);
        setPinnedMessages(updatedPinnedMessages);
        await updatePinnedMessages(updatedPinnedMessages);
    };

    const dialogRef = useRef<any>(null); // Ref for oj-dialog

    useEffect(() => {
        if (dialogRef.current) {
            if (isOpen) {
                dialogRef.current.open();
                // Scroll to bottom when dialog opens
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                }, 100);
            } else {
                dialogRef.current.close();
            }
        }
    }, [isOpen]);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (
                dialogRef.current &&
                !dialogRef.current.contains(event.target as Node) &&
                isOpen
            ) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isOpen, onClose]);

    const getRecentConversationHistory = () => {
        // Get last 4 messages (2 exchanges) if available
        return messages.slice(-4);
    };

    const handleSubmit = async () => {
        if (!inputValue.trim()) return;
        const userMessage = inputValue.trim();
        setInputValue('');
        
        // Create the user message
        const newUserMessage: Message = {
            type: 'user',
            content: userMessage,
            timestamp: Date.now()
        };

        // Update messages with user's message
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        
        setIsLoading(true);
        try {
            // Get conversation history from the updated messages array
            const history = updatedMessages.slice(-3, -1); 
             const historyString = history
            .map(msg => `${msg.type === 'user' ? "Previous user query" : "AI response"}: ${msg.content}`)
            .join("\n");
            // Send both current message and history to backend
            const response = await axios.post('/mcp/chat', {
                query: userMessage,
                history: historyString
            });

            // Add AI response with timestamp
            const aiMessage: Message = {
                type: 'ai',
                content: response.data.response,
                timestamp: Date.now()
            };

            // Update messages with both user message and AI response
            setMessages([...updatedMessages, aiMessage]);
            console.log("Messages after AI response:", [...updatedMessages, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                type: 'ai',
                content: 'Error occurred. Please try again.',
                timestamp: Date.now()
            };
            // Update messages with both user message and error response
            setMessages([...updatedMessages, errorMessage]);
        }
        setIsLoading(false);
        // Scroll to bottom smoothly after new message
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <oj-dialog ref={dialogRef} class="chat-dialog" onojClose={onClose}  dragAffordance='title-bar' >
            <div slot="header" style="display: flex; align-items: center; height: 20px; padding: 0px 0px 20px 0px;">
                <h2 class="oj-dialog-title" style="margin: 0; flex: 1; padding-right: 100px">AI Assistant</h2>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div class="pinned-messages-menu">
                        <oj-button
                            display="icons"
                            chroming="borderless"
                            style="padding: 4px;"
                            onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                        >
                            <span slot="startIcon" class="oj-ux-ico-bookmark" />
                        </oj-button>
                        {showPinnedMessages && pinnedMessages.length > 0 && (
                            <div class="pinned-messages-dropdown" ref={pinnedMenuRef}>
                                {pinnedMessages.map((message, index) => (
                                    <div
                                        key={index}
                                        class="pinned-message-item"
                                        onClick={() => handleSelectPinnedMessage(message)}
                                    >
                                        <span class="pinned-message-content">{message}</span>
                                        <span 
                                            class="unpin-button"
                                            onClick={(e) => handleUnpinMessage(message, e)}
                                        >
                                            <span class="oj-ux-ico-close" />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div class="new-chat-button" title="New Chat">
                        <oj-button 
                            display="icons" 
                            chroming="borderless"
                            style="padding: 4px;"
                            onClick={() => {
                                setMessages([]);
                                setInputValue('');
                            }}
                        >
                            <span slot="startIcon" class="oj-ux-ico-plus" />
                        </oj-button>
                    </div>
                </div>
            </div>
            <div slot="body">
                <div class="chat-messages">
                    <div ref={messagesEndRef} />
                    {isLoading && (
                        <div class="message ai">
                            <div class="message-bubble">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span>Thinking</span>
                                    <span class="typing-dots">...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {[...messages].reverse().map((message, index) => {
                        console.log("Rendering message:", message);
                        return (
                            <div key={message.timestamp} class={`message ${message.type}`}>
                                <div class="message-bubble">
                                    {message.type === 'user' && (
                                        <div 
                                            class={`pin-icon ${pinnedMessages.includes(message.content) ? 'pinned' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePinMessage(message.content);
                                            }}
                                        >
                                            <span class="oj-ux-ico-pin" />
                                        </div>
                                    )}
                                    {message.content.split('\n').map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div class="chat-input">
                    <oj-text-area
                        value={inputValue}
                        onvalueChanged={(e: any) => setInputValue(e.detail.value)}
                        placeholder="Type your message..."
                        rows={2}
                    ></oj-text-area>
                    <oj-button
                        onClick={handleSubmit}
                        disabled={isLoading || !inputValue.trim()}
                        class="send-button"
                        chroming="solid"
                    >
                        Send
                    </oj-button>
                </div>
            </div>
        </oj-dialog>
    );
}