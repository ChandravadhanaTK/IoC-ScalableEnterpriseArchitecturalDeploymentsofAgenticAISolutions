# BillPilot AI — Project Generation Prompt

- **Student:** 2023103043-Joshika Shree V
- **Live app:** https://cuddly-connect-app.lovable.app
- **Source:** https://github.com/Joshika-Shree/cuddly-connect-app

## Goal
Build a secure responsive app to organize recurring subscriptions and bills, surface upcoming payment obligations, and make AI-assisted document processing reviewable. Users authenticate, manage bills/subscriptions, upload bill material, inspect alerts/anomalies, and see workflow progress.

## Capabilities
1. Public landing page and sign-in/sign-up.
2. Authenticated dashboard with bills, subscriptions, and due-date context.
3. Bill/subscription list and detail views, upload flow, alerts, and anomaly review.
4. Workflow page showing agent runs, step status, and operational counts.
5. AI-assisted extraction/classification and subscription signals, persisted for review.
6. Supabase authentication and user-scoped Postgres access enforced by RLS.
7. Responsive, accessible UI with clear loading, empty, and error states.

## Implemented architecture
The deployed Lovable project uses React 19, TypeScript, TanStack Start/Router, server functions, and Supabase. The initial concept mentioned React plus FastAPI, but the actual submitted implementation does not have a separate FastAPI service. Keep AI and privileged operations server-side and use Lovable AI gateway configuration only from server code.

## Agent roles
Use the six implemented roles: Validation, Extraction, Classification, Subscription Detection, Anomaly Detection, and Reminder & Insights. Persist run/step status, validate structured outputs, surface errors for retry, and require review of consequential or low-confidence results. Subscription analysis belongs to detection agents; summary/report behavior belongs to Reminder & Insights.

## Engineering
Keep secrets out of version control; preserve migrations and RLS; make processing visible; keep failures recoverable; never present AI outputs as verified financial advice or autonomously initiate payments/cancellations.
