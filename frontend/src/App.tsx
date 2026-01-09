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
        setMessages((prev) => [...prev, userMessage]);
        const currentHistory = [...messages, userMessage];

        setInput("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8081/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: currentHistory,
                    model: "llama3.1",
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "" },
            ]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantResponse = "";

            while (true) {
                const { value, done } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantResponse += chunk;

                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    newMessages[lastIndex] = {
                        role: "assistant",
                        content: assistantResponse,
                    };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Error connecting to server." },
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
