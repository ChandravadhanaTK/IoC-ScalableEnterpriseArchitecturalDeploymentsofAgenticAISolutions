# AI Travel Planner

A multi-agent Agentic AI application for generating personalized travel plans.

## Quick Start

### Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`.

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend normally runs on `http://localhost:5173`.

## Optional Gemini API

Copy `.env.example` to `.env` and add:

```text
GEMINI_API_KEY=your_key_here
```

The application also works without the key using the built-in fallback planner.
