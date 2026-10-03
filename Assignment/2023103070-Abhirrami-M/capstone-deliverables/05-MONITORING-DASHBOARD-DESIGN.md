## ResearchMate Monitoring Dashboard Design

> This is a design specification. A dedicated monitoring system is **not** implemented; today only platform logs and the browser console are available.

| Category | Metric | Source / how to measure | Alert idea |
|---|---|---|---|
| Health | OpenAlex availability | % of search calls returning 2xx | < 95% over 15 min |
| Health | Request latency | p50/p95 of search and AI calls | p95 > 10 s |
| Health | Error rate | failed workflows / total | > 5% |
| Agent | Agent execution time | duration per agent step | Search > 15 s |
| Agent | Workflow completion rate | sessions reaching Synthesis done | < 90% |
| Agent | Failed agent steps | count by agent name | spike vs baseline |
| AI quality | Result relevance | average relevance score of top 3 | trend down |
| AI quality | Summary generation success | AI ok / AI attempts (fallback rate) | fallback > 20% |
| AI quality | No-result rate | searches with 0 papers | > 15% |
| Safety | Invalid input count | rejected queries (too short/long) | — |
| Safety | Prompt injection events | not implemented (future) | — |
| Cost | API usage | OpenAlex calls per day | — |
| Cost | AI request count | gateway calls per day (Lovable AI request logs) | budget threshold |
| Business | Research requests | Start Research clicks | — |
| Business | Papers retrieved | sum of papers per session | — |
| Business | Successful sessions | sessions with a final report | — |

### Proposed layout
```text
+-------------------+-------------------+-------------------+
| API availability  | p95 latency       | Error rate        |
+-------------------+-------------------+-------------------+
| Agent step timings (stacked bar per agent)                |
+-------------------+-------------------+-------------------+
| AI fallback rate  | No-result rate    | AI requests/day   |
+-------------------+-------------------+-------------------+
| Research requests & successful sessions (line chart)      |
+-----------------------------------------------------------+
```

### Trace design
One trace per research session with spans: planner → search → validation → ranking → analysis → synthesis, each tagged with counts (papers found/retained) and status.
