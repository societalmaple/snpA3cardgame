# School Days (working title)

An online, multiplayer web card game for 2–4 players. Be the first to reach
Well-Being **Level 5** — but the winning level must come from *solving a Situation*.

- Game design: [`directions.md`](./directions.md)
- Build plan & decisions: [`PLAN.md`](./PLAN.md)
- Working with the code (commands + architecture): [`CLAUDE.md`](./CLAUDE.md)
- Editing / adding cards: [`docs/adding-cards.md`](./docs/adding-cards.md)

## Quick start

```bash
npm install     # needs access to the public npm registry
npm test        # verify the game engine
npm run dev     # start the server (:3001) and the web client (:5173)
```

Then open http://localhost:5173, create a room, share the 4-letter code, and play.
Open a second browser tab (or window) to join as another player.

## Layout

```
packages/shared/   pure game engine + card data + types + network protocol
apps/server/       authoritative Socket.IO server (rooms, lobby, redaction)
apps/web/          React + Vite client (lobby + game UI)
```

Cards are placeholders; all card content lives in editable data files
(`packages/shared/src/cards/data/`) so the game can be reskinned without touching
the engine.
