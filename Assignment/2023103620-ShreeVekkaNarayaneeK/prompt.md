# AgentOps Console — Lovable Generation Prompt

**Author:** Shree Vekka Narayanee K  
**Roll No:** 2023103620  
**Deployed App:** https://picture-perfect-render-61.lovable.app

---

## Prompt Used to Generate the Application

```
Build a web application called "AgentOps Console" — an enterprise 
monitoring and orchestration dashboard for deployed AI agents.

## Pages & Navigation
Sidebar with these routes:
- Overview (default landing)
- Agents
- Workflows
- Security
- Deployments
- Logs & Traces

## Page Specs

### Overview
- 4 KPI cards: Total Agents, Active Workflows, Security Alerts, Avg Response Time
- A line chart showing agent activity over the last 7 days
- A recent events feed on the right (timestamped list)

### Agents
- Table: Agent Name | Type | Status (badge: Running/Idle/Failed) | 
  Uptime | Last Ping | Actions
- Clicking a row opens a side drawer with agent details

### Workflows
- Kanban-style board with columns: Queued → Running → Review → Done
- Each card shows: workflow name, assigned agent, priority badge

### Security
- 3 summary cards: Active Sessions, Failed Auths, Open Alerts
- A table of recent security events with severity badges 
  (Critical/High/Medium/Low)

### Deployments
- Timeline/step view showing: Dev → Staging → Canary → Production
- Each environment shows health status with a colored dot

### Logs & Traces
- Scrollable log viewer with color-coded log levels 
  (INFO, WARN, ERROR, DEBUG)
- Search bar and level filter dropdown at the top

## Design Requirements
- Dark theme: background #0D1117, cards #161B22, 
  accent color #58A6FF (blue) and #3FB950 (green)
- Clean sans-serif font (Inter or similar)
- Subtle card borders, smooth hover states
- Fully responsive layout
- Use Recharts or similar for all charts
- Use Tailwind CSS throughout

## Tech Stack
- React + TypeScript
- Tailwind CSS
- React Router for navigation
- Recharts for data viz
- All data should be realistic mock/static data
```

---

## Follow-up Redesign Prompt (Space / Mission Control Theme)

```
Redesign the entire AgentOps Console with a Space / Mission Control 
theme. Keep all the same pages and data, but change the visual design 
completely:

- Background: deep space black (#04060F) with a subtle star field 
  effect (small white dots scattered across the bg)
- Each agent is represented as a "satellite" with a glowing orbit ring 
  around its status indicator
- KPI cards look like cockpit instrument panels — rounded rectangles 
  with a soft neon glow border (blue/teal)
- The sidebar should feel like a spacecraft nav panel with glowing 
  icon indicators and label "MISSION CONSOLE" under the logo
- Add a large animated gradient orb/planet in the Overview background 
  (behind the cards, decorative)
- Charts use a deep blue → cyan → green color gradient
- All status badges: Running = pulsing green glow, 
  Failed = red alert flash, Idle = dim grey
- Typography: use a monospace or space-age font for headings 
  (like Space Mono or Orbitron from Google Fonts)
- Add subtle floating particle animations in the background
- The Deployments pipeline should look like a rocket launch sequence: 
  Dev → Staging → Canary → Production with a rocket icon progressing 
  along the stages
- Rename the events feed to "Orbital Events"
- Add a "Signal Strength" indicator at the bottom of the sidebar
- Overall feel: NASA mission control meets sci-fi dashboard
```
