# Solve It!

An online, real-time **multiplayer web card game for 2–4 players**. Race to
Well-Being **Level 15**, but the winning level must come from *solving a Situation*,
not from a "go up a level" card. The server has all control, so nobody can cheat, and each
player only sees their own hand.

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

4. **Add players:** share the 4-letter room code, others **Join** with it. To test
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

This game teaches a **strengths-based view of neurodiversity**: people have different
ways of thinking and functioning, and difficulties usually come from a *mismatch
between a person and their environment.* It is not from being less capable, as many people tend to believe. You win by
solving Situations through supports, self-advocacy, and community, not just by
"trying harder". An interactive tutorial is available from the Lobby and in-game.

### Setup

Before the first turn, every player picks a **Character** (a permanent passive
ability, never discarded; each is unique). Once everyone has chosen, play begins.

### Your turn

At the start of your turn you **draw a Situation** from the Situation deck (or take
on a Situation you're holding in your hand):

- **Situation** → you face a *barrier* (noise, crowding, time pressure, unclear
  instructions, sensory overload, social pressure, …). Solve it during combat (below).
- **Mess-Up** → the environment threw up a barrier (Sensory Overload Spot, an
  unexpected routine change, …). You can usually **mitigate** it with a matching
  Support, Self-Advocacy card, Strength, or Friend. If you can't (or choose not to),
  you only take a small **temporary penalty** on your *next* Situation, never a
  permanent loss.
- **Go Up A Level** → goes into your Situation hand to play later.

### Combat: multiple valid solutions

Every Situation has a **base difficulty** (plus any temporary penalty carried over
from an unmitigated Mess-Up). Your **total** is your equipped
`Strength + Friend + Club` bonuses (**your Level does not count**). You win when
`total ≥ modified difficulty`, where the difficulty is reduced by **any valid
approach** you bring:

- a **relevant Strength** that fits the Situation,
- an **active Support / Accommodation** (up to 2 equipped) that removes a barrier,
- a **Self-Advocacy card** played during combat that addresses the barriers,
- a **Friend or Club** (or your Character) that matches the barrier.

The screen shows *your approach* and the *modified difficulty*, these are different
valid solutions, not a hidden correct answer. Win and you gain levels + Experience
cards; solving via a matched Strength, Support, or Self-Advocacy also **discovers** a
new approach (an extra Experience card). Fail and you suffer the consequences listed
on the card (some can be cancelled with Self-Advocacy); a discard consequence lets
you choose what to lose, including equipped cards.

### Cards

- **Support / Accommodation** — tools and environmental changes that remove barriers
  (Quiet Workspace, Written Instructions, Extra Processing Time, …). Not "power-ups":
  they change the conditions so existing abilities can be used.
- **Self-Advocacy** — one-shot cards you play while facing a Situation ("Can I Have
  That in Writing?", "I Need More Processing Time", …). Asking for a support is a
  skill, not a failure.
- **Strength** — a modest base bonus plus a **contextual** effect; they shine when
  they fit the Situation. Strengths are **used up** when you solve a Situation
  (Friends and Clubs stay).
- **Friend** — co-regulation and collaboration (limit 1 equipped).
- **Club** — a supportive community (limit 1 equipped). Clubs are Experience cards:
  they come from Experience draws, not the Situation deck.
- **Go Up A Level** — raises Well-Being but can never be the winning level.

Before resolving you can equip Strengths/Friends/Clubs/Supports from your hands, or
**ask another player for help** (their bonuses join yours; you keep the levels, they
get the Experience you offered). If you end your turn without fighting, you draw one
Experience card instead ("gain problem-solving ability").

**First to Level 15 wins, but only if that final level came from solving a
Situation.** Go-Up-A-Level cards can carry you to Level 14 but never win the game.

You can hold at most **6 cards** across your two hands. If a draw or reward puts you
over the limit, you discard down to 6, and you choose what to keep (toss the new card
or an older one).

## Features

- Strengths-based gameplay: Situations with barriers and **multiple valid solutions**
  (Strengths, Supports, Self-Advocacy, Friends/Clubs, environmental changes, teamwork).
- **Support / Accommodation** and **Self-Advocacy** card types, plus Mess-Ups that can
  be **mitigated** instead of always punished.
- Pre-game character selection (each Character is unique per game).
- Interactive **tutorial** plus an in-game help screen.
- Authoritative server with a pure, deterministic (seeded) game engine.
- Per-player state redaction, you see your hands; opponents show public info +
  card *counts* only.
- Anonymous 4-letter room codes; lobby → ready → start.
- Reconnect after a refresh/drop via a saved session token (while the server is up).
- Illegal moves are rejected server-side; the UI only offers legal actions.
- 6-card hand limit with a choose-what-to-keep discard step when you go over.
- Equip/unequip cards; Strengths are consumed when you solve a Situation.
- Data-driven cards, no per-card code.

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
rebalance cards, edit the data files only, see
[`docs/adding-cards.md`](./docs/adding-cards.md).

## Status

- Playable end-to-end; engine and server logic are covered by tests.
- Persistence is **in-memory only**, state resets when the server restarts (by
  design for now).
- If the current player disconnects mid-turn the turn doesn't auto-skip; they can
  reconnect to resume.
