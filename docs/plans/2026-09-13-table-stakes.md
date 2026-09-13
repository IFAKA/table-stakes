# Table Stakes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an installable offline-first two-player physical-card Hold'em controller.

**Architecture:** A pure deterministic heads-up engine owns all digital poker state and invariants. A client-only tabletop UI renders that state, persists each transition in IndexedDB, and uses the current stable Serwist webpack integration to precache the production app shell.

**Tech Stack:** Next.js 16.3.5 App Router, React 19.3.0, TypeScript 6.0.3, Serwist 9.5.12, Vitest 5, Playwright.

---

Implementation is complete in the repository: engine, randomized invariant tests, local persistence, opposite-facing UI, manifest/icons, service worker integration, production scripts, and README have been added. Final verification remains environment-dependent for a real Android device and requires deployment over HTTPS.
