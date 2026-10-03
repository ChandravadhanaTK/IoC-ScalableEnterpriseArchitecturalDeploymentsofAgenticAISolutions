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

## Architecture rules
- Layers: routes/components (presentation) → src/agent (AI logic, UI-free) → src/services (data access API) → src/data (mock seed). Why: swap mock for real backend without touching UI.
- UI reads data only through hooks in src/hooks that call src/services. Why: single integration point for a real API.
- RBAC lives in src/lib/auth.tsx; gate pages with RequirePermission and actions with can(). Why: one authorization source.
- Secrets never in frontend; AI calls must move server-side when wired to a real model. Why: security.
