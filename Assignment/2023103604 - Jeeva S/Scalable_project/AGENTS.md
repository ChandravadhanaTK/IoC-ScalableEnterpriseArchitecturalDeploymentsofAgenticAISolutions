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

- ProcureAI pipeline runs in `src/lib/procure/pipeline.server.ts`, streamed as NDJSON from `/api/analyze`; approval thresholds live frozen in `data.ts` so neither user input nor LLM output can alter routing.
- Approval/PO role checks live in `actions.functions.ts` server functions; client state (requests, audit) persists in localStorage via `store.tsx`.
