# Room Organization Assistant

A simple React + TypeScript + Firebase Hosting app that turns a messy room description into a cleanup plan, tracks progress, and lets the user ask AI questions about the current plan.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Firebase Hosting
- Gemini API (direct client-side use)
- LocalStorage for cleanup-plan persistence

## Main features

- Dashboard with progress, remaining time, and next task
- Room description form for plan generation
- Cleanup cards with status tracking and reopen support
- AI chat that answers questions using the current plan and room context
- Start New Cleanup action with confirmation

## Local setup

1. Install frontend dependencies:
   npm install
2. Copy `.env.example` to `.env` and add your Gemini API key:
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
3. Start the frontend:
   npm run dev
4. Deploy to Firebase Hosting:
   firebase login
   firebase use your-project-id
   npm run build
   firebase deploy

## Security note

This project calls the Gemini API directly from the browser using `VITE_GEMINI_API_KEY`. Because the API key is exposed to client-side code, it cannot be considered fully secret in a browser-based application. For a production-grade application, a server-side proxy or backend is recommended to keep the key out of the client. This project intentionally keeps the Firebase project on the free Spark plan and does not add a backend proxy, so the browser-based Gemini call is used only for this lightweight demo.
