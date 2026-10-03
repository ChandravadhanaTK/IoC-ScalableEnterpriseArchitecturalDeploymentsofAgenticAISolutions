# Security Model

## Identity and access
Supabase Auth provides signed-in sessions. Auth middleware protects authenticated routes. Row Level Security policies in database migrations are the principal boundary for user-owned records; server functions and queries must remain scoped to the current user.

## Secrets
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are browser configuration values; RLS must still enforce access.
- `LOVABLE_API_KEY` and privileged credentials belong only in server/deployment configuration.
- Never commit `.env`, service-role keys, provider keys, or user records.
- This public submission excludes the private source `.env` and provides blank `.env.example` values.

## Sensitive data
Bills and extracted financial fields are sensitive. Restrict storage and reads to the owner, validate uploads, avoid logging document content or credentials, and apply appropriate retention/deletion. Present AI output for user review; do not initiate payments or cancellations.

## Release checks
Verify migration RLS coverage, auth behavior, upload validation, server-function authorization, and absence of privileged keys from client bundles. Rotate a credential if it was previously committed.
