# AI Travel Planner – Deliverables

## 1. Project Title

**AI Travel Planner – Multi-Agent Agentic AI Application**

## 2. Problem Statement

Planning a trip usually requires collecting information about destinations, budgets, activities and daily schedules separately. This project combines these tasks into one intelligent workflow.

## 3. Objective

The objective is to build an Agentic AI travel planning system that coordinates multiple specialized agents to generate a personalized travel plan.

## 4. Main Features

- Destination analysis
- Personalized itinerary generation
- Budget estimation
- Activity and food recommendations
- Travel-style based planning
- Multi-agent orchestration
- Simple web interface
- API-based backend
- Fallback mode without an external AI API key

## 5. Agent Architecture

### Destination Agent
Analyzes the destination, travel style and interests.

### Budget Agent
Estimates accommodation, food, transport and activity expenses.

### Itinerary Agent
Creates a day-by-day schedule.

### Recommendation Agent
Suggests activities, food and places based on the user's interests.

### Orchestrator Agent
Receives the user's request, invokes the specialized agents, and combines their results into a final travel plan.

## 6. Workflow

User → Frontend → Backend API → Orchestrator → Specialized Agents → Combined Travel Plan → Frontend

## 7. Technology Stack

- React
- Vite
- JavaScript
- Node.js
- Express.js
- REST API
- Optional Google Gemini API
- HTML/CSS

## 8. API

### POST `/api/plan`

Example request:

```json
{
  "destination": "Tokyo",
  "days": 4,
  "budget": 60000,
  "style": "balanced",
  "interests": "technology, food, culture"
}
```

## 9. Expected Output

The system returns:

- Trip overview
- Destination insights
- Daily itinerary
- Estimated budget
- Recommendations
- Planning notes

## 10. Academic Demonstration

The project demonstrates:

- Agentic AI concepts
- Multi-agent architecture
- Agent orchestration
- REST API development
- React frontend development
- Backend service design
- Modular software architecture

## 11. Future Enhancements

- Real-time flight and hotel APIs
- Map integration
- Weather information
- User accounts
- Saved trips
- Multilingual planning
- More specialized agents
