from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import requests
import json

app = FastAPI(title="AI Chat API", description="Backend for local LLM interaction via Ollama")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "llama3.1"

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    messages_payload = [msg.dict() for msg in request.messages]

    print(f"📩 Received {len(messages_payload)} messages. Last one: {messages_payload[-1]['content']}")
    
    try:
        ollama_response = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": request.model,
                "messages": messages_payload,
                "stream": False
            }
        )
        ollama_response.raise_for_status()
        
        data = ollama_response.json()

        print(f"🔍 DEBUG: Ollama raw response: {json.dumps(data, indent=2)}")

        if "message" in data:
            return {"response": data["message"]["content"]}
        
        if "error" in data:
            print(f"❌ Ollama returned an error: {data['error']}")
            raise HTTPException(status_code=500, detail=f"Ollama Error: {data['error']}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error communicating with Ollama: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with AI model")

@app.get("/health")
def health_check():
    return {"status": "running", "service": "FastAPI + Ollama"}