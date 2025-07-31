import { useState, useRef, useEffect } from 'react';
import axios from "../api/axios";
import '../styles/chat-dialog.css';
import { useLocalStorage } from '../hooks/useLocalStorage';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const dialogRef = useRef<any>(null); // Ref for oj-dialog

    useEffect(() => {
        if (dialogRef.current) {
            if (isOpen) {
                dialogRef.current.open();
            } else {
                dialogRef.current.close();
            }
        }
    }, [isOpen]);

    // ✅ Added code to close dialog when clicking outside
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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <oj-dialog ref={dialogRef} class="chat-dialog" onojClose={onClose}  dragAffordance='title-bar' >
            <div slot="header">
                <h2 class="oj-dialog-title">AI Assistant</h2>
            </div>
            <div slot="body">
                <div class="chat-messages">
                    {messages.map((message, index) => {
                        console.log("Rendering message:", message);
                        return (
                            <div key={index} class={`message ${message.type}`}>
                                <div class="message-bubble">
                                    {message.content.split('\n').map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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
                    <div ref={messagesEndRef} />
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