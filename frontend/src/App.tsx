import { useState } from "react";
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
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
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
        <div
          className="response-area"
          style={{ marginTop: "20px", textAlign: "left" }}
        >
          <h3>Response:</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{response}</p>
        </div>
      )}
    </div>
  );
}

export default App;
