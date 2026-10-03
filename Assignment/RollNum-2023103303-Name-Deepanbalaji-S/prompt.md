# Application Generation Prompt

Create a full-stack Agentic AI application named **AI Travel Planner**.

The application should help a user plan a trip by using multiple specialized AI agents coordinated by an orchestrator.

## Requirements

1. Build a React + Vite frontend.
2. Build a Node.js + Express backend.
3. Implement these agents:
   - Destination Agent: understands the destination and travel preferences.
   - Budget Agent: creates an estimated budget.
   - Itinerary Agent: creates a day-by-day itinerary.
   - Recommendation Agent: suggests activities, food and places.
   - Orchestrator Agent: coordinates the other agents and combines their outputs.
4. Provide a simple web interface where the user enters:
   - Destination
   - Number of days
   - Budget
   - Travel style
   - Interests
5. Display:
   - Trip summary
   - Day-by-day itinerary
   - Estimated budget
   - Recommendations
   - Planning notes
6. The backend should expose a POST `/api/plan` endpoint.
7. The application should work without an external AI key by using a deterministic fallback planner.
8. If `GEMINI_API_KEY` is configured, the backend may use Gemini for richer generated content.
9. Keep the code modular and easy to explain in an academic demonstration.
10. Include documentation describing the architecture, agent workflow, features and technology stack.

The final repository should contain `prompt.md`, `deliverables.md`, the complete frontend source, backend source, agents, and documentation.
