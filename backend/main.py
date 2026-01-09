from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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

def generate_response(model: str, messages: List[dict]):
    try:
        with requests.post(
            "http://localhost:11434/api/chat",
            json={"model": model, "messages": messages, "stream": True},
            stream = True
        ) as r:
            r.raise_for_status()

            for line in r.iter_lines():
                if line:
                    chunk = json.loads(line)

                    if "message" in chunk and "content" in chunk["message"]:
                        yield chunk["message"]["content"]

    except Exception as e:
        print(f"Stream error: {e}")
        yield f"Error: {str(e)}"

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    print(f"Streaming request for model: {request.model}")
    messages_payload = [msg.dict() for msg in request.messages]

    return StreamingResponse(
        generate_response(request.model, messages_payload),
        media_type = "text/plain"
    )

@app.get("/health")
def health_check():
    return {"status": "running", "service": "FastAPI + Ollama"}