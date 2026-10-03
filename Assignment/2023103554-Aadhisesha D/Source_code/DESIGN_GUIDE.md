# PlacementPilot design direction

## Design read

Reading this as: a quiet, high-end career intelligence workspace: editorial hierarchy, generous spacing, restrained dark surfaces, one mint accent, and motion used only to clarify state.

## Dials

- DESIGN_VARIANCE: 3
- MOTION_INTENSITY: 3
- VISUAL_DENSITY: 3

## Taste Skill application

This project follows the public guidance from Leonxlnx/taste-skill: audit-first redesign, deliberate hierarchy, one locked accent color, no default AI-purple visual language, deliberate hierarchy, calm composition, real loading/error/empty states, tactile interactions, reduced-motion support and motion used only to communicate product state.

The upstream skill also identifies `design-taste-frontend` as the current install name for the core skill and documents the three design dials. The user can install the upstream skill in their local agent environment with:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

The build environment used for this exported project could not complete that network install, so the project's UI was implemented directly from the publicly documented skill guidance.

## Current redesign

The application was redesigned from a sidebar-heavy multi-page dashboard into a single scrollable workspace. The flow is intentionally calm: analyze first, review personal analytics, inspect role requirements and focus areas, then start a role-specific mock test and a conversational mock interview. Continuous decorative motion was removed in favor of short entrance, hover and state transitions.

This follows the Taste Skill dials as user-overridden for this brief: lower variance, lower motion and lower visual density. The upstream repository documents these three dials and recommends the `design-taste-frontend` install name.


## Current direction

The latest UI direction intentionally replaces the earlier dark/neon treatment with a professional light theme. The experience is a guided vertical journey rather than a dashboard: each chapter has a clear number, heading, analysis content, and Continue/Skip controls, while a compact sticky progress indicator makes the sequence obvious. Accent palettes change by chapter but remain restrained and are applied mostly to labels, indicators, and selected states. Animation is limited to section reveals, progress fills, question transitions, and feedback states.
