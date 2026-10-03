# Proyecto Educacional: Servidor MCP "Hechos"

Este es un ejemplo mínimo de un servidor **Model Context Protocol (MCP)** desarrollado en Python.

## ¿Qué es MCP?
MCP es un estándar abierto que permite conectar modelos de inteligencia artificial (LLMs) con orígenes de datos locales o externos. En este caso, este servidor expone herramientas para leer y escribir "hechos de la vida" en una pequeña base de datos SQLite local (`hechos.db`).

## Componentes

*   `server.py`: El punto de entrada del servidor. Define las *Tools* que el LLM puede utilizar.
*   `hechos.db`: Base de datos local (se crea automáticamente al arrancar el servidor) donde se guardan los datos.

## Herramientas expuestas (Tools)

Desde el punto de vista de un Agente (por ejemplo, en LangGraph), al conectarse a este MCP verá las siguientes tools disponibles:
1.  **`guardar_si_es_hecho(texto: str)`**: Inserta un registro en la base de datos local.
2.  **`search_best_hecho(query: str)`**: Ejecuta una búsqueda básica en SQLite para encontrar el hecho que más se asemeje a las palabras clave.
3.  **`rag_hechos(query: str)`**: Recupera hasta 5 hechos relacionados para concatenarlos y dárselos como contexto extendido al Agente (una técnica simplificada de RAG).

## Cómo ejecutar de forma independiente
Aunque normalmente será invocado por el cliente (el Agente), puedes probarlo o usar un inspector de MCP:

```bash
# Usa el entorno virtual de la raíz del proyecto
cd .. 
source .venv/bin/activate
cd mcp_hechos

# El servidor funcionará esperando conexiones stdio
python server.py
```
