# Lean UI/UX Playbook

This project-agnostic guide defines a reusable interaction shape for focused mobile web tools: make the primary job immediate, keep navigation shallow, and move optional configuration out of the first-run path.

## Core model

```text
/              → primary Today/Home view
/settings/     → optional configuration
/history/      → secondary records, only when needed
/[task]/       → focused active task flow
```

Use real URL routes for meaningful destinations. Use in-place state for fast repeated actions inside the primary task. Query parameters are appropriate for small subviews when they preserve a clear parent route.

## Screen contract

Every primary screen should have one clear title, one dominant next action, short labeled rows, native links for navigation, native buttons for actions, useful loading/empty/error states, and a compact path back to its parent.

## First-run rule

Do not block the first useful action with setup unless configuration is required for correctness. Start with safe defaults, persist them, and expose changes through Settings. If saving settings replaces active work, explain that beside the destructive action and make replacement explicit.

## Leanness checklist

- Keep one primary route for the product's main job.
- Remove duplicate landing, onboarding, and confirmation screens.
- Put secondary destinations behind one labeled Settings, History, or More route.
- Prefer progressive disclosure (`details`, dialogs, subviews) over showing every option at once.
- Keep each screen's action vocabulary small.
- Preserve the same semantic DOM across mobile and desktop; use CSS for spatial adaptation.
- Make controls at least 44px tall and inputs at least 16px on mobile.
- Support visible focus, keyboard operation, dark mode, forced colors, and reduced motion.
- Announce loading, saved, completion, and error states with status text.

## Layout pattern

```text
┌────────────────────────────┐
│ Parent / Settings     Undo │
│ Screen title               │
│ Context or short summary   │
├────────────────────────────┤
│ Primary content            │
│                            │
│ [Primary action]           │
│ Secondary rows             │
└────────────────────────────┘
```

Use generous title spacing, thin row dividers, strong typography for the one important value, and color for state rather than decoration. Dense task tools may use a two-sided composition when physical context demands it, but the interaction contract must remain obvious.

## Navigation test

Can a returning user reach the main job from `/` with one action? If not, remove or defer whatever is in the way. Can a user find optional configuration without seeing it every time? If not, move it to Settings.
