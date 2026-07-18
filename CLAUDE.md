# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

This repository is **pre-implementation**. It currently contains only planning
documents — there is no source code, build system, or tests yet:

- `directions.md` — the authoritative design spec and coding plan for a card game
  currently titled **"School Days"** (name is a placeholder). Read this in full
  before writing any game code; the sections below only summarize it.
- `README.md` — placeholder.

When you begin implementation, this file should be updated with the real build,
lint, test, and run commands for whatever stack is chosen.

## What is being built

A responsive, online, web-based **multiplayer card game for 2–4 players**. Players
race to be first to reach **Well-Being Level 5** — but the final winning level must
normally come from *solving a Situation*, not from "Go Up A Level" cards or other
effects.

### Core rules that drive the engine

- Each player starts at Level 1 with 4 Experience cards and 1 random Character.
- Before play, a player may activate one Club, one Friend, and any Rank 1 Strengths.
- Default limits: 1 Character, 1 Friend, 1 Club, unlimited Strengths.
- Each turn a player either draws from the Situation deck or solves a Situation
  already in hand. Drawn Situations go to hand; Mess-Up cards resolve immediately
  and are discarded.
- Solving a Situation compares
  `Player Level + Strength bonuses + Friend bonus + Club bonus` against the
  Situation difficulty. Success requires the total to be **strictly greater** than
  the difficulty.
- Success awards Experience cards + Levels; failure applies the Situation's
  consequences.
- A player may ask one other player for help: totals combine, the active player
  keeps all Level rewards, and Experience rewards split by an agreed deal.
- The engine must auto-manage turn order, rewards, consequences, active bonuses,
  victory detection, discard piles, and deck reshuffling.

### Card types (placeholder counts to generate)

- 20 Situation cards, 4–5 Mess-Up cards, 7 Club cards, 3–4 "Go Up A Level" cards
- 8 Strength cards (Howard Gardner's eight Multiple Intelligences), 6 Friend cards
- 4 Character cards (each has a permanent passive; male/female sides)
- Two separate decks — **Situation** and **Experience** — each with its own
  discard pile.

## Architectural constraints (from the spec)

These are hard requirements from `directions.md`, not suggestions:

- **Use placeholder cards and placeholder artwork only.** Real names, images,
  descriptions, bonuses, rewards, and effects come later. Placeholder graphics
  should label the card type and a placeholder number.
- **Store all card definitions in editable JSON or TypeScript data files** so cards
  can be changed without touching the game engine. Add comments marking exactly
  where future developers insert final art and edit each card's stats/text/
  effects/rewards/consequences.
- **Keep game logic separate from the interface.** Implement card effects through
  reusable, data-driven effect definitions — avoid hardcoded per-card functions.
- **Authoritative server-side game state** for online multiplayer, with a lobby/room
  structure, player join + ready status, turn synchronization, reconnect handling,
  and validation so players cannot make illegal moves or read/edit another player's
  private state.
- Use a clear folder split for: UI components, game engine logic,
  multiplayer/networking, state management, card data, types, and placeholder assets.

## Integration note

The game is meant to be integrated into an existing website **without changing
unrelated pages or assets**. Do **not** inspect, process, or use any mascot images.
