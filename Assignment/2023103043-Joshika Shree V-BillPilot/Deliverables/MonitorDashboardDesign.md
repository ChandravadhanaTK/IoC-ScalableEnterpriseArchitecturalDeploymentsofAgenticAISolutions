# Monitoring Dashboard Design

## Existing view
The authenticated Workflow page (`SourceCode/src/routes/_authenticated/workflow.tsx`) displays agent run/step activity and aggregate processing counts.

## Signals
Track workflow runs by status/agent, step failures and duration, upload acceptance/retries, results awaiting review, anomaly/reminder activity, Supabase/server-function errors, and AI provider failures.

## UX and privacy
Show time range, last run, step state, concise error, and retry action. Do not expose bill contents, tokens, or sensitive prompts in logs. Keep user-facing workflow visibility separate from operator-only infrastructure logs and retain telemetry according to deployment privacy policy.

Alert on repeated workflow failures, sustained AI outages, database/RLS errors, and overdue jobs. Tune thresholds to traffic; this repository does not claim a separate monitoring vendor or SLO.
