# ProofLab — Application Generation Prompt

Build a simple, polished web application called **ProofLab**.

## Purpose

ProofLab is a technology idea analysis agent. A user enters a proposed technology/project idea, and the application analyzes it from multiple technical and research perspectives.

The goal is to help a student answer:

> “Is this idea worth exploring, how does it compare with existing work, what are its strengths and weaknesses, and how could it actually be built and tested?”

This is a student academic project. Prioritize **working functionality, simplicity, understandable source code, and a clean user experience** over unnecessary enterprise infrastructure.

---

## Core User Flow

1. The user enters a technology/project idea.
2. The user clicks **Analyze Idea**.
3. The agent processes the idea through multiple stages.
4. The interface shows the current analysis stage.
5. The completed analysis is presented as a structured report.
6. The user can start a new analysis or view previous analyses.

Example input:

> “An AI system that predicts traffic congestion using CCTV cameras.”

---

## Agent Workflow

The application should treat the analysis as a sequence of logical agent stages rather than one large chatbot response.

### Stage 1 — Idea Understanding

Identify:

- Core problem
- Proposed technology
- Intended users
- Expected outcome
- Main inputs and outputs

### Stage 2 — STAR Analysis

Analyze the idea using:

- **Situation** — What problem or context exists?
- **Task** — What needs to be accomplished?
- **Action** — How would the proposed technology approach the problem?
- **Result** — What measurable outcome is expected?

### Stage 3 — Positive Aspects

Identify potential:

- Benefits
- Opportunities
- Technical strengths
- Scalability opportunities
- User impact

### Stage 4 — Negative Aspects

Identify:

- Technical limitations
- Risks
- Ethical concerns
- Data limitations
- Cost or infrastructure constraints
- Possible failure cases

### Stage 5 — Existing Work

Investigate related:

- Research papers
- Existing products
- Open-source projects
- Technologies
- Previous approaches

Do **not** fabricate papers, links, statistics, or citations.

Clearly distinguish verified information from assumptions or areas requiring verification.

### Stage 6 — Feasibility

Analyze:

- Technical feasibility
- Required datasets
- Required hardware/software
- Infrastructure
- Development complexity
- Skills required
- Approximate resource requirements

### Stage 7 — Potential Research / Innovation Gap

Compare the proposed idea with existing approaches.

Identify possible areas where the proposed idea could:

- Improve an existing approach
- Combine existing approaches differently
- Address an overlooked constraint
- Be tested in a different environment

Do not claim that an idea is definitely novel. Label findings as **potential gaps requiring verification**.

### Stage 8 — Simulation

Where meaningful, perform a small illustrative simulation or calculation.

Examples:

- Traffic waiting-time comparison
- Accuracy/threshold experiment
- Resource/cost calculation
- Queue simulation
- Performance comparison

Show:

- Assumptions
- Input parameters
- Method
- Result
- Limitations

If a meaningful simulation cannot be performed for the particular idea, explicitly explain why instead of inventing results.

### Stage 9 — Proposed Architecture

Create a simple technical architecture for the proposed solution.

Example:

```text
Input
  ↓
Data Processing
  ↓
AI / ML Model
  ↓
Backend / Decision Layer
  ↓
Database / External Services
  ↓
User Interface
```

Adapt the architecture to the user's idea.

### Stage 10 — Final Report

Produce a concise final report containing:

- Idea summary
- STAR analysis
- Positive aspects
- Negative aspects
- Existing work
- Feasibility
- Potential research gap
- Simulation
- Proposed architecture
- Suggested next step

---

## Agent Behaviour

The application should visibly show the workflow.

Each stage should have one of these states:

- Pending
- Running
- Completed
- Skipped
- Failed

The agent may skip stages that are not applicable.

Do not expose hidden chain-of-thought or private reasoning. Show only concise findings, evidence, summaries, assumptions, and conclusions.

If information is uncertain, label it clearly.

Never fabricate research evidence or simulation results.

---

## User Interface

Create a modern technical/research dashboard.

Avoid excessive gradients, glowing effects, stock AI imagery, or generic chatbot aesthetics.

### Landing Page

Include:

- ProofLab logo/name
- Subtitle: **“From Idea to Evidence”**
- Short explanation
- Large technology idea input box
- Analyze Idea button
- Example ideas

### Analysis View

Display the workflow:

```text
Idea Understanding
      ↓
STAR Analysis
      ↓
Pros & Cons
      ↓
Existing Work
      ↓
Feasibility
      ↓
Research Gap
      ↓
Simulation
      ↓
Architecture
      ↓
Final Report
```

Use clear visual status indicators.

### Results View

Organize the results into sections or tabs:

- Overview
- STAR
- Positives
- Negatives
- Existing Work
- Feasibility
- Research Gap
- Simulation
- Architecture
- Final Report

Include:

- New Analysis button
- Export/download report option if practical
- Analysis history

---

## Technical Requirements

Use a simple maintainable architecture.

### Frontend

React + TypeScript.

### Backend / AI

Use a secure server-side API integration for the LLM.

API keys must never be exposed in frontend code.

### Agent Design

Keep each analysis stage logically separated into reusable functions/modules.

Do not put the entire workflow into one giant function.

### Simulation

Use deterministic code/calculations where appropriate instead of asking the LLM to invent numerical results.

### Storage

Use lightweight storage for analysis history if needed.

Do not introduce unnecessary databases or infrastructure.

---

## Security

Implement basic security practices:

- API keys in environment variables
- No secrets in source code
- Input validation
- Server-side API calls
- No unnecessary collection of personal information
- Clear indication that research findings should be independently verified
- Safe handling of external research content

---

## Error Handling

Handle:

- Empty input
- Invalid input
- API failures
- Research/search failures
- Simulation failures
- Timeouts

Show useful user-friendly error messages and allow the analysis to be retried.

---

## Deployment

Make the project deployable through the platform's hosting.

Include a `README.md` explaining:

- What ProofLab is
- Application workflow
- Technology stack
- Project structure
- Environment variables
- Local setup
- Deployment instructions
- Deployed application URL

---

## Important Constraints

This is a student assignment.

Do NOT add:

- Microservices
- Kubernetes
- Complex authentication
- Unnecessary enterprise infrastructure
- Unnecessary third-party services
- Overly complicated databases

The final application should be small, understandable, functional, and clearly demonstrate an **agentic technology-idea analysis workflow**.
