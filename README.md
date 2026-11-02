# Table Stakes

An offline-first heads-up Texas Hold’em table for two people, one physical deck, and one phone.

Table Stakes keeps the game tactile: deal and inspect cards in the real world while the phone handles stacks, blinds, legal betting actions, pot accounting, showdown settlement, and undo. The screen is designed to lie flat between two players, with Player 2’s side rotated 180° for easy reading from the opposite seat.

## Why Table Stakes?

- **Heads-up No-Limit Hold’em** — correct blinds, calls, raises, all-ins, uncalled excess, split pots, and odd-chip handling.
- **Offline-first PWA** — install it on Android and keep playing without a network after the first production visit.
- **Physical-deck workflow** — no card generation, scanning, display, or hand evaluation; the app stays focused on table state.
- **Local-first persistence** — the current match is saved in IndexedDB after every action.
- **Two-sided interface** — both players see the shared pot and street state from their physical seat.
- **Accessible controls** — keyboard-friendly native buttons, visible focus, reduced-motion support, and large touch targets.

## Quick start

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default table starts immediately with two 1,000-chip stacks and 10/20 blinds. Optional configuration lives at `/settings/`.

## Production

```bash
npm run build
npm start
```

Deploy the production build over HTTPS to enable service-worker installation. Vercel works without additional backend services or environment variables.

## Quality checks

```bash
npm run typecheck
npm test
npm run lint
npm run test:e2e
```

## Architecture

- `src/game/` is a pure deterministic TypeScript poker engine. React and browser APIs do not define game rules.
- `components/table.tsx` renders the interactive two-sided table and keeps the physical-deck boundary explicit.
- `src/storage/repository.ts` persists the authoritative `MatchState` in IndexedDB and migrates schema versions explicitly.
- `app/sw.ts` and `components/` provide the installable offline PWA experience through Serwist and Next.js.

The accounting invariant is:

```text
stack[0] + stack[1] + pot === starting stack total
```

## Scope

Table Stakes intentionally supports exactly two players, one physical deck, integer chip units, and one device. It does not connect to a backend, generate or evaluate cards, provide multiplayer networking, or replace a physical deck.

## License

No license has been selected yet.

---

## Support

If this project is useful to you, you can support my work:

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/zfaka)
