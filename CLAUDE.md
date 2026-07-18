# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An online, multiplayer web card game ("School Days", working title) for 2–4 players.
Players race to Well-Being **Level 15**; the winning level must come from *solving a
Situation*. Full game design is in [`directions.md`](./directions.md); the build
plan and decisions are in [`PLAN.md`](./PLAN.md).

## Commands

Run from the repo root (npm workspaces):

```bash
npm install            # required first; the public npm registry must be reachable
npm test               # run all Vitest suites (engine tests live in packages/shared)
npm run test:watch     # watch mode
npm run typecheck      # tsc --noEmit across every workspace
npm run lint           # eslint (flat config)
npm run dev            # run server + web together (scripts/dev.mjs, no extra deps)
npm run dev:server     # server only (Socket.IO, defaults to :3001, PORT env to override)
npm run dev:web        # web only (Vite dev server on :5173)
npm run build          # build all buildable workspaces (web)
```

Run a single test file: `npx vitest run packages/shared/src/engine/engine.test.ts`
(add `-t "name"` to filter by test name).

The web client reads `VITE_SERVER_URL` (defaults to `http://localhost:3001`).

### Quick engine checks without installing

Node 25 runs TypeScript directly with `node --experimental-transform-types <file>`
(needs the `--experimental-transform-types` flag; plain `node file.ts` fails on
enums). Because all relative imports use explicit `.ts` extensions, you can import
engine modules straight from `packages/shared/src` in a scratch script to exercise
the reducer without `npm install`. To resolve the `@school-days/shared` bare
specifier this way, symlink it first:
`mkdir -p node_modules/@school-days && ln -sfn ../../packages/shared node_modules/@school-days/shared`.

## Architecture

npm-workspaces monorepo. **The server is authoritative; clients are thin.**

```
packages/shared/   pure game engine + card data + types + network protocol
apps/server/       Socket.IO server: rooms, lobby, authority, per-player redaction
apps/web/          React + Vite client: lobby + game UI, Zustand store, socket
```

### `packages/shared` — the engine (start here)
- **Pure & deterministic.** `engine/reduce.ts` `applyAction(state, action)` returns a
  `Result` (never throws on bad input) and is the *only* way to mutate game state.
  Randomness is a seeded PRNG threaded through state (`engine/rng.ts`), so games are
  reproducible; the seed lives server-side and is never sent to clients.
- **Data-driven effects.** Cards carry `Effect` descriptors (e.g.
  `{ type: 'LOSE_LEVEL', amount: 1 }`) interpreted by `engine/effects.ts`. There is
  no per-card code. Card data is in `cards/data/*.ts`; see [`docs/adding-cards.md`](./docs/adding-cards.md).
- **Card instances.** Decks hold multiple copies of a definition, so state tracks
  *instance* ids (`str-01__12`); use `cardOf(id)` / `defIdOf(id)` from `cards/index.ts`.
- **One source of truth for legality.** `getLegalActions(state, playerId)` drives both
  server validation and client button-enabling.
- **Redaction.** `engine/redact.ts` `redactFor(state, playerId)` produces the
  `PlayerView` each client receives: own hands in full, opponents reduced to public
  info + hand *counts*, decks reduced to counts.
- `constants.ts` holds tunables (target level, `HAND_LIMIT`, starting hand, player bounds).
- **Hand limit.** Max `HAND_LIMIT` cards across both hands. Drawing over it routes the
  player into a `discard` phase (`DISCARD_CARD` action) that resumes the prior phase
  once they're back at/under the limit — so they choose what to keep.
- **Strengths are consumed** when a Situation is solved (RESOLVE_COMBAT win discards
  the winner's equipped Strengths; Friends/Clubs stay). `UNEQUIP_CARD` returns an
  equipped card to its hand (Strength/Friend → experience hand, Club → situation hand).
- `protocol.ts` is the typed Socket.IO contract shared by both ends.

### `apps/server`
- `rooms.ts` `RoomManager` — in-memory (no DB), anonymous 4-letter room codes, lobby
  → ready → start, reconnect via a per-player token. It owns the full `GameState` and
  runs `applyAction`. `index.ts` wires it to Socket.IO and broadcasts a redacted
  `game:view` to each player after every change. **Server forces `action.playerId` to
  the authenticated sender** — clients can't act as anyone else.

### `apps/web`
- `store.ts` (Zustand) holds the socket, the current `RoomState`, and the latest
  redacted `PlayerView`; it persists the session to `localStorage` for reconnect.
- `components/` — `Lobby`, `Game`, `PlaceholderCard`. UI enables controls purely from
  `view.legal`. Styling is scoped CSS Modules; no global-style leakage.

## Conventions
- **Relative imports use explicit `.ts`/`.tsx` extensions** (tsconfig has
  `allowImportingTsExtensions`). This keeps files runnable by bare Node *and* by
  Vite/Vitest. Cross-package imports use the bare `@school-days/shared` specifier.
- Keep game logic in `packages/shared`; never put rules in the server or UI.
- To add/change cards, edit data files only — see `docs/adding-cards.md`.
- Placeholder art only; do not add or use mascot images (per `directions.md`).

## Status / not yet done
- Persistence is in-memory only; state is lost on server restart (by design for now).
- If the *current* player disconnects mid-turn, the turn does not auto-skip; they can
  reconnect (session token) to resume while the server is up.
