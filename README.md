# SmartAgent 🤖

Agente IA conversacional con memoria, herramientas y soporte de documentos.

## Demo

![SmartAgent Demo](demo.gif)

## Características

- 🔍 **Búsqueda web** en tiempo real con Tavily
- 🧮 **Calculadora** integrada
- 📅 **Fecha y hora** actual
- 📄 **Análisis de documentos** PDF y DOCX
- 🧠 **Memoria persistente** entre conversaciones (PostgreSQL)
- 💬 **Historial** de conversaciones con opción de eliminar

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + TailwindCSS |
| Backend | FastAPI + LangGraph + LangChain |
| Modelo | Groq API (`openai/gpt-oss-20b`) |
| Búsqueda | Tavily Search API |
| Base de datos | PostgreSQL (checkpoints y conversaciones) |

## Instalación

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables de entorno

Crea un archivo `.env` en `backend/`:

```env
GROQ_API_KEY=tu_clave
TAVILY_API_KEY=tu_clave
DATABASE_URL=postgresql://usuario:password@localhost/smartagent
```

## Arquitectura

```
smartagent/
├── backend/
│   └── app/
│       ├── agent/          # LangGraph + herramientas
│       ├── routers/        # Endpoints FastAPI
│       └── main.py
└── frontend/
    └── src/
        └── Chat.jsx        # Interfaz principal
```
