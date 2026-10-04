# Project Submission Details

## Student Information

| Field | Details |
|---|---|
| Name | Balaji T |
| Roll No. | 2023103090 |

## Project Information

| Field | Details |
|---|---|
| Project Name | Room Organization Assistant |
| Project Type | AI-powered web application |

## Deployment

**Live application:** [https://room-organization-assistant.web.app/](https://room-organization-assistant.web.app/)

## Source Code

**GitHub repository:** [balajitamilselvan28/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions](https://github.com/balajitamilselvan28/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions)

The application source is in `Assignment/2023103090-Balaji/Room-Organization-Assistant/`. Ensure the latest assignment files are pushed to the repository before submission.

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini API
- Browser LocalStorage
- Firebase Hosting
- Git and GitHub
- npm

## Project Description

Room Organization Assistant helps users turn a written description of a messy room into an AI-generated cleanup plan. The plan contains a summary and cleanup tasks with priorities and estimated durations. Users can track task statuses, review cleanup progress, and ask the AI assistant questions using their room description and current plan as context.

The room description and cleanup plan are saved in browser LocalStorage. The application is deployed as a static site using Firebase Hosting and is designed to remain compatible with the Firebase Spark/free-tier constraint.

## Implemented Features

- Enter and edit a room description.
- Generate a structured cleanup plan using Gemini.
- View cleanup tasks with priority, estimated time, and status.
- Start, set pending, complete, and reopen cleanup tasks.
- View task completion percentage, completed and remaining task counts, remaining estimated time, and the next unfinished task.
- Ask the AI assistant questions about the current room and cleanup plan.
- Save and restore the room description and cleanup plan with LocalStorage.
- Start a new cleanup after confirming removal of the current plan.
- Use a responsive interface styled with Tailwind CSS.

The application does not provide a separate automatic re-planning feature or a monitoring dashboard. Editing the room description allows the user to request a newly generated plan.

## Documentation and Deliverables

| Document | Contents |
|---|---|
| [02-Deliverables.md](./02-Deliverables.md) | Academic project documentation, including solution details, security considerations, deployment, testing status, and limitations. |
| [docs/architecture.md](./docs/architecture.md) | System architecture overview and architecture diagram. |
| [docs/application-workflow.md](./docs/application-workflow.md) | Current user and AI interaction workflow diagram. |

The architecture and workflow documents describe the implemented client-side application. The workflow is a Gemini-assisted request/response flow, not an autonomous multi-agent system. A separate monitoring dashboard design is not included among the current deliverables.
