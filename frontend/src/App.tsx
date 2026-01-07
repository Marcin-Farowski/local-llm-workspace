import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://127.0.0.1:8081/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          model: "llama3.1",
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error("Error:", error);
      setResponse("❌ Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Chat (FastAPI + Ollama)</h1>

      <div className="card">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your prompt here..."
          rows={4}
        />

        <button onClick={handleSend} disabled={loading}>
          {loading ? "Generating..." : "Send"}
        </button>
      </div>

      {response && (
        <div className="response-area">
          <h3>Response:</h3>
          <div className="markdown-content">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
