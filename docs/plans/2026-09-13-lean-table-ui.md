# Lean Table UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/` the immediate default poker table, move optional configuration to `/settings/`, and document a reusable lean UI/UX pattern.

**Architecture:** Keep the existing deterministic game engine and IndexedDB match record. Replace the blocking setup screen with default match creation, add a client settings route that explicitly starts a new configured match, and preserve the two-sided table composition.

**Tech Stack:** Next.js App Router, React, TypeScript, native forms/links/dialog, CSS, Playwright.

---

### Task 1: Make the primary route immediate

Modify the home page and table component so `/` renders the table and missing or legacy setup state starts with defaults.

### Task 2: Add optional settings

Add `/settings/` with a compact native form for player names, starting stack, and blinds. Saving explicitly replaces the current match with a new hand and returns to `/`.

### Task 3: Align browser coverage and documentation

Update the e2e flow for immediate defaults and settings, then add the project-agnostic lean UI/UX playbook.

### Task 4: Verify

Run focused e2e coverage, typecheck, lint, unit tests, and production build. Inspect the final diff and confirm `/play` no longer exists.
