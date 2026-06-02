from fastapi import APIRouter
import psycopg
import os
from dotenv import load_dotenv
from app.agent.graph import get_agent

load_dotenv()

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("/")
def get_conversations():
    agent = get_agent()
    db_url = os.getenv("DATABASE_URL")
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                        SELECT thread_id, MAX(checkpoint_id) as last_checkpoint
                        FROM checkpoints
                        GROUP BY thread_id
                        ORDER BY MAX(checkpoint_id) DESC
                        """)
            rows = cur.fetchall()

    conversations = []
    for row in rows:
        session_id = row[0]
        title = session_id[:8] + "..."
        try:
            config = {"configurable": {"thread_id": session_id}}
            state = agent.get_state(config)
            messages = state.values.get("messages", [])
            for msg in messages:
                if msg.type == "human" and isinstance(msg.content, str) and msg.content.strip():
                    title = msg.content[:40] + ("..." if len(msg.content) > 40 else "")
                    break
        except Exception:
            pass
        conversations.append({"session_id": session_id, "title": title})

    return {"conversations": conversations}


@router.get("/{session_id}")
def get_conversation(session_id: str):
    agent = get_agent()
    config = {"configurable": {"thread_id": session_id}}
    state = agent.get_state(config)

    messages = []
    for msg in state.values.get("messages", []):
        # Filtrar mensajes de herramientas
        if msg.type == "tool":
            continue
        # Filtrar mensajes ai intermedios con tool_calls
        if msg.type == "ai" and getattr(msg, "tool_calls", None):
            continue
            # Filtrar prompts internos de documentos
        if msg.type == "human" and "Contenido del documento" in msg.content:
            continue
        role = "user" if msg.type == "human" else "agent"
        if isinstance(msg.content, str) and msg.content.strip():
            messages.append({"role": role, "content": msg.content})

    return {"session_id": session_id, "messages": messages}

@router.delete("/{session_id}")
def delete_conversation(session_id: str):
    db_url = os.getenv("DATABASE_URL")
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM checkpoints WHERE thread_id = %s", (session_id,))
            cur.execute("DELETE FROM checkpoint_blobs WHERE thread_id = %s", (session_id,))
            cur.execute("DELETE FROM checkpoint_writes WHERE thread_id = %s", (session_id,))
        conn.commit()

    return {"deleted": session_id}