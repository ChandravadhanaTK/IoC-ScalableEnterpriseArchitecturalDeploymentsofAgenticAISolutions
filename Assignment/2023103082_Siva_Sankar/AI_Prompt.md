# AI Prompt Used for Application Generation

Create a full-stack web application called "MindSupport AI".

## Objective

Develop an anonymous and secure AI-powered mental health support
application for students. The application should provide a safe
conversational interface where students can talk about academic
pressure, stress, burnout and other concerns.

## Frontend Requirements

- Use React with Vite.
- Create a clean, modern and responsive UI.
- Provide a chat interface.
- Display user and AI messages clearly.
- Provide a text input and Send button.
- Include a prominent SOS Crisis Helpline option.
- Show an appropriate disclaimer stating that the application
  does not replace professional treatment.
- The interface should be suitable for both desktop and mobile.

## Backend Requirements

- Use Node.js and Express.
- Create an API endpoint:
  POST /api/chat/stream
- Accept the user's message and conversation history.
- Connect the backend to an AI model through the Groq API.
- Keep the API key in an environment variable called GROQ_API_KEY.
- Do not expose the API key in the frontend.

## AI Response Requirements

- The AI should behave as an empathetic peer-support companion.
- Responses should be supportive and non-judgmental.
- The AI should not claim to be a medical professional.
- Responses should encourage professional help when appropriate.

## Crisis Detection

Implement basic crisis-keyword detection for messages containing
terms related to suicide or self-harm.

When a crisis keyword is detected:
- Do not send the message to the AI model.
- Return a crisis response.
- Display the configured crisis helpline information.

## Deployment Requirements

The application should be deployable using:
- Render Static Site for the frontend.
- Render Web Service for the backend.
- Environment variables for API keys and frontend API URL.

## Expected Architecture

React/Vite Frontend
        |
        | HTTP POST
        v
Node.js + Express Backend
        |
        v
Groq AI API