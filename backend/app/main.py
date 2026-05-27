from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import chat
from app.routers import conversations
import os

load_dotenv()

app = FastAPI(
    title=os.getenv("APP_NAME", "SmartAgent"),
    description="Agente de IA con herramientas reales",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(conversations.router)

@app.get("/")
def root():
    return {"message": "SmartAgent API funcionando ✅"}

@app.get("/health")
def health():
    return {"status": "ok"}