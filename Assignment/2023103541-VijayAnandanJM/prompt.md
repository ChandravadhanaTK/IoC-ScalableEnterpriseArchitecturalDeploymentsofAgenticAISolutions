# Build Prompt: TripPilot AI — Multi-Agent Trip Planning System

Build a polished, responsive, full-stack web application called TripPilot AI, an enterprise-oriented multi-agent trip planning system.

OBJECTIVE: Turn user travel preferences into a complete, budget-aware itinerary through specialized AI agents, with evidence-backed recommendations, constraint validation, failure recovery and monitoring.

USER FEATURES: Landing page; trip creation form with origin, destination, dates, duration, travelers, budget, interests, dietary requirements, accommodation and transport preferences; destination discovery; day-by-day itinerary with activities, durations, travel times, meal breaks and map links; transport and accommodation comparison; itemized budget and per-person cost; cheaper alternatives; relaxed, balanced and packed itinerary options; weather-aware replanning; saved, editable and duplicate trips; PDF export; profile, trip history and monitoring dashboard.

AGENTS: Implement a backend orchestrator and seven specialized modules: Destination Researcher, Transport Planner, Stay Finder, Itinerary Builder, Budget Optimizer, Weather & Safety Advisor, and Critic/Validator. Define input/output schemas, tools, timeouts, error handling and execution logs for every agent. Use a shared trip state managed by the backend. Implement bounded retries and fallback behaviour.

WORKFLOW: COLLECT_INPUT → RESEARCH → BUILD_ITINERARY → OPTIMIZE_BUDGET → VALIDATE → USER_REVIEW → SAVE_TRIP. When validation fails, request limited revisions from the responsible agents. If constraints remain unsatisfied, explain the unresolved issues rather than falsely declaring success.

STACK: React, TypeScript, Vite and Tailwind CSS for the frontend; Node.js, Express and TypeScript for the backend; MongoDB for persistence; server-side LLM API integration; modular maps, routing, places and weather integrations.

SECURITY: Authentication, user-level trip authorization, server-side secrets, request validation, rate limiting, safe error messages and audit logs. Treat external results and user input as untrusted. Prevent prompt injection from changing tool permissions. Never expose secrets in frontend code. Require explicit user confirmation before bookings or payments.

MONITORING: Use real backend telemetry for planning requests, successful workflows, agent failures, execution duration, retries, API errors, token usage, estimated cost, budget compliance and validation failures. Include per-trip execution traces and timestamps. Do not hardcode fake operational metrics.

DELIVERABLES: Document system architecture, integrations and trust boundaries; agent roles, workflow states, handoffs and failure paths; deployment strategy, environments, scaling, backups and releases; security model, access controls and mitigations; monitoring metrics, alert thresholds and business outcomes.

QUALITY: Reusable components, typed data models, validated API responses, loading/error states, automated tests and a clear README. Distinguish verified data from estimates. Never fabricate live availability, confirmed prices, opening hours or forecasts.

Build incrementally: first the UI and core trip flow, then backend, real agent orchestration, integrations, persistence, security, telemetry, tests and deployment. Explain which features are functional and which require configuration. Never present mock data or simulated agents as real integrations.
