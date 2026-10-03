# Proyecto Educacional: Agente LangGraph + MCP

Este componente es el "Cerebro" del sistema. Utiliza **LangGraph** para orquestar la toma de decisiones del Agente de IA.

## ¿Qué hace especial a este Agente?
1.  **Doble Fuente de Herramientas (Tools):**
    *   **Locales:** Tiene acceso directo a funciones en Python como `calculadora_sumar` y `calculadora_restar`.
    *   **MCP:** Se conecta como *cliente* al servidor MCP (`mcp_hechos`) mediante `stdio_client` para usar las Tools de base de datos.
2.  **API Rest:** Expone el agente conversacional a través de **FastAPI** para que los Frontends creados en React se puedan conectar fácilmente.
3.  **Transparencia:** Cuando conversa, devuelve no solo el texto final, sino un historial completo (`history`) que permite que el frontend visualice **cuáles** herramientas usó y cómo.

## Configuración y Ejecución

Es requisito tener definida tu clave de la API de OpenAI (Dado que usa `ChatOpenAI`).
Se recomienda crear un entorno virtual para no ensuciar el entorno local:

```bash
# Usa el entorno virtual configurado en la raíz
cd ..
source .venv/bin/activate
cd agente_langgraph

# Configurar API Key
# Renombra .env.example a .env e inserta ahí tu OPENAI_API_KEY
cp .env.example .env
nano .env # (Edita el archivo)

# Ejecutar la API para que escuche en el puerto 8000.
# IMPORTANTE: Asegúrate de correrlo desde la carpeta padre (diag/clase3)
cd ../
uvicorn agente_langgraph.api:app --reload
```

## Estructura de código
*   `agente.py`: Define el "StateGraph" y los "Nodes" (incluyendo el LLM y el `ToolNode`).
*   `api.py`: Framework rápido y asincrónico para exponer la red neuronal al Frontend.
*   `local_tools.py`: Herramientas programadas clásicamente "hardcodeadas".
*   `mcp_client.py`: El "puente" asíncrono que arranca el script del MCP y virtualiza sus Tools para que LangChain las consuma.
