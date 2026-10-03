# Proyecto Educacional: Chat del Agente de IA

Esta aplicación React de una sola página (SPA) hace de cliente conversacional para tu Agente **LangGraph** (backend de FastAPI).

## Características principales
*   **Agnóstica al modelo de IA:** Se comunica unicamente en endpoint `/api/chat`.
*   **Transparencia:** Muestra tanto la respuesta hablada por el Agente, como también las herramientas que el modelo ha usado, permitiéndote **ver su proceso cognitivo en la UI**.
*   **Log de Tools Separado:**  Mediante CSS/HTML, se logra distinguir visualmente una "herramienta local" (Calculadoras) versus el uso de una herramienta remota (del servidor **MCP**). 

## Estética y desarrollo
La interfaz ha sido desarrollada con CSS puro (Glassmorphism), fuentes modernas (`Inter`), colores suaves inspirados en dark mode, logrando ser fluida y dinámica.

## ¿Qué puedo pedirle el chat?
Prueba solicitando:
1.  "Suma 200 + 154" *(verás que usa una Local Tool)*.
2.  "Mi fecha de nacimiento es 01/01/1990" *(verás que usa MCP Tool: `guardar_si_es_hecho`)*.
3.  "Cuándo nací?" *(verás que invoca RAG a través del MCP Tool)*.

## Instalación y Arranque
```bash
npm install
npm run dev
```
*(Puede ejecutarse en simultáneo con el API Backend y el servidor de Hechos)*
