from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain.tools import tool
from dotenv import load_dotenv
import os

load_dotenv()

# Tool 1: Búsqueda web en tiempo real con Tavily
def get_search_tool():
    return TavilySearchResults(
        max_results=5,
        tavily_api_key=os.getenv("TAVILY_API_KEY"),
        description="Busca información actualizada en internet. Úsala cuando necesites datos recientes, noticias, precios, eventos actuales o cualquier información que pueda haber cambiado."
    )

# Tool 2: Calculadora matemática
@tool
def calculator(expression: str) -> str:
    """Evalúa expresiones matemáticas. Úsala para cálculos aritméticos, porcentajes, conversiones numéricas."""
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return f"Resultado: {result}"
    except Exception as e:
        return f"Error al calcular: {str(e)}"

# Tool 3: Obtener fecha y hora actual
@tool
def get_current_datetime(query: str = "") -> str:
    """Devuelve la fecha y hora actual. Úsala cuando el usuario pregunte qué día es hoy o la hora actual."""
    from datetime import datetime
    now = datetime.now()
    return f"Fecha y hora actual: {now.strftime('%A, %d de %B de %Y, %H:%M:%S')}"

def get_all_tools():
    return [
        get_search_tool(),
        calculator,
        get_current_datetime,
    ]