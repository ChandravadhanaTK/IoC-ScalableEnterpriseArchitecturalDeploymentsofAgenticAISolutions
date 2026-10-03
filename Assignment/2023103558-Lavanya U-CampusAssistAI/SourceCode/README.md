# Campus Compass AI

Build a small, polished and deployable React/TypeScript web app called **CampusAssist AI**.

Purpose: A student enters a campus problem and two AI agents analyze it and recommend the next action.

### Main workflow

Student Issue → Triage Agent → Action Agent → AI Recommendation

### Main UI

Create one responsive dashboard page with:

* CampusAssist AI title and short description
* Large issue input box
* Analyze Issue button
* Example issues
* Analysis result card
* Recent analyses section
* Simple agent workflow visualization

### Triage Agent

Analyze the submitted issue and return:

* Category: Academic, Hostel, Technical, Transport, Administration, Other
* Priority: Low, Medium, High, Critical
* Short reasoning
* Confidence percentage

### Action Agent

Use the Triage Agent result and return:

* Recommended campus department
* Recommended next action
* Whether escalation is recommended

### Result

Show:

* Original issue
* Category
* Priority
* Confidence
* AI reasoning
* Department
* Recommended action
* Escalation status

Clearly label all results as **AI Recommendation**.

### Agent Workflow

Display:

Student Issue
↓
Triage Agent
↓
Action Agent
↓
AI Recommendation

Show each agent as Pending, Processing, Completed or Failed.

### Error handling

Include:

* Empty-input validation
* Loading state
* Error state
* Retry button
* Analyze Another Issue button

### Responsible AI

Display:
"AI recommendations are informational and should be verified with the appropriate campus department for important matters."

Do not allow automatic irreversible actions.

### UI

Use a clean modern campus-style design, responsive on mobile and desktop, with cards, badges, clear typography and subtle animations.

Keep the project **small and lightweight**. Do NOT add authentication, payments, complex databases, admin panels, unnecessary pages, or external integrations.

Use a simple service abstraction for the AI agents. Keep secrets/API keys out of frontend code.

The final application must be functional and easy to deploy.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://campus-support-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/151e5fc1-1b5c-4fe4-a469-ac9447982b95).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
