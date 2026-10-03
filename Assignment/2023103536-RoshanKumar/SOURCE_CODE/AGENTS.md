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

## Detour architecture
- Agent logic lives in `src/lib/agent.server.ts` (8 deterministic tools + one orchestrator); `agent.functions.ts` only exposes thin server functions. Why: keeps validation/writes server-side, never in the browser.
- The scenario workspace drives the run one PO per `agentStep` call; run progress is persisted in `agent_runs.processed_pos`. Why: visible streaming without background jobs.
- All tables are public-read; writes happen only through server functions using the admin client. Why: demo app without login.
- Demo state resets via the `reset_demo()` SQL function (dates are stored as day offsets from today). Why: the seeded scenario stays reproducible on any date.
