from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv
from app.agent.tools import get_all_tools
import os

load_dotenv()

def get_agent():
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
    )

    agent = create_react_agent(
        model=llm,
        tools=get_all_tools(),
        prompt="Eres SmartAgent, un asistente personal inteligente. Responde siempre en el idioma del usuario. Sé útil, claro y conciso."
    )

    return agent