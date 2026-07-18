# Adding & editing cards

All card content is **data**, not code. You can rename, rebalance, add, or remove
cards without touching the game engine.

## Where the data lives

`packages/shared/src/cards/data/`:

| File | Card type | Deck |
| --- | --- | --- |
| `situations.ts` | Situations (problems you solve) | Situation |
| `messups.ts` | Mess-Ups (resolve immediately when drawn) | Situation |
| `clubs.ts` | Clubs (equipped bonus) | Situation |
| `levelups.ts` | Go-Up-A-Level (instant, non-winning level) | Situation |
| `strengths.ts` | Strengths — Gardner's intelligences (equipped bonus) | Experience |
| `friends.ts` | Friends (equipped bonus) | Experience |
| `characters.ts` | Characters (one per player, never discarded) | — |

Each file is a plain typed array. Field meanings are in
`packages/shared/src/cards/types.ts`.

## Editing a card

Change any field in place. Examples:

- Make a Situation harder / more rewarding: edit `difficulty` and `reward`.
- Rebalance a Strength: edit `bonus` / `rank`.
- Change what a Mess-Up does: edit its `effects` array (see Effects below).

Keep each card's `id` stable if you can — ids are how instances are tracked.

## Adding a card

Append a new object to the relevant array with a **new unique `id`**
(e.g. `sit-21`). That's it — it's automatically included in `CARD_DB` and the deck.

## How many copies are in the deck

Decks can contain multiple copies of a definition. Copy counts are in
`packages/shared/src/cards/index.ts` (`SITUATION_DECK_RECIPE`,
`EXPERIENCE_DECK_RECIPE`). Adjust `copies` to change draw odds / deck size.

## Effects (data-driven)

Mess-Up `effects` and Situation `consequences` are arrays of `Effect` descriptors
(defined in `types.ts`), e.g. `{ type: 'LOSE_LEVEL', amount: 1 }`. The engine
interprets them in `packages/shared/src/engine/effects.ts`. To add a brand-new
kind of effect:

1. Add a variant to the `Effect` union in `cards/types.ts`.
2. Add a matching `case` in `applyEffect` in `engine/effects.ts`.

The exhaustiveness check will fail to compile until you handle the new variant.

Note: `reward.level` on a Situation is the only level source that can win the game;
`GAIN_LEVEL` effects (Go-Up-A-Level) are capped just below the target level on
purpose.

## Inserting real artwork

Cards currently render as labelled placeholders via
`apps/web/src/components/PlaceholderCard.tsx`. Each card has an `art` string used as
the placeholder label. To use real images, replace the `.art` block in that
component with an `<img>` sourced by the card's **definition id**
(`defIdOf(id)` from `@school-days/shared`) — e.g. `/cards/${defIdOf(id)}.png`. No
engine changes are needed.
