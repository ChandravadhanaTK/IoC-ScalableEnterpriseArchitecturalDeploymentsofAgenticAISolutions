# CampusAssist AI — Generation Prompt

## Project Goal

Build a small, polished and deployable React/TypeScript web application called **CampusAssist AI**.

The application is an AI-powered campus issue assistant. A student enters a campus-related problem and two AI agents analyze it and recommend the next action.

## Main Workflow

Student Issue → Triage Agent → Action Agent → AI Recommendation

## Main UI

Create one responsive dashboard page containing:
- CampusAssist AI title and description
- Issue input box
- Analyze Issue button
- Example issue suggestions
- Analysis result card
- Recent analyses
- Agent workflow visualization

## Triage Agent

Analyze the submitted issue and return:
- Category: Academic, Hostel, Technical, Transport, Administration, Other
- Priority: Low, Medium, High, Critical
- Short reasoning
- Confidence percentage

Label results as **AI Recommendation**.

## Action Agent

Use the Triage Agent result and return:
- Recommended campus department
- Recommended next action
- Whether escalation is recommended

## Result

Display:
- Original issue
- Category
- Priority
- Confidence
- AI reasoning
- Department
- Recommended action
- Escalation status

## Agent Workflow

Student Issue
↓
Triage Agent
↓
Action Agent
↓
AI Recommendation

Show statuses: Pending, Processing, Completed, Failed.

## Error Handling

Include:
- Empty-input validation
- Loading state
- Error state
- Retry button
- Analyze Another Issue button

## Responsible AI

Display that AI recommendations are informational and should be verified with the appropriate campus department for important matters.

Do not allow automatic irreversible actions.

## UI

Use a clean, modern, responsive campus-style design with cards, badges, clear typography and subtle animations.

Keep the project small and lightweight. Do not add unnecessary authentication, payments, complex databases, admin panels, or external integrations.

Keep API keys and secrets out of frontend code.
