# Heads-Up Table Audit and Correction Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate and correct the smallest set of defects that prevent a two-player physical-deck heads-up match from completing correctly on one flat phone.

**Architecture:** Preserve the pure deterministic engine and local-first React table. Extend legal action modeling for short all-in calls and visible non-reopening all-ins, close automatically when both starting stacks are already committed, and render shared center state in two opposite-facing seat regions.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Playwright.

---

### Task 1: Establish engine regression cases

**Files:** `src/game/engine.test.ts`

**Step 1:** Add tests for short all-in call, non-reopening all-in visibility, and both players all-in from blinds.

**Step 2:** Run `npm test` and confirm the new cases fail against the current implementation.

### Task 2: Correct engine transitions

**Files:** `src/game/legal-actions.ts`, `src/game/state.ts`, `src/game/actions.ts`

**Step 1:** Make the smallest legal-action changes for partial all-in calls and legal all-in raises.

**Step 2:** Ensure a hand with both players all-in at blind posting enters showdown rather than betting with no actor action.

**Step 3:** Run focused and full Vitest checks.

### Task 3: Correct two-sided shared state presentation

**Files:** `components/table.tsx`, `app/globals.css`, `tests/e2e/table.spec.ts`

**Step 1:** Render the shared center state in seat-local top and bottom regions, with the top representation rotated and each region operable from its nearest player.

**Step 2:** Update behavioral selectors to validate both representations and preserve the 390px/430px overflow contract.

**Step 3:** Run static/type checks and the browser suite if the environment supports Chromium; otherwise report visual execution as unproven.

### Task 4: Final verification and audit report

**Step 1:** Run engine tests, typecheck, lint, build, and available browser checks after the final edit.

**Step 2:** Inspect the diff for unrelated changes.

**Step 3:** Report proven execution, static conclusions, unproven items, every requested scenario, and the final table-test answer.
