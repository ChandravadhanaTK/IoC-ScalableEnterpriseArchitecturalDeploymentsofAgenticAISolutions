# Detour Command Center

Build a complete, polished, full-stack web application called Detour — an agentic supply-chain disruption response platform for supply-chain planners with a motion-first cinematic logistics command center interface.

Refer to the attached specification document (DETOUR — AGENTIC SUPPLY-CHAIN DISRUPTION (pasted).md) for the complete architecture, data models, 8 backend tools, decision logic, and primary demo scenario (5-day Port Meridian closure affecting 8 purchase orders).

Motion and UI Design Directives:
1. Living Supply-Chain Control System:
- Cinematic logistics command center aesthetic with dark, high-contrast HUD design, subtle ambient moving grid, faint coordinate drift, and layered parallax depth as the user scrolls.
- Continuous flowing shipment particles across supply network routes (tuned to transit mode: rapid pulses for Air, paced flows for Rail, steady currents for Sea).
- Interactive React Flow network graph (Suppliers → Ports → Routes → Factory) with animated status rings, pulsing nodes, and real-time rerouting vector animations.
- Scroll-linked motion: parallax grid coordinates, staggered reveals on tables and timelines, and sticky morphing header telemetry as you scroll.

2. Disruption & Signature Reroute Animations:
- When Port Meridian closes, the node pulses red with an expanding perimeter shockwave, freezing connected particles.
- Detour calculates alternatives and visually traces the new vector to alternate ports (e.g., Port Atlas), drawing the reroute into existence and releasing shipment particles along the viable path.

3. Live Agent Activity & Telemetry:
- Real-time agent activity stream with animated event entries, active-operation pulsing indicators, and smooth rolling numeric counters (interpolating values rather than abrupt jumps).
- Human-in-the-Loop Spotlight: When an expedite exceeds ₹5,000 additional cost (such as PO-106 at +₹6,800), dim the workspace and highlight the approval card with glowing micro-borders. Support Approve (executes reroute) and Reject (triggers agent fallback search for next viable alternative).

4. Core Architecture:
- Complete relational tables (suppliers, ports, products, purchase orders, inventory, routes, disruptions, agent runs, agent actions, audit logs) with realistic seeded mock data.
- 8 deterministic backend tools: exposed_orders, stock_cover, alt_suppliers, route_options, reroute_po, substitute_supplier, expedite_po, and verify_service_impact.
- Single orchestrator agent loop with backend validation guardrails and immutable audit logging.
- Pages: Overview Dashboard with visual network hero, Network Canvas (/network), Purchase Orders (/orders), Disruptions (/disruptions), Scenario Workspace (/disruptions/:id), Scenario Comparison, Action Log timeline (/actions), and Agent Runs (/agent-runs).
- Prominent one-click "Simulate Port Closure" demo button delivering the exact 8-PO workflow to completion.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://motion-flow-control.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/972264e4-0b12-47ac-b66e-a74ac82a42c9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
