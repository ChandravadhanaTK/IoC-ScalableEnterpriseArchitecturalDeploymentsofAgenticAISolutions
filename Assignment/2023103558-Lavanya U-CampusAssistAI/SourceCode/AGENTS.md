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
- AI analysis runs server-side via createServerFn in src/lib/analyze.functions.ts calling src/lib/ai/analyze.server.ts (Lovable AI Gateway, Responses API, openai/gpt-6-astra, structured Output schema). Client never sees the API key.
- Recent analyses persist in localStorage (key campusassist-recent); no database by design.
