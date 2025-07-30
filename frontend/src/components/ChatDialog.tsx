import { useState, useRef, useEffect } from 'react';
import axios from "../api/axios";
import '../styles/chat-dialog.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export function ChatDialog({ isOpen, onClose }: Props) {
    const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai'; content: string }>>([]);
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

    const handleSubmit = async () => {
        if (!inputValue.trim()) return;
        const userMessage = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
        console.log("Current messages:", messages);
        setIsLoading(true);
        try {
            const response = await axios.post('/mcp/chat', { query: userMessage });
            const aiMessage = { type: 'ai' as const, content: response.data.response };
            setMessages(prev => [...prev, aiMessage]);
            console.log("AI response added:", aiMessage);
        } catch (error) {
            const errorMessage = { type: 'ai' as const, content: 'Error occurred. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
            console.log("Error message added:", errorMessage);
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