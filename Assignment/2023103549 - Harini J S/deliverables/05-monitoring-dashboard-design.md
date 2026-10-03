# Monitoring Dashboard Design

## Audiences and Goals

| Audience | Goal |
|---|---|
| End user | See personal document/upload state and recent activity; today this is distributed across the app, not a monitoring dashboard. |
| Admin/developer | Detect service failures, ingestion bottlenecks, answer degradation, safety events, and cost; operational aggregation is not implemented. |

## As Built: Metric Availability
The database includes `user_documents.status`, `activity`, and `conversations.messages` JSONB. Answer traces, citations, `grounded`, and retrieval scores are saved inside conversation messages when the save succeeds. These are product records, not a centralized telemetry pipeline. No LLM/token/cost events or separate event table exists.

| Metric | Definition / formula | Source | Refresh | Threshold | Availability |
|---|---|---|---|---|---|
| Document processing success | `ready / (ready + failed)` for completed uploads | `user_documents.status` | On query or scheduled aggregate | < 95% over 15m | Available today, status only; no cohort/event id |
| Processing duration | Time from queued to ready/failed | No status transition timestamps | N/A | p95 > 60s proposed | Needs instrumentation |
| Search latency | Duration of `retrieve()` | Not persisted by search route | N/A | p95 > 1s proposed | Needs instrumentation |
| Answer/retrieval latency | `TraceStep.ms` summed by answer; per-stage timing | `conversations.messages[].answer.trace` | On persisted conversation | p95 > 3s proposed | Available today per saved answer, not aggregated reliably |
| Error rate | Failed server/API requests divided by requests | Console/hosting logs only | Hosting-dependent | > 2% over 5m | Needs structured instrumentation |
| Citations per answer | Citation count per assistant response | `conversations.messages[].answer.citations` | On conversation save | < 1 on grounded answers | Available today per saved answer |
| Grounded answer rate | `grounded=true / all assistant answers` | `conversations.messages[].answer.grounded` | On conversation save | < 90% proposed; interpret with refusals | Available today per saved answer |
| Not-found rate | `grounded=false / all assistant answers` | Same answer field | On conversation save | > 30% proposed | Available today per saved answer |
| Feedback ratio | Positive / negative feedback | No feedback records/control | N/A | N/A | Needs instrumentation |
| Guardrail triggers | Empty/low-score refusals by reason | Trace details in saved messages, not normalized | On conversation save | > 30% proposed | Available today as limited trace detail |
| Requests and tokens | Request count, input/output tokens | No model/event records | N/A | N/A | Needs instrumentation; tokens do not exist for mock AI |
| Estimated AI cost | Provider-reported token usage × rate | No provider call or cost source | N/A | Budget-specific | Needs instrumentation; current AI inference cost is zero |
| Documents added | Upload activity count / new document rows | `activity.kind='upload'`, `user_documents` | Near real time | Sudden drop/spike | Available today; activity is best-effort |
| Questions asked | `activity.kind='ask'` or user messages | `activity`, conversations JSONB | Near real time | Usage-specific | Available today; `ask` logs only when new conversation is created |
| Study sessions | Study session count | No table/route | N/A | N/A | Needs instrumentation; feature not implemented |
| Active days | Distinct `date(created_at)` per user in `activity` | `activity` | Daily | Product-specific | Available today, only tracked action types |

Thresholds above are suggested starting values, not configured alerts or service-level objectives.

## Recommended Dashboard Layout

### Tab: Health & Cost

```text
+---------------------------------------------------------------+
| HEALTH & COST    range [1h v]  environment [prod v]           |
+----------------------+----------------------+-----------------+
| Processing success   | p95 answer latency   | error rate      |
| ready / completed    | retrieval + compose  | server + client |
+----------------------+----------------------+-----------------+
| Requests and spend trend (no cost series until model enabled) |
+---------------------------------------------------------------+
| Upload queue/status | Supabase errors | provider availability |
+---------------------------------------------------------------+
```

### Tab: Answer Quality & Safety

```text
+---------------------------------------------------------------+
| ANSWER QUALITY & SAFETY                                        |
+----------------------+----------------------+-----------------+
| citations / answer  | grounded rate        | not-found rate  |
+----------------------+----------------------+-----------------+
| Retrieval score distribution | Scope and refusal reasons     |
+---------------------------------------------------------------+
| Feedback ratio | safety events | sampled answer trace (redacted) |
+---------------------------------------------------------------+
```

### Tab: Agent Traces

```text
+---------------------------------------------------------------+
| AGENT TRACES    trace id [________] user/doc [________]        |
+---------------------------------------------------------------+
| upload: queued -> processing -> ready/failed                   |
| question -> scope -> retrieve -> grounding -> compose -> save  |
+---------------------------------------------------------------+
| stage duration | result counts | sanitized failure | retry     |
+---------------------------------------------------------------+
```

These are design sketches, not current UI. Admin views must use an authorized server-side role check and avoid exposing one user's prompts to another.

## Recommended Instrumentation Plan

| Event | Dimensions (minimize sensitive data) | Emit location |
|---|---|---|
| `document.upload.started` | user pseudonymous id, file size, extension, source=paste/file | `src/routes/_authenticated/app.upload.tsx` `process` before DB insert |
| `document.ingest.stage` | doc id, stage, duration, outcome/reason code, chunk count | Same `process`; instrument around read, `ingestText`, and persistence |
| `document.ingest.completed` | doc id, status, bytes, sections/chunks, total ms | Same `process` after final update |
| `search.completed` | scope kind, query length, mode, result count, duration, score bands | `src/routes/_authenticated/app.search.tsx` around `retrieve` |
| `answer.completed` | trace id, scope kind, latency, retrieved count, grounded, citation count, refusal reason | `src/services/rag/pipeline.ts` and assistant `send` |
| `comparison.completed` | document count, rows, cited cells, duration | `src/services/rag/compare.ts` |
| `conversation.persist.failed` | trace id, error code, operation | `src/routes/_authenticated/app.assistant.tsx` `persist` |
| `auth.result` | provider, success/failure class, environment | `src/routes/auth.tsx`; never log credentials or tokens |
| `model.usage` | provider/model, token counts, cost, latency, status | Not implemented — recommended: server-side provider adapter only |
| `answer.feedback` | answer id, feedback enum | Not implemented — recommended: feedback UI and table/event |

Use a structured sink with retention, access controls, sampling, redaction, and correlation ids. Do not emit raw prompts, document content, access tokens, or service secrets by default.

## Alerts and Runbooks

| Alert rule | Initial threshold |
|---|---|
| Processing failures | > 5% failed over 15 minutes, minimum 20 jobs |
| Answer latency | p95 > 3 seconds for 10 minutes |
| API/server errors | > 2% over 5 minutes, minimum 50 requests |
| Model spend | > 80% of daily budget or any unexpected provider usage while disabled |
| Grounding anomaly | Not-found rate > 30% or grounded answer citation count = 0 |

1. **Upload failures spike:** Check Supabase availability and recent migration state; compare failure reason codes and extensions; verify row status updates; do not ask users to re-upload until retry/idempotency is safe.
2. **Answer latency rises:** Break down retrieval versus provider stages. Today retrieval is browser-local, so check corpus/chunk growth and client performance. If a model is enabled, inspect provider latency, quota, and timeout rate.
3. **Grounding quality drops:** Inspect redacted scope, score bands, and citation mapping; confirm only `ready` scoped chunks are retrieved; disable any new generator path until citation checks pass.
4. **Unexpected spend or model calls:** Disable provider credentials/route, inspect model usage by environment and release, preserve redacted request ids, and verify the mock-only default has not been bypassed.

## Optional SQL Sketches
The following queries target existing tables and assume PostgreSQL. They are starting points for an authorized analytics service; do not expose cross-user aggregates through an ordinary browser client.

```sql
-- Current document status counts and completion success rate
select
  count(*) filter (where status = 'ready') as ready,
  count(*) filter (where status = 'failed') as failed,
  count(*) filter (where status in ('queued', 'processing')) as in_progress,
  count(*) filter (where status in ('ready', 'failed')) as completed,
  count(*) filter (where status = 'ready')::numeric
    / nullif(count(*) filter (where status in ('ready', 'failed')), 0) as success_rate
from public.user_documents;
```

```sql
-- Active user-days from recorded product activity
select date_trunc('day', created_at)::date as day,
       count(distinct user_id) as active_users,
       count(*) as activity_events
from public.activity
group by 1
order by 1;
```

Latency, feedback, tokens, and estimated cost need normalized event/model usage records before reliable SQL aggregation. `conversations.messages` can be queried as JSONB, but its nested shape is app-defined and has no reporting index.

## Recommended Improvements
- **Not implemented — recommended:** Add server-side structured telemetry and normalized ingestion/answer/provider events with correlation ids.
- **Not implemented — recommended:** Add feedback and study-session instrumentation only when those workflows exist.
- **Not implemented — recommended:** Create separate, access-controlled operational dashboards; do not treat the user `activity` feed as an audit trail.
