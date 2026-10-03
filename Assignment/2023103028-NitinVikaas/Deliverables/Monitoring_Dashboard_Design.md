# 5. Monitoring Dashboard Design

## 5.1 Dashboard Goals

The monitoring layer should measure five dimensions:

1. **Health**
2. **Trace / performance**
3. **Quality**
4. **Safety**
5. **Cost / business outcomes**

## 5.2 Dashboard Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ ARMOR FORGE OPERATIONS                                      │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│ API HEALTH  │ AGENT HEALTH│ ERROR RATE  │ ACTIVE USERS      │
├─────────────┴─────────────┴─────────────┴───────────────────┤
│                                                             │
│ Request / Agent Latency Timeline                             │
│                                                             │
├─────────────────────────────┬───────────────────────────────┤
│ Agent Success / Failure     │ Tool / Model Usage            │
│                             │                               │
├─────────────────────────────┼───────────────────────────────┤
│ Guardrail Events            │ Cost / Token Consumption      │
│                             │                               │
├─────────────────────────────┴───────────────────────────────┤
│ Business Outcomes / Learning Progress                        │
└─────────────────────────────────────────────────────────────┘
```

## 5.3 Health Metrics

Track:

- API availability
- frontend errors
- backend errors
- dependency health
- Python execution failures
- agent execution availability

## 5.4 Trace Metrics

Track:

- request latency
- agent run duration
- tool latency
- LLM latency
- queue time
- timeout count
- trace IDs

The API contract includes an agent-run/event model suitable for streaming or polling traces.

## 5.5 Quality Metrics

Track:

- challenge completion rate
- test pass rate
- retry rate
- agent task success rate
- validation failure rate
- retrieval success rate
- user progression through the 12 missions

Do not present fabricated learner-performance scores as real measurements.

## 5.6 Safety Metrics

Track:

- guardrail blocks
- unauthorized requests
- approval requests
- rejected approvals
- tool-policy violations
- suspicious execution attempts
- audit-log failures

## 5.7 Cost Metrics

Track:

- LLM requests
- token usage
- model cost
- code-execution resource usage
- backend compute
- storage

## 5.8 Business / Learning Outcomes

Potential KPIs:

- learners entering the Forge
- missions started
- missions completed
- average time per mission
- coding challenge completion
- progression from fundamentals to agentic AI
- glossary usage
- learner retention

These should be sourced from real telemetry in production rather than hard-coded demo values.

---
