# Monitoring Dashboard Design — CampusAssist AI

## 1. Purpose

Monitoring should provide visibility into application health, agent execution, AI quality and operational usage.

## 2. Application Health

Recommended metrics:

- Application availability
- Request success rate
- Request latency
- Error count

## 3. Agent Health

Track:

- Total agent runs
- Successful runs
- Failed runs
- Retry count
- Average processing time

For the current two-agent workflow:

```text
Triage Agent
Action Agent
```

## 4. AI Quality

Track:

- Average confidence
- Low-confidence results
- Retry rate
- User corrections where available
- Escalation recommendations

## 5. Workflow Monitoring

A monitoring view can show:

```text
Student Issue
     ↓
Triage Agent
     ↓
Action Agent
     ↓
AI Recommendation
```

Each step should expose its status:

- Pending
- Processing
- Completed
- Failed

## 6. Business/Usage Metrics

Recommended metrics:

- Number of analyses
- Issues by category
- Issues by priority
- Escalation rate
- Most common campus issue types

## 7. Cost and Resource Metrics

For a production implementation:

- AI request count
- Token/usage consumption
- Estimated AI cost
- Storage usage

## 8. Alerts

Potential alerts:

- High agent failure rate
- Increased response latency
- Repeated AI processing failures
- Unusually high request volume

## 9. Current Implementation Note

The current CampusAssist AI is intentionally lightweight. These monitoring metrics describe the observability model for the application and can be expanded into a full enterprise monitoring dashboard in a future version.
