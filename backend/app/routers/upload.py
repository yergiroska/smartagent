from fastapi import APIRouter, UploadFile, File, Form
from app.agent.graph import get_agent
import PyPDF2
import docx
import io

router = APIRouter(prefix="/upload", tags=["upload"])


def extract_text_from_pdf(content: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(content))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()


def extract_text_from_docx(content: bytes) -> str:
    doc = docx.Document(io.BytesIO(content))
    return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    message: str = Form(default="Resume este documento"),
    session_id: str = Form(default="default")
):
    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(content)
    else:
        return {"error": "Formato no soportado. Usa PDF o DOCX."}

    if not text:
        return {"error": "No se pudo extraer texto del documento."}

    # Limitar a 8000 caracteres para no exceder el contexto
    text = text[:8000]

    prompt = f"El usuario ha adjuntado el documento '{file.filename}'. {message}\n\nIMPORTANTE: Empieza tu respuesta SIEMPRE con ' **{file.filename}**' en la primera línea, luego una línea en blanco, luego el resumen. Nunca mezcles el nombre del archivo con el contenido.\n\nContenido del documento:\n\n{text}"

    agent = get_agent()
    config = {"configurable": {"thread_id": session_id}}
    result = agent.invoke(
        {"messages": [{"role": "user", "content": prompt}]},
        config=config
    )

    last_message = result["messages"][-1].content
    return {"response": last_message, "session_id": session_id}