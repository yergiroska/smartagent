from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.agent.graph import get_agent

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    agent = get_agent()

    result = agent.invoke({
        "messages": [{"role": "user", "content": request.message}]
    })

    last_message = result["messages"][-1].content

    return ChatResponse(
        response=last_message,
        session_id=request.session_id
    )