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

## Architecture
- Student data lives in per-user database tables guarded by owner-only row security; src/lib/db.ts maps AppState to rows and saves diffs, shared by the browser store and the agent — one mapping, one source of truth.
- App pages live under src/routes/_authenticated/; /auth and /reset-password are the only public pages — private data never renders signed-out.
- Scheduling is deterministic in src/lib/planner.ts and shared by UI and agent — the AI decides *what* to do, the planner guarantees realistic distribution.
- The AI agent runs server-side at /api/agent, takes identity only from the verified bearer token, loads/saves that user's data with their own token (RLS applies), and persists every tool call to agent_actions; plan changes moving >2 sessions are returned as a pending proposal for student approval.
