<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture decisions
- Agents (orchestrator, Meeting Analysis, Task Management, Reminder) live in `src/lib/agents.functions.ts` as auth-protected server functions running as the user — keeps RLS enforced and the LLM key server-only.
- LLM/prompt-safety/validation helpers live in `src/lib/agents.server.ts` — never import from client code.
- Every agent step writes an `agent_runs` row keyed by `trace_id`; monitoring pages compute metrics only from these rows — no fabricated metrics.
- Page reads use the browser client + react-query under RLS; pages wrap content in `AppShell`, which gates on the session.
- Notifications are de-duplicated via a unique (task_id, kind) constraint with upsert ignoreDuplicates.
