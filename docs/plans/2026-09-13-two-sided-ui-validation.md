# Two-Sided UI Validation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the existing tabletop controller usable on one phone lying flat between two opposite players across setup, betting, modal, street, settlement, and rematch states.

**Architecture:** Preserve the existing game engine and semantic DOM. Correct the physical orientation at the player-region boundary, keep shared state neutral, and add focused browser assertions for ordering, rotation, hit targets, and overflow at representative portrait phone widths.

**Tech Stack:** Next.js, React, TypeScript, CSS, Vitest, Playwright.

---

### Task 1: Establish current rendered behavior

**Files:**
- Inspect `components/table.tsx`, `app/globals.css`, `tests/e2e/table.spec.ts`
- Add temporary browser evidence under `/tmp` only

**Step 1:** Run the app and inspect setup, active turn, raise dialog, street transition, showdown, settlement, and next-hand states at 390x844 and 430x932.

**Step 2:** Record concrete orientation, reachability, readability, and overflow failures from rendered evidence.

### Task 2: Fix only confirmed two-sided interaction failures

**Files:**
- Modify `components/table.tsx`
- Modify `app/globals.css`

**Step 1:** Keep semantic ownership and game actions unchanged.

**Step 2:** Implement the smallest orientation/layout correction that keeps Player 2 content readable from the opposite end, preserves modal interaction coordinates, and leaves shared state neutral.

**Step 3:** Preserve minimum touch targets and add explicit visual ownership cues where the current state is ambiguous.

### Task 3: Add targeted browser coverage

**Files:**
- Modify `tests/e2e/table.spec.ts`

**Step 1:** Add portrait phone projects or per-test viewport coverage for 390x844 and 430x932.

**Step 2:** Assert Player 2 rotation, player-side ordering, no horizontal overflow, usable action target sizes, and dialog behavior for both active players.

**Step 3:** Exercise representative state transitions through awaiting street, showdown, settlement, and next hand.

### Task 4: Verify the final result

**Step 1:** Run focused browser tests.

**Step 2:** Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.

**Step 3:** Inspect the final diff and report verified behavior versus what still requires two-human physical testing.
