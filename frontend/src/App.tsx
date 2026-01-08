import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

type Message = {
    role: "user" | "assistant";
    content: string;
};

function App() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        const newHistory = [...messages, userMessage];

        setMessages(newHistory);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8081/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: newHistory,
                    model: "llama3.1",
                }),
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const data = await res.json();
            const assistantMessage: Message = {
                role: "assistant",
                content: data.response,
            };
            setMessages([...newHistory, assistantMessage]);
        } catch (error) {
            console.error("Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "❌ Error connecting to server.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="container">
            <h1>AI Chat</h1>

            <div className="chat-window">
                {messages.length === 0 ? (
                    <div className="empty-state">Start a conversation...</div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message-bubble ${
                                msg.role === "user" ? "user-msg" : "ai-msg"
                            }`}
                        >
                            <strong className="role-label">
                                {msg.role === "user" ? "You" : "AI"}
                            </strong>
                            <div className="markdown-content">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="loading-indicator">Thinking...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={2}
                />
                <button onClick={handleSend} disabled={loading}>
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}

export default App;
