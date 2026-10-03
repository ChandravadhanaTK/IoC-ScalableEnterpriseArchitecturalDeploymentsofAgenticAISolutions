# Armor Forge — Application Build Prompt

**Student:** Nitin Vikaas  
**Roll No:** 2023103028

## Role

Act as a senior product engineer, frontend architect, UX designer, and AI-systems architect. Build a production-quality educational web application called **Armor Forge**: an interactive, animated AI-engineering learning workshop presented as a futuristic mission to assemble an intelligent armor system and ultimately confront Ultron.

The application must be functional rather than a static mockup. It should run locally with `npm install` and `npm run dev`, build with `npm run build`, and be deployable as a static SPA.

## Product Goal

Create a browser-based learning experience that takes a learner through 12 progressively harder systems:

1. Python fundamentals
2. NumPy / arrays / DataFrames
3. Probability and statistics
4. Machine learning
5. Model evaluation
6. Neural networks / gradient descent
7. Computer vision
8. NLP / transformers
9. Computer vision targeting
10. Reinforcement learning
11. Retrieval-Augmented Generation (RAG)
12. Agentic AI, tools, observability, safety, and human oversight

Use the Iron Man / JARVIS / Ultron narrative as the visual and storytelling layer, while keeping the educational content technically meaningful.

## Core User Experience

Build these main experiences:

- Cinematic landing page introducing the Forge Protocol.
- Campaign map showing the 12 learning missions and progression.
- Level pages with:
  - mission briefing
  - learning concepts
  - interactive knowledge matching
  - coding challenge
  - execution output
  - test results
  - hints
  - completion state
- Workshop showing the assembled armor and system status.
- Progress page showing XP, forged systems, missions, and current objective.
- Glossary / system index with searchable concepts, definitions, study notes, and examples.
- Responsive navigation and persistent local learner state.

The application should make the learner feel that every completed technical concept activates another part of the armor.

## Interactive Python Lab

Implement an in-browser Python coding environment using CodeMirror and Pyodide/Web Worker execution.

Requirements:

- Syntax-highlighted Python editor.
- Run button for visible execution.
- Submit button for challenge tests.
- Execution output panel.
- Test result display.
- Submission/attempt count.
- Reset capability.
- Hint support.
- Execution timeout protection.
- Save the learner's current code locally.
- Never expose server secrets in browser variables.

The architecture should allow the Python execution layer to be replaced by a backend service later.

## Architecture

Use:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Motion / motion primitives
- Lucide icons
- Recharts where useful
- CodeMirror for the Python editor
- Pyodide in a Web Worker
- Zod for schema boundaries
- Three.js for the armor / FBX visualisation
- Sonner for notifications

Use a service abstraction:

`UI → API service interface → mock API OR HTTP API`

The UI must not directly depend on the mock implementation. The API mode should be selected centrally through `src/services/api/index.ts`.

Provide an OpenAPI contract under `docs/openapi.yaml` describing the backend boundary.

## Agentic / Enterprise Architecture

Design the system so the future backend can support:

- authentication
- role-based authorization
- learner progress
- level start/complete
- coding challenges
- boss challenges
- agent runs
- agent event streaming
- JARVIS chat
- approvals / skip requests
- metrics
- admin agent configuration
- guardrails
- content management
- audit logs

Document explicit failure paths, authorization boundaries, human approval points, audit requirements, and observability.

The frontend may use mock mode for the deployed demo, but clearly document which enterprise capabilities are represented by the backend contract rather than pretending that an unimplemented backend exists.

## Visual Direction

Create a premium cinematic engineering interface rather than a generic dashboard.

Use:

- dark near-black / graphite base
- cyan/arc-reactor accent
- warm gold secondary accent
- off-white typography
- monospace technical labels
- large editorial typography
- subtle grid and HUD elements
- glass panels only where useful
- restrained borders
- cinematic imagery
- animated reactor rings
- scanlines / telemetry details
- purposeful motion
- responsive layouts
- accessible focus states
- reduced-motion support

Avoid generic SaaS cards, excessive gradients, visual clutter, and meaningless animation.

## Motion

Use animation to communicate:

- mission entry
- progression
- system activation
- reactor power
- transitions between learning stages
- successful forge completion

Respect `prefers-reduced-motion` and provide a readable static experience.

## Data Model

Seed 12 campaign chapters with:

- mission
- threat
- JARVIS briefing
- objective
- armor subsystem

Seed learning content and glossary entries.

Keep demo state local and deterministic.

## Security Requirements

- No credentials in source code.
- `VITE_*` variables must not contain secrets.
- Include `.env.example`.
- UI authorization must not be treated as a real security boundary.
- Future backend must enforce authentication and authorization server-side.
- Validate API input/output at the schema boundary.
- Add audit events for privileged operations.
- Add rate limiting and abuse protection to future code-execution and agent endpoints.
- Treat LLM output as untrusted data.
- Add guardrails and human approval for high-impact agent actions.

## Deployment

The application must work as a single-page application on Vercel or another static hosting provider.

Configure SPA fallback so routes such as:

- `/map`
- `/workshop`
- `/progress`
- `/glossary`
- `/level/1`

continue to work after refresh.

Use a production build and provide a clear README with:

- prerequisites
- installation
- development
- testing
- build
- preview
- environment variables
- deployment notes

## Quality

The final implementation should:

- compile without TypeScript errors
- have a production build
- keep source modular
- avoid unnecessary duplication
- use semantic accessible controls
- handle loading/error/empty states
- work on desktop and mobile
- preserve learner state locally
- include automated tests for important state-machine logic

## Deliverables

Produce:

1. Complete application source code.
2. `Application_Build_Prompt.md` containing this generation specification.
3. `Capstone_Deliverables.md` documenting:
   - Architecture Diagram
   - Agent Workflow Design
   - Deployment Strategy
   - Security Model
   - Monitoring Dashboard Design
4. `README.md` with setup and deployment instructions.
5. OpenAPI backend contract.
