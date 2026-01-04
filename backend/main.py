from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

# Initialize FastAPI app
app = FastAPI(title="AI Chat API", description="Backend for local LLM interaction via Ollama")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Model
class ChatRequest(BaseModel):
    prompt: str
    model: str = "llama3.1"

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Sends a prompt to the local Ollama instance and returns the generated response.
    """
    print(f"📩 Received prompt: {request.prompt}")
    
    try:
        ollama_response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": request.model,
                "prompt": request.prompt,
                "stream": False
            }
        )
        ollama_response.raise_for_status()
        
        data = ollama_response.json()
        return {"response": data.get("response", "")}

    except requests.exceptions.RequestException as e:
        print(f"❌ Error communicating with Ollama: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with AI model")

@app.get("/health")
def health_check():
    return {"status": "running", "service": "FastAPI + Ollama"}