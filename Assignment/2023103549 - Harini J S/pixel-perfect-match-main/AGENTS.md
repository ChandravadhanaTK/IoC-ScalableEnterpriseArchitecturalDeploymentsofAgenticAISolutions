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

- AI calls go through `AIProvider` in src/services/ai; RAG steps live in src/services/rag. Why: swap mock for live AI without touching UI.
- Seed knowledge lives in src/data/seed.ts and is the single source until a database is added. Why: one deterministic corpus for demo.
- App pages live under src/routes/_authenticated/ (client-only gate redirecting to /auth). Why: sessions live in browser storage.
- Built-in seed documents stay in code; user-owned data (collections, conversations) lives in the database with per-user RLS. Why: demo corpus is shared and read-only.
- Demo accounts are provisioned on demand by src/lib/demo.functions.ts, limited to two fixed emails. Why: auth users can't be seeded via migrations.
