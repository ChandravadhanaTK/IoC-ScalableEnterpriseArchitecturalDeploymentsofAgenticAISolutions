# SkillBridge AI — Capstone Assignment Submission

**Student Name:** Thariq Azees  
**Roll Number:** 2023103576  
**Course:** IoC — Scalable Enterprise Architectural Deployments of Agentic AI Solutions  
**Target Repository:** [https://github.com/ChandravadhanaTK/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions](https://github.com/ChandravadhanaTK/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions)  
**Student GitHub Repository:** [https://github.com/ThariqAzees/SkillBridgeAI](https://github.com/ThariqAzees/SkillBridgeAI)  
**Live Deployed Application:** [https://skill-bridge-ai-blush.vercel.app/it](https://skill-bridge-ai-blush.vercel.app/it)  

---

## Executive Summary

This submission package contains the complete capstone assignment for **SkillBridge AI**, a realistic, production-ready AI freelance marketplace and agent ecosystem. The platform integrates five core agentic workflows: automated proposal drafting, AI profile enhancement, semantic project matching, multi-tier AI community post moderation, and interactive freelancing strategy guidance.

---

## Directory Structure Map

```
Assignment/2023103576-ThariqAzees/
├── README.md                           # Master Assignment Overview & Quick Start
├── APPLICATION_GENERATION_PROMPT.md    # Reusable AI Agent Generation Prompt Blueprint
├── CAPSTONE_DELIVERABLES.md            # Comprehensive Document Compiling All 5 Deliverables
├── architecture/
│   ├── ARCHITECTURE_DIAGRAM.md          # Deliverable 1: Architecture Diagram & Layers
│   ├── AGENT_WORKFLOW_DESIGN.md         # Deliverable 2: Agent Workflow & AI Specifications
│   ├── DEPLOYMENT_STRATEGY.md          # Deliverable 3: Vercel & Infrastructure Strategy
│   ├── SECURITY_MODEL.md               # Deliverable 4: Security Model & Cryptographic Tokens
│   └── MONITORING_DASHBOARD_DESIGN.md  # Deliverable 5: Operational Telemetry & Dashboard Design
├── diagrams/                           # Rendered Architecture & State Diagrams
└── source-code/                        # Complete SkillBridge AI Web Application Source Code
    ├── src/                            # App Router Pages, Components, APIs, & Libs
    ├── prisma/                         # Prisma Schema (schema.prisma) & Database Client
    ├── public/                         # Public Assets & Icons
    ├── scratch/                        # Automated Token Security Test Suite
    ├── package.json                    # Package Manifest & Scripts
    ├── .env.example                    # Sanitized Environment Configuration Template
    └── tsconfig.json                   # TypeScript Configuration
```

---

## Capstone Deliverables Index

| Deliverable | Title | Document Link |
| :--- | :--- | :--- |
| **Deliverable 1** | Architecture Diagram | [`architecture/ARCHITECTURE_DIAGRAM.md`](file:///d:/ScalableAI/files%20%286%29/course-repo/Assignment/2023103576-ThariqAzees/architecture/ARCHITECTURE_DIAGRAM.md) |
| **Deliverable 2** | Agent Workflow Design | [`architecture/AGENT_WORKFLOW_DESIGN.md`](file:///d:/ScalableAI/files%20%286%29/course-repo/Assignment/2023103576-ThariqAzees/architecture/AGENT_WORKFLOW_DESIGN.md) |
| **Deliverable 3** | Deployment Strategy | [`architecture/DEPLOYMENT_STRATEGY.md`](file:///d:/ScalableAI/files%20%286%29/course-repo/Assignment/2023103576-ThariqAzees/architecture/DEPLOYMENT_STRATEGY.md) |
| **Deliverable 4** | Security Model | [`architecture/SECURITY_MODEL.md`](file:///d:/ScalableAI/files%20%286%29/course-repo/Assignment/2023103576-ThariqAzees/architecture/SECURITY_MODEL.md) |
| **Deliverable 5** | Monitoring Dashboard Design | [`architecture/MONITORING_DASHBOARD_DESIGN.md`](file:///d:/ScalableAI/files%20%286%29/course-repo/Assignment/2023103576-ThariqAzees/architecture/MONITORING_DASHBOARD_DESIGN.md) |
| **Master Doc** | Compiled Deliverables | [`CAPSTONE_DELIVERABLES.md`](file:///d:/ScalableAI/files%20%286%29/course-repo/Assignment/2023103576-ThariqAzees/CAPSTONE_DELIVERABLES.md) |
| **Blueprint** | Application Generation Prompt | [`APPLICATION_GENERATION_PROMPT.md`](file:///d:/ScalableAI/files%20%286%29/course-repo/Assignment/2023103576-ThariqAzees/APPLICATION_GENERATION_PROMPT.md) |

---

## Local Setup & Quick Start Guide

To run the application locally from the `source-code/` directory:

1. **Navigate to source directory**:
   ```bash
   cd source-code
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Supabase, OpenAI, and Nodemailer SMTP credentials:
   ```bash
   cp .env.example .env
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Execute Automated Token Security Tests**:
   ```bash
   npx tsx scratch/test-tokens.ts
   ```
