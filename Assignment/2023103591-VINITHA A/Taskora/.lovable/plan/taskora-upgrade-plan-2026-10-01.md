# Taskora upgrade plan

## What will be built
- Recreate the current Taskora information architecture and dashboard style, refined into a responsive student workspace.
- Add email/password and Google sign-in, signup, password recovery, logout, and protected student pages.
- Store full student profiles plus tasks, notes, study sessions, focus sessions, and preferences in Lovable Cloud.
- Enforce per-student ownership for every record so accounts cannot access each other’s data.
- Build functional dashboard, tasks, planner, focus timer, notes, analytics, and profile pages with useful empty, loading, error, and confirmation states.
- Add architecture, workflow, deployment, security, monitoring, and trace views clearly labeled as documentation, demo data, or live application data.
- Verify navigation, responsive layouts, authentication, persistence, and ownership rules; report any unverified items honestly.

## Technical details
- Keep TanStack Start routing and use the generated Lovable Cloud client and protected-route layout.
- Use a normalized relational schema with row-level access policies and ownership indexes.
- Use shared workspace shell, navigation, dialogs, and typed data access helpers.
- Use semantic design tokens in Tailwind CSS with Inter typography, off-white surfaces, slate text, restrained indigo, and compact Linear/Notion-inspired density.
- Keep AI in explicitly labeled Demo Mode unless a real provider workflow is configured later.
