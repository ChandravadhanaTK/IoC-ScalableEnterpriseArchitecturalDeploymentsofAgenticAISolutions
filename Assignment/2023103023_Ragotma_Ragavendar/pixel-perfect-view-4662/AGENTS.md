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

# Project architecture

- Keep crisis analysis and communication drafting as deterministic, client-side helpers until a real AI service is explicitly requested, so the core workflow works without credentials or external services.
- Store optional crisis history in browser local storage only, avoiding account setup and external integrations for this focused student tool.