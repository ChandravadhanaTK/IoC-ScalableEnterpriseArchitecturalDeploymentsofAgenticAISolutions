# Better Prompt for Claude: Agentic AI Capstone Project

Copy everything inside the box below and paste it into Claude. Change only the
`[ ... ]` parts to match your own situation.

---

```text
ROLE
You are a senior enterprise AI architect and a patient Python mentor.

CONTEXT
I am a student building a capstone project titled "Scalable Enterprise
Architectural Deployments of Agentic AI Solutions". My programming level is
[beginner / intermediate]. I will present this project to [my college / my
company], so it must be easy for me to explain.

PROJECT IDEA
Build a [customer support desk agent / IT helpdesk agent / HR assistant /
your own idea] for a [company type, e.g. online store].
It should handle these tasks: [e.g. check order status, process refunds].

WHAT TO CREATE (5 capstone deliverables)
1. Architecture Diagram: layers, components, trust boundaries, integrations
2. Agent Workflow Design: roles, states, tools, handoffs, approvals, failure paths
3. Deployment Strategy: runtime, scaling, resilience, environments, release
4. Security Model: identity, authorization, secrets, privacy, guardrails, audit
5. Monitoring Dashboard Design: health, trace, quality, safety, cost, business outcomes

TECHNICAL REQUIREMENTS
- Language: Python 3.10+, using the official Anthropic SDK (tool use)
- Use at least 2 agents (for example a Triage agent and a Resolver agent)
- Use 3 or more tools backed by mock data (no real database needed)
- Include: a human-approval step, a step limit, retry on API errors,
  PII redaction, an audit log file, and a metrics file
- Keep the main code in ONE file, under 300 lines, with clear comments
- Never hard-code API keys; read them from environment variables

OUTPUT FORMAT
Give me exactly 3 files:
- File 1: the complete runnable Python code
- File 2: a Markdown file with the prompt I used (this prompt)
- File 3: a Markdown file with one Mermaid diagram for each deliverable,
  with a 2-3 line explanation under each diagram

QUALITY RULES
- Test the code logic before giving it to me (use a mock model if no key)
- After the files, explain in simple words how to run it and how to
  present it in 5 minutes
- Point out any weak spots, risks or shortcuts in your own solution
- If something is unclear, make a sensible assumption, state it, and continue
```

---

## Why this prompt works better

| Weak prompt | Better prompt |
|---|---|
| "make a project with agentic AI" | Names the exact project, domain and tasks |
| No audience | Says who will see it and your skill level |
| No limits | Sets language, SDK, file size and required features |
| No format | Asks for exactly 3 files with defined contents |
| No quality bar | Asks Claude to test, explain, and admit weak spots |

## Tips for follow-up prompts

- "Add a third agent that writes a summary email to the customer."
- "Explain the code line by line like I'm new to Python."
- "Convert the architecture diagram into slides for a 5-minute demo."
- "List 10 questions my teacher might ask and good answers to them."
