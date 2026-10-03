# Prompt Used to Generate the Application

## Application: OfficeAssist — AI Workplace Assistant (Single-Agent Tool Use Demo)

### The Prompt

> Build an AI workplace assistant web application called **OfficeAssist** that demonstrates
> how a single AI agent uses a tool to answer questions.
>
> **Requirements:**
>
> 1. **One agent, one tool, one knowledge base.**
>    - There is exactly one AI agent (the OfficeAssist Agent).
>    - The agent has exactly one tool: a **Workplace Knowledge Tool** that searches a
>      built-in workplace knowledge base (HR policies, IT help, office information,
>      leave policy, benefits, working hours, etc.).
>    - The agent must call the tool **only when a question needs company information**.
>      General questions (e.g. "What is an AI agent?") must be answered directly,
>      without using the tool.
>
> 2. **Three pages:**
>    - **Assistant (home):** a chat interface where users ask questions. Show suggested
>      questions as clickable buttons. For each answer, indicate whether the Workplace
>      Knowledge Tool was used.
>    - **Agent Monitoring:** a dashboard showing live telemetry — total requests, tool
>      usage count, direct answers, average response time, and a log of recent
>      interactions (question, whether the tool was used, response time).
>    - **Settings:** configuration page for the agent (model, temperature, tool
>      on/off, knowledge base info).
>
> 3. **Architecture rules:**
>    - The agent must run **server-side** so the AI API key and system prompt never
>      reach the browser.
>    - Monitoring metrics are browser-local demo telemetry (no database by design).
>    - Answers must be plain, well-formatted text (no stray markdown symbols like `**`).
>
> 4. **Tech stack:** React + TanStack Start, Tailwind CSS, shadcn/ui components,
>    AI via an AI gateway (server function), TypeScript throughout.
>
> 5. **Test scenarios the app must handle correctly:**
>    - "What is the work-from-home policy?" → uses the tool → "up to 2 days per week
>      with manager approval".
>    - "What is an AI agent?" → answered directly, no tool call.
>    - "What is the leave policy?" → uses the tool → plan leave at least 2 working
>      days ahead, with manager approval.
>    - "What are the office working hours?" → uses the tool → 9:00 AM to 6:00 PM,
>      Monday to Friday.
>    - "What benefits does the company offer?" → uses the tool.
>    - Formatting check: answers contain no leftover `**` bold markers.

### Notes

- The prompt was refined over several iterations: fixing a blank-screen crash caused
  by a scroll effect, ensuring suggestion buttons work reliably, and cleaning up
  answer formatting.
- The full source code generated from this prompt is included in this submission.
