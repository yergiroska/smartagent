# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server (hot reload)
python -m uvicorn app.main:app --reload

# Run on custom host/port
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs are auto-generated at `http://localhost:8000/docs` (Swagger) and `/redoc`.

## Architecture

FastAPI backend for an AI agent with real tools. The stack is:
- **FastAPI** — HTTP layer with async support
- **LangGraph** — Stateful agent graph (cycles, branching, checkpointing)
- **LangChain + LangChain-Groq** — LLM orchestration via Groq API
- **Pydantic v2** — Request/response validation

The frontend (Vue/React, port 5173) is in `../frontend/`. CORS is locked to `http://localhost:5173`.

### Module layout and purpose

| Path | Purpose |
|------|---------|
| `app/main.py` | FastAPI app factory, middleware config, root routes |
| `app/routers/chat.py` | Chat API endpoints (wire into `main.py` via `app.include_router`) |
| `app/schemas/chat.py` | Pydantic models for chat request/response payloads |
| `app/agent/graph.py` | LangGraph `StateGraph` definition — nodes, edges, conditional logic |
| `app/agent/tools.py` | Tool functions decorated with `@tool` for the agent to call |
| `app/services/` | Business logic called by routers (keeps routers thin) |
| `app/models/` | Database models (not yet added) |

### Environment

Copy `.env` and set at minimum:
```
GROQ_API_KEY=...
APP_NAME=SmartAgent
DEBUG=True
```

`load_dotenv()` is called at app startup in `main.py`.