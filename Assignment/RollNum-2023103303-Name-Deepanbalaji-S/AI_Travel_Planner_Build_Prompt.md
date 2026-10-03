# AI Travel Planner — Application Build Prompt

## Objective

Build a full-stack Agentic AI Travel Planner application that generates personalized travel plans based on a user's destination, number of travel days, budget, travel style, and interests.

The application should use a multi-agent architecture where specialized agents handle different parts of the travel-planning process.

## Core Requirements

Create a web application with:

* A React-based frontend.
* A Node.js and Express.js backend.
* A multi-agent architecture.
* A central orchestrator that coordinates the agents.
* Personalized travel-plan generation.
* Budget estimation and breakdown.
* Destination-focused recommendations.
* Activity and food recommendations.
* A day-by-day itinerary.
* Planning notes for the user.
* Optional Google Gemini API integration.
* A fallback planning mechanism so the application can work without a Gemini API key.

## User Inputs

The frontend should allow the user to enter:

1. Destination
2. Number of days
3. Budget in INR
4. Travel style
5. Interests

Example:

* Destination: Tokyo
* Days: 4
* Budget: ₹60,000
* Travel style: Balanced
* Interests: Technology, food, culture

## Agent Architecture

Implement the application using specialized agents:

### 1. Destination Agent

The Destination Agent should analyze the selected destination and provide destination-specific information and focus areas.

### 2. Budget Agent

The Budget Agent should estimate the total trip cost and provide a breakdown of expenses based on the user's budget and travel preferences.

### 3. Recommendation Agent

The Recommendation Agent should generate suitable activities, attractions, food recommendations, and experiences based on the destination and user's interests.

### 4. Itinerary Agent

The Itinerary Agent should organize the recommendations into a day-by-day travel schedule containing morning, afternoon, and evening activities.

### 5. Orchestrator Agent

The Orchestrator should coordinate the specialized agents and combine their outputs into a single personalized travel plan.

## Backend

Create an Express.js backend that exposes an API endpoint for generating travel plans.

The frontend should send the user's travel preferences to the backend using a POST request.

The backend should process the request through the agent workflow and return a structured travel plan as JSON.

## Frontend

Create a responsive React interface containing:

* Travel input form
* Destination field
* Days field
* Budget field
* Travel style selection
* Interests field
* Generate Travel Plan button
* Loading state
* Error handling
* Trip summary
* Budget breakdown
* Activity recommendations
* Food recommendations
* Day-by-day itinerary
* Planning notes

## AI Integration

Support optional Google Gemini API integration through an environment variable:

`GEMINI_API_KEY`

The application should continue working with a built-in fallback planner when the API key is not available.

Do not hard-code API keys or other secrets in the source code.

## Technology Stack

Use:

* React
* JavaScript
* Node.js
* Express.js
* Vite
* HTML
* CSS
* REST API
* Google Gemini API (optional)
* Git/GitHub

## Project Structure

Organize the application into separate frontend, backend, agent, and documentation components.

Example:

```text
AI-Travel-Planner-Agentic-AI/
├── agents/
├── backend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
├── docs/
├── .env.example
├── README.md
└── other documentation files
```

## Expected Output

When the user submits the form, generate a personalized travel plan containing:

1. Trip summary
2. Destination focus
3. Total estimated budget
4. Budget breakdown
5. Recommended activities
6. Food recommendations
7. Day-by-day itinerary
8. Planning notes

## Error Handling

Handle:

* Invalid user input
* Backend connection failures
* API failures
* Missing API keys
* Invalid responses

Display useful error messages to the user
