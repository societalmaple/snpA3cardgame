# Build Plan — "School Days" (working title)

A responsive, online, multiplayer web card game for 2–4 players. Players race to
**Well-Being Level 5**; the winning level must normally come from *solving a
Situation*. Full game design lives in [`directions.md`](./directions.md).

## Locked decisions

| Topic | Decision |
|---|---|
| Scope | **Standalone app** — no host-site integration |
| Server | Runs **locally** on the developer's machine (`localhost`) |
| Identity | **Anonymous room codes** — no auth/login |
| Persistence | **In-memory, in-session only** — no DB/Redis; state resets on server restart |
| Language | **TypeScript** end-to-end (client, server, engine, card data) |

## Stack

| Layer | Choice | Why |
|---|---|---|
| Repo | npm workspaces monorepo | Share engine/types/data between server and web (npm 11 built-in, no extra tooling) |
| Engine | Pure TypeScript (zero deps) | Deterministic, fully unit-testable reducer |
| Backend | Node.js + Socket.IO | Persistent WebSocket server for authoritative state + reconnect |
| Frontend | React + Vite | Fast dev/build, responsive component UI |
| Client state | Zustand | Server is authoritative; client mostly holds latest redacted snapshot |
| Styling | CSS Modules (scoped) | No global-style leakage |
| Tests | Vitest | Pure engine → trivial, high-value unit tests |

## Architecture

**Authoritative server, thin clients.** The server owns the full `GameState`.
Clients send *action requests*; the server validates against the rules + whose turn
it is, applies effects via the engine, then broadcasts a **redacted per-player view**
(you see your own hand; opponents show public info + hand *counts* only).

```
Client (React) --action request--> Server (Socket.IO)
                                     └─ validate → engine.reduce() → redact per player
Client (React) <--redacted view + event log-- Server
```

### Pure, data-driven engine
- Core reducer: `reduce(state, action, rng) → { state, events }`, deterministic under
  a **seeded RNG** (seed lives server-side).
- `getLegalActions(state, playerId)` powers both server authority and client
  button-enabling from one source of truth.
- **Card effects are data, not code**: descriptors like
  `{ type: 'MODIFY_LEVEL', amount: -1 }` interpreted by a small effect interpreter.
  Adding/changing a card is a data edit, never an engine rewrite.

### Card data model
Typed TS files per card type. Each card: stable `id`, `type`, placeholder
`name`/`art`, numeric stats, and `effects`/`consequences` descriptor arrays. Comment
banners mark where to insert real art and edit stats/text/rewards. Placeholder art =
one `<PlaceholderCard>` component rendering type + number (no external images).

Counts (per spec): 20 Situations, 4–5 Mess-Ups, 7 Clubs, 3–4 Go-Up-A-Level,
8 Strengths (Gardner's intelligences), 6 Friends, 4 Characters. Two decks
(Situation, Experience), each with its own discard pile + reshuffle.

### Networking protocol (sketch)
- **Client→server:** `CreateRoom`, `JoinRoom`, `SetReady`, `StartGame`,
  `DrawSituation`, `SolveFromHand`, `PlayCard`, `AskForHelp`, `RespondToHelp`,
  `EndTurn`.
- **Server→client:** `RoomState`, `GameStateView` (redacted), `ActionRejected`,
  `GameEvent` (log), `Error`.
- **Reconnect:** client stores `playerId` + session token in `localStorage`; on
  reconnect the server re-binds the socket and resends the redacted state.

## Folder structure

```
packages/shared/   engine (reducer + effect interpreter), types, card data, protocol
apps/server/       Socket.IO server, room manager, per-player redaction, validation
apps/web/          React + Vite UI (lobby, board, hand, controls, event log)
```

## Roadmap

- **Phase 0 — Scaffold:** npm workspaces, TS config, Vite, Vitest, lint.
- **Phase 1 — Engine:** types + placeholder card data + reducer + effect interpreter
  + `getLegalActions`, with Vitest scenario tests. Playable via tests, no UI/network.
- **Phase 2 — Hotseat UI:** local pass-and-play to validate rules/UX fast.
- **Phase 3 — Server:** room codes, lobby, ready, start, authoritative engine,
  message protocol.
- **Phase 4 — Wire client↔server:** redacted views, turn sync.
- **Phase 5 — Harden:** reconnect, illegal-move rejection, reshuffle, help
  negotiation + reward split, win-only-via-Situation.
- **Phase 6 — Polish & docs:** responsive layout, event log, `<PlaceholderCard>`,
  "how to add real cards" guide.
