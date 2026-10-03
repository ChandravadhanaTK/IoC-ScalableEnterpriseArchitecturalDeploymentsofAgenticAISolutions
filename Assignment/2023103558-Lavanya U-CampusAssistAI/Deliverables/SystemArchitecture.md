# System Architecture — CampusAssist AI

## 1. Overview

CampusAssist AI is a lightweight Agentic AI web application that accepts a student's campus-related issue, processes it through two logical AI agents, and presents a reviewable recommendation.

## 2. High-Level Architecture

```text
+----------------------+
|       Student        |
+----------+-----------+
           |
           v
+----------------------+
|  CampusAssist Web UI |
|    React/TypeScript   |
+----------+-----------+
           |
           v
+----------------------+
|  AI Service Layer    |
|   Server-side AI     |
+----------+-----------+
           |
           v
+----------------------+
|     Triage Agent     |
| Category / Priority  |
| Reason / Confidence  |
+----------+-----------+
           |
           v
+----------------------+
|     Action Agent     |
| Department / Action  |
| Escalation           |
+----------+-----------+
           |
           v
+----------------------+
| AI Recommendation    |
| Reviewable Result    |
+----------------------+
```

## 3. Components

### Student Interface
Accepts the issue and displays workflow progress and recommendations.

### AI Service Layer
Provides the controlled server-side boundary for AI processing and keeps secrets out of the browser.

### Triage Agent
Determines category, priority, reasoning and confidence.

### Action Agent
Uses the triage result to recommend a department, next action and escalation status.

### Result Layer
Presents the AI output as a recommendation rather than an authoritative decision.

## 4. Trust Boundaries

- Browser/user input boundary
- Server-side AI processing boundary
- External/AI service boundary
- User-visible recommendation boundary

## 5. Data Flow

1. Student enters an issue.
2. Web UI validates the input.
3. Triage Agent analyzes the issue.
4. Action Agent uses the triage output.
5. The result is returned to the UI.
6. The student reviews the recommendation.

## 6. Architecture Principles

- Keep AI processing controlled and reviewable.
- Keep secrets away from client-side code.
- Separate AI recommendation from human decision-making.
- Fail safely when processing fails.
