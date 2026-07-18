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

## Running the game

Requires **Node 20+** and access to the public npm registry. Run all commands from
the repo root.

1. **Install dependencies** (first time only):

   ```bash
   npm install
   ```

2. **Start the server and web client together:**

   ```bash
   npm run dev
   ```

   This runs the Socket.IO server on **:3001** and the Vite web client on **:5173**.
   (To run them separately, use `npm run dev:server` and `npm run dev:web` in two
   terminals.)

3. **Open the game:** go to <http://localhost:5173>, enter a name, and
   **Create a room**.

4. **Add players:** share the 4-letter room code — others **Join** with it. To test
   by yourself, open a second browser tab/window and join with the same code.

5. **Play:** everyone clicks **Ready**, then the host clicks **Start**.

> The client talks to `http://localhost:3001` by default. To point it elsewhere, set
> `VITE_SERVER_URL`. To change the server port, set `PORT` (e.g. `PORT=4000 npm run dev:server`).

## Testing

```bash
npm test              # run all Vitest suites once
npm run test:watch    # re-run tests on change
npm run typecheck     # type-check every workspace (tsc --noEmit)
npm run lint          # eslint (flat config)
```

Run a single test file (optionally filter by name with `-t`):

```bash
npx vitest run packages/shared/src/engine/engine.test.ts
npx vitest run packages/shared/src/engine/engine.test.ts -t "victory"
```

The engine tests live in `packages/shared/src/engine/` and cover setup, redaction,
move validation, combat/victory, the ask-for-help flow, and a full auto-played game
that checks every card is conserved and a winner emerges.

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
npm run build        # build buildable workspaces (web)
```

See [`CLAUDE.md`](./CLAUDE.md) for the full command list and architecture. To add or
rebalance cards, edit the data files only — see
[`docs/adding-cards.md`](./docs/adding-cards.md).

## Status

- Playable end-to-end; engine and server logic are covered by tests.
- Persistence is **in-memory only** — state resets when the server restarts (by
  design for now).
- If the current player disconnects mid-turn the turn doesn't auto-skip; they can
  reconnect to resume.
