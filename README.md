# School Days (working title)

An online, real-time **multiplayer web card game for 2–4 players**. Race to
Well-Being **Level 5** — but the winning level must come from *solving a Situation*,
not from a lucky card. The server is authoritative, so nobody can cheat, and each
player only ever sees their own hand.

> Cards, names, and artwork are **placeholders**. All card content lives in editable
> data files, so the game can be fully reskinned and rebalanced without touching the
> engine.

- Game design: [`directions.md`](./directions.md)
- Build plan & decisions: [`PLAN.md`](./PLAN.md)
- Commands + architecture for contributors: [`CLAUDE.md`](./CLAUDE.md)
- Editing / adding cards: [`docs/adding-cards.md`](./docs/adding-cards.md)

## Quick start

Requires **Node 20+** and access to the public npm registry.

```bash
npm install     # install workspace dependencies
npm test        # verify the game engine (Vitest)
npm run dev     # start the server (:3001) and the web client (:5173)
```

Open <http://localhost:5173>, enter a name, and **Create a room**. Share the
4-letter code; friends **Join** with it (or open a second browser tab to test
solo). Everyone clicks **Ready**, the host clicks **Start**, and play begins.

## How to play

On your turn you either **draw a Situation** or **take on a Situation from your
hand**:

- **Situation** → you fight it. Your total is `Level + Strength + Friend + Club`
  bonuses. If your total is **strictly greater** than the Situation's difficulty you
  win: gain levels and Experience cards. Otherwise you suffer its consequences.
- **Mess-Up** → resolves immediately (something bad happens).
- **Club / Go-Up-A-Level** → goes into your hand to play later.

Before resolving a fight you can equip Strengths/Friends/Clubs from your hand to
boost your total, or **ask another player for help** (their bonuses join yours; you
keep all the levels, they get the Experience you offered). If you don't fight at all
this turn, you draw one Experience card instead ("gain problem-solving ability").

**First to Level 5 wins — but only if that final level came from solving a
Situation.** Go-Up-A-Level cards can carry you to Level 4 but never win the game.

## Features

- Authoritative server with a pure, deterministic (seeded) game engine.
- Per-player state redaction — you see your hands; opponents show public info +
  card *counts* only.
- Anonymous 4-letter room codes; lobby → ready → start.
- Reconnect after a refresh/drop via a saved session token (while the server is up).
- Illegal moves are rejected server-side; the UI only offers legal actions.
- Data-driven cards — no per-card code.

## Project layout

```
packages/shared/   pure game engine + card data + types + network protocol
apps/server/       authoritative Socket.IO server (rooms, lobby, redaction)
apps/web/          React + Vite client (lobby + game UI, Zustand, socket)
```

Stack: **TypeScript** end-to-end (npm workspaces monorepo) · React + Vite · Zustand
· Socket.IO · Vitest.

## Development

```bash
npm run dev:server   # server only (Socket.IO, :3001; set PORT to override)
npm run dev:web      # web only (Vite, :5173; reads VITE_SERVER_URL, default :3001)
npm run typecheck    # tsc --noEmit across every workspace
npm run lint         # eslint (flat config)
npm run build        # build buildable workspaces (web)
```

Run a single test file:

```bash
npx vitest run packages/shared/src/engine/engine.test.ts
```

To add or rebalance cards, edit the data files only — see
[`docs/adding-cards.md`](./docs/adding-cards.md).

## Status

- Playable end-to-end; engine and server logic are covered by tests.
- Persistence is **in-memory only** — state resets when the server restarts (by
  design for now).
- If the current player disconnects mid-turn the turn doesn't auto-skip; they can
  reconnect to resume.
