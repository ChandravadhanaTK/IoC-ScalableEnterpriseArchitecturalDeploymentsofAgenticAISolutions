# AI Travel Planner — Assignment Deliverables

## Student Details

**Name:** Deepanbalaji S
**Roll Number:** 2023103303
**Department:** Computer Science and Engineering
**College:** Anna University – College of Engineering Guindy

---

# 1. Architecture Diagram

The AI Travel Planner follows a multi-agent architecture consisting of a React frontend, an Express.js backend, an orchestrator, and specialized travel-planning agents.

```text
                         USER
                           |
                           v
                  +------------------+
                  |  React Frontend  |
                  +------------------+
                           |
                           | POST /api/plan
                           v
                  +------------------+
                  | Express Backend  |
                  +------------------+
                           |
                           v
                  +------------------+
                  | Orchestrator     |
                  | Agent            |
                  +------------------+
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
      +------------+ +------------+ +----------------+
      | Destination| |   Budget   | | Recommendation |
      |   Agent    | |   Agent    | |     Agent      |
      +------------+ +------------+ +----------------+
             |             |             |
             +-------------+-------------+
                           |
                           v
                  +------------------+
                  | Itinerary Agent  |
                  +------------------+
                           |
                           v
                  +------------------+
                  | Combined Travel  |
                  |      Plan        |
                  +------------------+
                           |
                           v
                  +------------------+
                  | React Frontend   |
                  | Displays Results |
                  +------------------+
```

### Architecture Components

#### React Frontend

The frontend collects the user's travel preferences and displays the generated travel plan.

The user can provide:

* Destination
* Number of days
* Budget
* Travel style
* Interests

#### Express.js Backend

The backend receives the travel request from the frontend and processes it through the agent workflow.

#### Orchestrator Agent

The orchestrator coordinates the specialized agents and combines their outputs into a single travel plan.

#### Destination Agent

Analyzes the selected destination and identifies relevant destination information and focus areas.

#### Budget Agent

Calculates an estimated trip budget and provides a breakdown of expenses.

#### Recommendation Agent

Generates recommendations for activities, attractions, food, and experiences based on the user's interests.

#### Itinerary Agent

Organizes the generated recommendations into a structured day-by-day itinerary.

---

# 2. Agent Workflow Design

The application uses a multi-agent workflow.

```text
User Input
    |
    v
Orchestrator
    |
    +----> Destination Agent
    |
    +----> Budget Agent
    |
    +----> Recommendation Agent
    |
    +----> Itinerary Agent
    |
    v
Combine Agent Outputs
    |
    v
Personalized Travel Plan
```

## Workflow Steps

### Step 1 — User Input

The user enters the destination, number of days, budget, travel style, and interests.

### Step 2 — Request Processing

The React frontend sends the information to the Express.js backend through the travel-planning API.

### Step 3 — Agent Coordination

The orchestrator coordinates the specialized agents.

### Step 4 — Destination Analysis

The Destination Agent processes destination-related information.

### Step 5 — Budget Planning

The Budget Agent creates an estimated budget and expense breakdown.

### Step 6 — Recommendations

The Recommendation Agent generates activities and food recommendations based on the destination and user interests.

### Step 7 — Itinerary Generation

The Itinerary Agent organizes the recommendations into a day-by-day schedule.

### Step 8 — Result Combination

The outputs from the agents are combined into one structured travel plan.

### Step 9 — Frontend Display

The React frontend displays:

* Trip summary
* Destination focus
* Budget
* Budget breakdown
* Activities
* Food recommendations
* Day-by-day itinerary
* Planning notes

---

# 3. Deployment Strategy

The application is divided into frontend and backend components.

## Frontend Deployment

The React/Vite frontend can be built using:

```text
npm run build
```

The generated production files can be deployed to a static hosting platform such as Vercel, Netlify, or another suitable web-hosting service.

## Backend Deployment

The Node.js/Express backend can be deployed to a server or cloud platform that supports Node.js applications.

The backend should expose the travel-planning API to the frontend.

## Environment Variables

Sensitive configuration should be stored using environment variables.

Example:

```text
PORT=5000
GEMINI_API_KEY=
```

The API key should not be committed to GitHub.

The `.env.example` file can be provided as a template for configuration.

## Local Development

Backend:

```text
cd backend
npm install
npm start
```

Frontend:

```text
cd frontend
npm install
npm run dev
```

The frontend normally runs on:

```text
http://localhost:5173
```

and the backend runs on:

```text
http://localhost:5000
```

---

# 4. Security Model

The application follows basic security practices for a web-based AI application.

## API Key Protection

The Gemini API key should be stored in an environment variable and should never be hard-coded into source code.

## Environment Configuration

The `.env` file should not be uploaded to GitHub.

Only `.env.example` should be included in the source repository.

## Backend Validation

The backend should validate incoming travel-planning requests before processing them.

Examples include:

* Valid destination
* Valid number of days
* Valid budget
* Valid travel style
* Valid interests

## Error Handling

The backend should handle API failures and invalid requests without exposing sensitive implementation details.

## CORS

The Express backend uses CORS to allow the frontend to communicate with the backend during development.

## Dependency Management

The application uses npm package management and package-lock files to maintain reproducible dependency versions.

---

# 5. Monitoring Dashboard Design

A production version of the AI Travel Planner can use a monitoring dashboard to observe application health and agent performance.

## Application Metrics

The monitoring dashboard can track:

* Total travel-plan requests
* Successful requests
* Failed requests
* API response time
* Backend availability
* Frontend availability
* Error frequency

## Agent Metrics

Agent-specific monitoring can track:

* Destination Agent execution time
* Budget Agent execution time
* Recommendation Agent execution time
* Itinerary Agent execution time
* Orchestrator execution time

## AI/API Monitoring

For Gemini-enabled deployments, monitoring can include:

* API request count
* API failures
* Response latency
* Token usage
* Rate-limit errors

## Suggested Dashboard

```text
+------------------------------------------------+
|          AI TRAVEL PLANNER MONITORING          |
+------------------------------------------------+
| Total Requests | Success Rate | Error Rate     |
+------------------------------------------------+
| Backend Status | Frontend Status | API Status  |
+------------------------------------------------+
| Agent Performance                              |
|                                                |
| Destination Agent       Execution Time        |
| Budget Agent            Execution Time        |
| Recommendation Agent    Execution Time        |
| Itinerary Agent         Execution Time        |
+------------------------------------------------+
| Recent Errors                                  |
+------------------------------------------------+
```

## Future Monitoring Tools

A production deployment could integrate monitoring tools such as:

* Application logs
* Health-check endpoints
* Cloud monitoring services
* Error tracking
* Performance monitoring
* AI/API usage monitoring

---

# Conclusion

The AI Travel Planner demonstrates a multi-agent Agentic AI architecture for personalized travel planning.

The system separates travel-planning responsibilities across specialized agents and uses an orchestrator to coordinate their outputs. The frontend provides a simple interface for user preferences, while the backend manages the agent workflow and returns a structured travel plan.

The architecture can be extended in the future with real-time travel APIs, hotel and flight data, maps, weather information, persistent user profiles, authentication, and production monitoring.
