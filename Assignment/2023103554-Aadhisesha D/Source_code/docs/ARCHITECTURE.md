# PlacementPilot Architecture

## System overview

PlacementPilot intentionally keeps the server stateless. There is no database. The browser uses localStorage for session history, the latest placement analysis and training attempts.

```text
┌──────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                              │
│  React + Vite + TypeScript                                         │
│  ├── Overview                                                      │
│  ├── Placement Run                                                 │
│  ├── Role Intelligence                                             │
│  ├── Resume Intelligence                                           │
│  ├── Role Trainer                                                  │
│  ├── Preparation Sprint                                           │
│  └── Agent Monitor                                                 │
│                                                                    │
│  localStorage                                                      │
│  ├── placement state                                               │
│  └── training attempts                                             │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS JSON
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     VERCEL SERVERLESS                              │
│  /api/placement-analysis                                           │
│  /api/training-question                                            │
│  /api/health                                                       │
│                                                                    │
│  Agent Orchestrator                                                │
│       ├── Resume Agent                                             │
│       ├── Job Agent                                                │
│       ├── Skill Gap Agent                                          │
│       ├── Interview Agent                                          │
│       ├── Career Planner Agent                                     │
│       ├── Role Training Agent                                      │
│       ├── Training Evaluator                                       │
│       └── Validation Layer                                         │
└───────────────────────────────┬──────────────────────────────────┘
                                │ server-side API call
                                ▼
                         ┌─────────────┐
                         │ NVIDIA NIM  │
                         └─────────────┘
```

## Agent contracts

Every agent follows the same contract:

```text
Role / System instruction
        ↓
Evidence payload
        ↓
Structured JSON schema
        ↓
Normalization
        ↓
Validated downstream context
```

This makes agent handoffs deterministic and easy to inspect.

## Placement run state machine

```text
REQUESTED
   ↓
VALIDATING
   ↓
RUNNING
   ├── Resume Agent
   ├── Job Analysis Agent
   ├── Skill Gap Agent
   ├── Interview Agent
   └── Career Planner Agent
   ↓
VALIDATING OUTPUT
   ├── pass → COMPLETED
   └── fail → FAILED
```

## Training state machine

```text
SELECT TYPE + DIFFICULTY
          ↓
      GENERATE
          ↓
      QUESTION
          ↓
      ANSWER
          ↓
      EVALUATE
          ↓
      SCORE + FEEDBACK
          ↓
   NEXT QUESTION / EXIT
```

## Trust boundaries

- The browser is untrusted.
- Resume/job text is untrusted input.
- The NVIDIA NIM API key exists only in the server runtime.
- Model output is untrusted until it passes schema validation.
- Training evaluation does not claim actual code execution; coding responses are conceptually reviewed unless a true sandbox is added later.

## Why there is no database

The course assignment can demonstrate planning, delegation, tools, handoffs, approvals, failure paths and monitoring without permanent multi-user storage. Removing persistence reduces infrastructure and simplifies the deployment story. Browser-local session history is sufficient for this assignment prototype.
