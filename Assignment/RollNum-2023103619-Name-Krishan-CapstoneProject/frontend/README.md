# Frontend

React 19 + TypeScript frontend for the AI chatbot. See [frontend.md](../frontend.md) for component documentation and [the root README](../readme.md) for capstone setup and verification results.

## Quick Start

```bash
npm ci
npm start    # http://localhost:3000
```

Connects to the FastAPI backend at `http://localhost:8000` by default.  
Override with `REACT_APP_API_URL` environment variable.

## Key Components

| Component | Purpose |
|-----------|---------|
| `ChatBot.tsx` | Main chat interface |
| `DocumentPanel.tsx` | RAG knowledge base (file + URL upload) |
| `AllConversations.tsx` | Conversation history sidebar |
| `Login.tsx` | Register / login forms |
| `MessageBubble.tsx` | Markdown + code + math rendering |
