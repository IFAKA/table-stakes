# Table Stakes

Table Stakes is a local-first tabletop controller for two people playing heads-up No-Limit Texas Hold'em with one physical deck and one Android phone. The phone owns stacks, blinds, betting legality, streets, pot accounting, settlement, and undo. The physical deck deliberately remains outside the digital state: humans deal and inspect every card, and the app never generates, scans, displays, or evaluates cards.

## Run it

Requires Node.js 22.12+ (the current Vitest release requires it).

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm start
```

Checks:

```bash
npm run typecheck
npm test
npm run lint
npm run test:e2e
```

## Routes and UI model

- `/` opens the table immediately with default values (`Player 1`, `Player 2`, 1,000 chips, 10/20 blinds).
- `/settings/` is the optional configuration route. Saving settings starts a new match and returns to `/`.
- Setup, betting, raise entry, street transitions, showdown, and settlement remain in-place table states rather than separate routes.
- The reusable UI/UX rules live in [`docs/lean-ui-ux.md`](docs/lean-ui-ux.md).

## Architecture

- `src/game/` is a pure deterministic TypeScript engine. React, IndexedDB, service workers, and browser APIs do not define poker rules.
- `src/storage/repository.ts` stores the authoritative `MatchState` in IndexedDB after every transition. The record has `schemaVersion: 1`; future versions must migrate explicitly or show a recoverable incompatibility instead of resetting a match.
- `components/table.tsx` is the interactive client surface. Player 2's complete side and their raise dialog are transformed 180° so the phone can lie flat between players; shared center state is rendered to face both physical seats.
- `app/sw.ts` is bundled by the stable webpack-based `@serwist/next` integration. Required Next assets are precached in production and the worker deliberately does not skip waiting, so an update cannot replace the active client mid-hand.

## Accounting model

`players[i].stack` is chips not currently committed. `committed[i]` is that player's total commitment to the current hand, and `pot` is exactly `committed[0] + committed[1]`. Street commitments are a second index for betting logic, not extra chips. The invariant checked after every transition is:

`stack[0] + stack[1] + pot === 2,000`

The heads-up engine returns uncalled excess before an all-in showdown. Split pots award the odd chip to Player 2, matching the clockwise odd-chip convention for the fixed two-seat layout.

## Offline and device testing

Deploy over HTTPS, open once online, install the manifest as a standalone PWA, create and play a hand, kill and relaunch the app, then enable airplane mode. Refresh, continue through a street transition and showdown, start another hand, kill the process, reboot the Android device while still offline, and confirm the exact IndexedDB state returns. Place the phone flat in landscape between two people to verify both sides are readable and controls stay on the active player's physical side.

The production build is the meaningful PWA test; development intentionally does not register a service worker. No gameplay request uses a backend, CDN, font host, analytics service, or external script.

## Supported scope and constraints

Exactly two players, heads-up No-Limit Texas Hold'em, integer chip units, one physical deck, one device. The app requires a browser with IndexedDB and works without Wake Lock when that optional API is unavailable. Deployments must use HTTPS for service-worker installation.
