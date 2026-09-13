# AI Design System UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the Table Stakes setup and play surfaces with the supplied AI Design System while preserving poker behavior, offline persistence, and the single semantic flow across viewport sizes.

**Architecture:** Keep the pure game engine, repository, and route structure unchanged. Refine the existing React composition into labeled semantic regions and use shared CSS tokens for calmer hierarchy, readable rows, native controls, and explicit status/action states. The phone layout remains the one DOM model; the rotated opponent side remains the documented physical-table exception.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Vitest, Playwright.

---

### Task 1: Establish the UI baseline

**Files:**
- Inspect: `components/table.tsx`, `app/globals.css`, `tests/e2e/table.spec.ts`

**Step 1:** Run `npm run typecheck`, `npm run lint`, `npm test`, and the focused Playwright flow when the local server is available.

**Step 2:** Record the current responsive and semantic constraints from the implementation.

### Task 2: Refine semantic composition and interaction labels

**Files:**
- Modify: `components/table.tsx`

**Step 1:** Group setup and active play under labeled main sections with concise supporting status.

**Step 2:** Preserve native buttons, dialog, form labels, status announcements, and the same DOM across viewports while clarifying the primary action and player state copy.

**Step 3:** Keep all domain actions routed through the existing game engine.

### Task 3: Apply the design-system visual system

**Files:**
- Modify: `app/globals.css`

**Step 1:** Consolidate spacing, color, radius, focus, and motion values into semantic tokens.

**Step 2:** Tune the smallest layout first for a 225px watch-like viewport, then add space at phone/desktop widths without introducing a second navigation model.

**Step 3:** Preserve dark mode, forced colors, reduced motion, long-label wrapping, and 44px targets.

### Task 4: Verify the affected state flow

**Files:**
- Inspect: `tests/e2e/table.spec.ts`

**Step 1:** Run focused tests, typecheck, lint, and production build.

**Step 2:** Run the browser flow at a narrow viewport and inspect the rendered setup, active turn, dialog, and rotated side states.

**Step 3:** Review the final diff for unrelated changes and report any checks unavailable in this environment.
