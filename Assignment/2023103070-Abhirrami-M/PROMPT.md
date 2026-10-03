# ResearchMate – Master Generation Prompt

> Contains no secrets. Sections: objective, requirements, agent architecture, stack, APIs, security, deployment, deliverables.

Build and deploy a SIMPLE, COMPLETE, WORKING Agentic AI application for my IoC capstone.

PROJECT TITLE:
ResearchMate – Agentic AI Research Paper Assistant

IMPORTANT:
This project must be SIMPLE enough to complete within the available Lovable credits.
Do NOT over-engineer it.
Do NOT add unnecessary authentication, payments, databases, admin panels, complex microservices, or unnecessary pages.

The main objective is:
1. Create a working Agentic AI application.
2. Demonstrate a clear multi-step agent workflow.
3. Search real research papers.
4. Validate and rank the papers.
5. Generate a useful research response.
6. Create ALL five required capstone deliverables.
7. Create PROMPT.md containing this master prompt.
8. Create README.md.
9. Create DEPLOYED-LINK.md.
10. Deploy the application successfully.

==================================================
1. APPLICATION CONCEPT
==================================================

Create a web application called:

ResearchMate
"An Agentic AI Research Paper Assistant"

The user enters a natural-language research request such as:

"Find recent research papers about AI-based healthcare diagnosis"

The system performs an agentic workflow:

USER REQUEST
      ↓
PLANNER AGENT
      ↓
SEARCH AGENT
      ↓
VALIDATION AGENT
      ↓
RANKING AGENT
      ↓
ANALYSIS AGENT
      ↓
FINAL RESPONSE

The application should clearly show that multiple agent roles/workflow stages are being executed.

==================================================
2. KEEP THE APPLICATION SIMPLE
==================================================

Use a simple modern React frontend.

Preferred stack:

- React
- TypeScript
- Vite
- Tailwind CSS
- Simple backend/serverless functions only where required
- No unnecessary database
- No complex authentication

Use a clean professional academic/enterprise UI.

Main pages:

1. Home / Research
2. Agent Workflow
3. Capstone Deliverables
4. About

Do NOT create 10+ unnecessary pages.

==================================================
3. MAIN RESEARCH FUNCTION
==================================================

The main page must contain:

Title:
"ResearchMate"

Subtitle:
"Agentic AI Research Paper Assistant"

Large research input box.

Example placeholder:

"Ask me to find and analyze research papers..."

Button:

"Start Research"

When the user submits a research question, execute the agent workflow.

==================================================
4. AGENTIC WORKFLOW
==================================================

Implement the following logical agents:

AGENT 1 — PLANNER AGENT

Input:
User's research question.

Responsibilities:
- Understand the research intent.
- Extract keywords.
- Identify the research topic.
- Decide what type of papers should be searched.

Output:
A structured research plan.

Example:

Topic:
Large Language Models

Keywords:
LLM, transformer, hallucination, language model

Search intent:
Find recent research papers.

------------------------------------------

AGENT 2 — SEARCH AGENT

Search real scholarly research papers.

Use OpenAlex API as the primary scholarly source because it is suitable for a simple working demonstration.

Optionally use Crossref as a secondary source if easy to implement.

Retrieve:

- Paper title
- Authors
- Publication year
- Abstract when available
- DOI
- Source/journal
- Paper URL
- Citation information when available

IMPORTANT:

Never invent papers.

Never invent DOI values.

Never invent authors.

Never fabricate URLs.

Only display information returned by the API.

------------------------------------------

AGENT 3 — VALIDATION AGENT

Validate retrieved papers.

Check:

- Title exists
- Author information exists where available
- Publication year exists
- DOI/URL if available
- Source information
- Duplicate papers

Remove obvious duplicates.

Display a validation status.

Example:

✓ Verified scholarly record

If some metadata is unavailable, clearly show:

"Metadata unavailable"

Do not fabricate missing information.

------------------------------------------

AGENT 4 — RANKING AGENT

Rank papers based on relevance to the user's research request.

Use simple explainable criteria:

- Keyword/topic relevance
- Publication recency
- Availability of abstract
- Scholarly source metadata

Show a simple relevance score such as:

Relevance: 92%

The score must be calculated from actual available data.

Do not claim the score is an official academic metric.

------------------------------------------

AGENT 5 — ANALYSIS AGENT

Analyze the selected papers.

For every paper show:

- Short summary
- Main contribution
- Research topic
- Key finding if supported by available abstract/content
- Limitations when information is available

If an AI model is available through the Lovable environment, use it for summarization.

If AI API credentials are required, keep them server-side.

NEVER expose API keys in frontend code.

If an AI service is unavailable, the application must still work using the paper metadata/abstract and a deterministic fallback summary.

------------------------------------------

AGENT 6 — SYNTHESIS AGENT

Create a final research synthesis.

Show:

"Research Summary"

Include:

- Main research themes
- Important findings from the retrieved papers
- Common approaches
- Differences between papers
- Research gaps when reasonably supported
- Recommended papers to read first

Do not invent facts that are not supported by retrieved paper metadata/abstracts.

==================================================
5. AGENT EXECUTION UI
==================================================

When the user clicks Start Research, show an agent execution panel.

Example:

Agent Workflow

✓ Planner Agent
  Research intent identified

✓ Search Agent
  10 scholarly papers found

✓ Validation Agent
  8 valid papers retained

✓ Ranking Agent
  Papers ranked by relevance

✓ Analysis Agent
  Selected papers analyzed

✓ Synthesis Agent
  Final research report generated

Use loading states while each stage runs.

The workflow must be visually clear.

==================================================
6. RESEARCH RESULTS
==================================================

Display results as professional cards.

Each paper card must contain:

Paper title

Authors

Year

Journal/source

Relevance score

Validation status

Short summary

DOI if available

"View Paper" button

The View Paper button must open the real source/DOI URL.

Never generate fake URLs.

==================================================
7. SIMPLE COMPARISON
==================================================

After retrieving papers, provide a simple comparison section.

Columns:

Paper
Year
Source
Relevance
Main Topic
Summary

Keep it simple.

==================================================
8. AGENT WORKFLOW PAGE
==================================================

Create a page:

/agent-workflow

Show a professional workflow diagram:

User
 ↓
Planner Agent
 ↓
Search Agent
 ↓
Validation Agent
 ↓
Ranking Agent
 ↓
Analysis Agent
 ↓
Synthesis Agent
 ↓
Final Research Report

Also explain:

Agent roles
Inputs
Outputs
Tools
Handoffs
Failure paths
Human interaction

Failure paths must include:

- API unavailable
- No papers found
- Invalid metadata
- AI summarization unavailable
- Network timeout

For failures, provide user-friendly messages.

==================================================
9. CAPSTONE DELIVERABLES PAGE
==================================================

Create:

/capstone-deliverables

Display the five required deliverables exactly matching the course requirement:

1. Architecture Diagram
   Layers, components, trust boundaries and integrations

2. Agent Workflow Design
   Roles, states, tools, handoffs, approvals and failure paths

3. Deployment Strategy
   Runtime, scaling, resilience, environments and release

4. Security Model
   Identity, authorization, secrets, privacy, guardrails and audit

5. Monitoring Dashboard Design
   Health, trace, quality, safety, cost and business outcomes

The page should contain a short explanation of each.

==================================================
10. REQUIRED FILES
==================================================

Create the following files in the project.

ROOT:

PROMPT.md
README.md
DEPLOYED-LINK.md

FOLDER:

capstone-deliverables/

Inside it create:

01-ARCHITECTURE-DIAGRAM.md

02-AGENT-WORKFLOW-DESIGN.md

03-DEPLOYMENT-STRATEGY.md

04-SECURITY-MODEL.md

05-MONITORING-DASHBOARD-DESIGN.md

CAPSTONE-DELIVERABLES.md

==================================================
11. PROMPT.MD
==================================================

PROMPT.md must contain the complete master prompt used to generate this application.

Clearly title it:

"ResearchMate – Master Generation Prompt"

Include:

- Project objective
- Application requirements
- Agent architecture
- Technology stack
- APIs
- Security requirements
- Deployment requirements
- Deliverables

Do not put secrets inside this file.

==================================================
12. ARCHITECTURE DELIVERABLE
==================================================

Create:

capstone-deliverables/01-ARCHITECTURE-DIAGRAM.md

Include:

Title:
"ResearchMate Enterprise Architecture"

Describe:

Presentation Layer
Application Layer
Agent Layer
Research API Integration Layer
AI/Analysis Layer
Monitoring Layer

Architecture:

User
 ↓
React Web Application
 ↓
Agent Orchestrator
 ├── Planner Agent
 ├── Search Agent
 ├── Validation Agent
 ├── Ranking Agent
 ├── Analysis Agent
 └── Synthesis Agent
 ↓
Scholarly APIs
 ├── OpenAlex
 └── Crossref if implemented
 ↓
Research Results
 ↓
User

Also document:

- Components
- Data flow
- Trust boundaries
- External integrations
- Security boundaries

Include a Mermaid architecture diagram.

==================================================
13. AGENT WORKFLOW DELIVERABLE
==================================================

Create:

capstone-deliverables/02-AGENT-WORKFLOW-DESIGN.md

Include:

- Agent roles
- Agent inputs
- Agent outputs
- State transitions
- Tools
- Handoffs
- Failure handling
- Human interaction

Include Mermaid workflow diagram.

Example:

START
 ↓
User Research Request
 ↓
Planner
 ↓
Search
 ↓
Validate
 ↓
Rank
 ↓
Analyze
 ↓
Synthesize
 ↓
Final Response
 ↓
END

Failure paths:

Search Failure → Retry → User Message

No Results → User Message

Invalid Metadata → Filter

AI Failure → Deterministic Fallback

==================================================
14. DEPLOYMENT STRATEGY DELIVERABLE
==================================================

Create:

capstone-deliverables/03-DEPLOYMENT-STRATEGY.md

Keep deployment simple.

Explain:

Development Environment
Testing Environment
Production Environment

Deployment:

Developer
 ↓
GitHub
 ↓
Lovable Build
 ↓
Production Deployment
 ↓
Users

Discuss:

- Runtime
- Build
- Deployment
- Environment variables
- API configuration
- Basic scalability
- Error handling
- Availability
- Rollback
- Release process

Do not claim Kubernetes, multi-region infrastructure, autoscaling clusters, or enterprise infrastructure unless actually implemented.

Keep the deployment description truthful to the application.

==================================================
15. SECURITY MODEL DELIVERABLE
==================================================

Create:

capstone-deliverables/04-SECURITY-MODEL.md

Include:

Identity
Authorization
Secrets management
API security
Input validation
Prompt injection awareness
Data privacy
AI guardrails
Logging
Auditability

Important:

API keys must never be placed in React frontend code.

Use environment variables/server-side functions when required.

Do not store sensitive user information unnecessarily.

Include a Mermaid security boundary diagram.

==================================================
16. MONITORING DELIVERABLE
==================================================

Create:

capstone-deliverables/05-MONITORING-DASHBOARD-DESIGN.md

Design a simple monitoring dashboard specification.

Include:

Health metrics:

- API availability
- Request latency
- Error rate

Agent metrics:

- Agent execution time
- Workflow completion rate
- Failed agent steps

AI quality:

- Result relevance
- Summary generation success
- No-result rate

Safety:

- Invalid input count
- Blocked unsafe request count if applicable
- Prompt injection detection events if implemented

Cost:

- API usage
- AI request count

Business/outcome metrics:

- Research requests
- Papers retrieved
- Successful research sessions

Explain what should be monitored even if a full production monitoring system is not implemented.

Do NOT falsely claim that external monitoring infrastructure exists.

==================================================
17. COMPLETE CAPSTONE DOCUMENT
==================================================

Create:

capstone-deliverables/CAPSTONE-DELIVERABLES.md

This must combine all five required deliverables in ONE professional Markdown document.

Structure:

# ResearchMate – Capstone Deliverables

## 1. Architecture Diagram
## 2. Agent Workflow Design
## 3. Deployment Strategy
## 4. Security Model
## 5. Monitoring Dashboard Design

Include all diagrams and explanations.

This is the document I can submit to my faculty.

==================================================
18. README.MD
==================================================

Create a professional README.md.

Include:

# ResearchMate

## Project Overview

## Problem Statement

## Solution

## Agentic AI Workflow

## Features

## Technology Stack

## Scholarly APIs

## Architecture

## How to Run

## Environment Variables

## Deployment

## Capstone Deliverables

## Project Structure

## Limitations

## Future Enhancements

Do not include fake deployment URLs.

==================================================
19. DEPLOYED-LINK.MD
==================================================

Create:

DEPLOYED-LINK.md

Content:

# ResearchMate – Deployment

## Production Application

[ACTUAL DEPLOYED URL]

Only replace this with the real deployed URL after successful deployment.

IMPORTANT:
DO NOT fabricate a URL.

If deployment is not completed yet, write:

"Deployment pending – deploy the application before submission."

After successful deployment, update this file with the real URL.

==================================================
20. PROJECT STRUCTURE
==================================================

The final project should look similar to:

ResearchMate/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── agents/
│   └── ...
│
├── capstone-deliverables/
│   ├── 01-ARCHITECTURE-DIAGRAM.md
│   ├── 02-AGENT-WORKFLOW-DESIGN.md
│   ├── 03-DEPLOYMENT-STRATEGY.md
│   ├── 04-SECURITY-MODEL.md
│   ├── 05-MONITORING-DASHBOARD-DESIGN.md
│   └── CAPSTONE-DELIVERABLES.md
│
├── PROMPT.md
├── README.md
├── DEPLOYED-LINK.md
├── package.json
└── other source files

==================================================
21. ERROR HANDLING
==================================================

The application must not crash when:

- API fails
- API returns no results
- Network request times out
- Abstract is missing
- DOI is missing
- AI summarization fails

Show useful messages.

Example:

"No research papers were found for this query. Try using broader keywords."

==================================================
22. TEST THE APPLICATION
==================================================

Before considering the project complete, test:

1. Application loads.
2. Research page loads.
3. User can enter a query.
4. Search API works.
5. Real papers are returned.
6. Paper cards display correctly.
7. Agent workflow is visible.
8. Error handling works.
9. Agent Workflow page works.
10. Capstone Deliverables page works.
11. All required Markdown files exist.
12. No fake URLs.
13. No API keys are exposed.
14. Production build succeeds.

Fix obvious errors before deployment.

==================================================
23. DEPLOYMENT
==================================================

After implementation:

1. Run/build the application.
2. Fix build errors.
3. Verify the production application.
4. Publish/deploy the application using the available Lovable deployment mechanism.
5. Confirm the deployed application opens.
6. Update DEPLOYED-LINK.md with the ACTUAL deployed URL.
7. Make sure the deployed application contains the working ResearchMate application.

Do not stop at creating the UI.

The goal is a working deployed application.

==================================================
24. GITHUB READY
==================================================

Make the entire project GitHub-ready.

Include:

- Source code
- PROMPT.md
- README.md
- DEPLOYED-LINK.md
- capstone-deliverables folder
- package.json
- configuration files
- required application files

Do NOT include:

- API keys
- passwords
- private credentials
- node_modules
- unnecessary generated files

Create/update .gitignore appropriately.

==================================================
25. IMPORTANT SIMPLICITY RULE
==================================================

This is a COLLEGE CAPSTONE DEMONSTRATION.

Do not over-engineer.

Prefer:

ONE React application
+
ONE simple agent workflow
+
REAL SCHOLARLY API
+
OPTIONAL AI SUMMARIZATION
+
CLEAR CAPSTONE DOCUMENTATION
+
DEPLOYMENT

over:

microservices
Kubernetes
complex databases
complex authentication
payment systems
large enterprise infrastructure
unnecessary dashboards

The application must be understandable during a viva.

==================================================
26. VIVA EXPLANATION
==================================================

The application should allow me to explain:

"What is Agentic AI?"

Answer:

"ResearchMate uses multiple specialized agent steps. The planner understands the research request, the search agent retrieves scholarly papers, the validation agent verifies metadata, the ranking agent prioritizes relevant papers, and the analysis and synthesis agents generate the final research response."

Also make the UI demonstrate this workflow clearly.

==================================================
27. FINAL ACCEPTANCE CHECKLIST
==================================================

Before finishing, verify:

[ ] Working React application
[ ] Research input
[ ] Real scholarly paper search
[ ] Agentic workflow
[ ] Planner
[ ] Search
[ ] Validation
[ ] Ranking
[ ] Analysis
[ ] Synthesis
[ ] Real paper links
[ ] Error handling
[ ] Agent Workflow page
[ ] Capstone Deliverables page
[ ] Architecture document
[ ] Agent Workflow document
[ ] Deployment document
[ ] Security document
[ ] Monitoring document
[ ] Combined capstone document
[ ] PROMPT.md
[ ] README.md
[ ] DEPLOYED-LINK.md
[ ] .gitignore
[ ] No secrets committed
[ ] Production build successful
[ ] Application deployed
[ ] Actual deployed URL added

==================================================
FINAL INSTRUCTION
==================================================

BUILD THE PROJECT NOW.

Do not create unnecessary features.

Prioritize:

1. Working Agentic AI
2. Real research-paper retrieval
3. Clean UI
4. All required Markdown deliverables
5. GitHub-ready source code
6. Successful deployment

Do not stop after generating the UI.

Do not fabricate deployment links.

If a deployment or configuration step requires my manual authorization, clearly identify that exact step, but complete everything else automatically.

At the end, show me:

1. What was created
2. Main application URL
3. Deployment status
4. Project structure
5. Location of PROMPT.md
6. Location of the five deliverables
7. Any manual action I must perform