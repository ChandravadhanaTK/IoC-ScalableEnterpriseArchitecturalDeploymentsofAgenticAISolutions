# MindSupport AI

## 1. Project Title

MindSupport AI – Anonymous AI-Powered Student Mental Health Support

## 2. Problem Statement

Students frequently experience academic pressure, examination stress,
burnout and emotional difficulties. However, they may hesitate to
discuss these concerns openly.

MindSupport AI provides an anonymous conversational interface where
students can express their thoughts and receive supportive AI-generated
responses.

## 3. Objectives

- Provide an anonymous conversational support space.
- Help students express academic and emotional concerns.
- Provide empathetic AI-generated responses.
- Detect basic crisis-related keywords.
- Provide crisis helpline information when necessary.
- Maintain separation between frontend and backend.
- Protect API credentials using environment variables.

## 4. Key Features

### Anonymous Chat

Users can interact with the application without creating an account.

### AI-Powered Support

The application uses an AI model through the Groq API to generate
supportive responses.

### Crisis Detection

The backend checks incoming messages for predefined crisis-related
keywords.

### SOS Crisis Helpline

The interface provides access to crisis-support information.

### Secure API Key Handling

The Groq API key is stored as a backend environment variable and is
not exposed in the frontend.

### Responsive Interface

The application is designed to work across desktop and mobile screens.

## 5. Technology Stack

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS
- Tailwind CSS

### Backend

- Node.js
- Express.js
- JavaScript

### AI

- Groq API
- OpenAI GPT-OSS model through Groq

### Deployment

- Render Static Site – Frontend
- Render Web Service – Backend

## 6. System Architecture

User
  |
  v
React Frontend
  |
  | POST /api/chat/stream
  v
Node.js + Express Backend
  |
  | API Request
  v
Groq AI API
  |
  v
AI Response
  |
  v
React Chat Interface

## 7. Backend API

### Endpoint

POST /api/chat/stream

### Request

```json
{
  "message": "I am stressed about my exams",
  "history": []
}