import type { Card, CardId, CardInstanceId } from './types.ts';
import { SITUATIONS } from './data/situations.ts';
import { MESSUPS } from './data/messups.ts';
import { CLUBS } from './data/clubs.ts';
import { LEVELUPS } from './data/levelups.ts';
import { STRENGTHS } from './data/strengths.ts';
import { FRIENDS } from './data/friends.ts';
import { CHARACTERS } from './data/characters.ts';

export * from './types.ts';
export { SITUATIONS, MESSUPS, CLUBS, LEVELUPS, STRENGTHS, FRIENDS, CHARACTERS };

/** Every card definition, flat. */
export const ALL_CARDS: Card[] = [
  ...SITUATIONS,
  ...MESSUPS,
  ...CLUBS,
  ...LEVELUPS,
  ...STRENGTHS,
  ...FRIENDS,
  ...CHARACTERS,
];

/** Lookup table by definition id. */
export const CARD_DB: Readonly<Record<CardId, Card>> = Object.fromEntries(
  ALL_CARDS.map((c) => [c.id, c]),
);

/**
 * Deck composition. `copies` lets a single definition appear multiple times so the
 * decks are large enough for 2–4 players. Edit copy counts to rebalance draw odds.
 */
export interface DeckEntry {
  defId: CardId;
  copies: number;
}

export const SITUATION_DECK_RECIPE: DeckEntry[] = [
  ...SITUATIONS.map((c) => ({ defId: c.id, copies: 1 })),
  ...MESSUPS.map((c) => ({ defId: c.id, copies: 2 })),
  ...CLUBS.map((c) => ({ defId: c.id, copies: 1 })),
  ...LEVELUPS.map((c) => ({ defId: c.id, copies: 1 })),
];

export const EXPERIENCE_DECK_RECIPE: DeckEntry[] = [
  ...STRENGTHS.map((c) => ({ defId: c.id, copies: 3 })),
  ...FRIENDS.map((c) => ({ defId: c.id, copies: 2 })),
];

/** Character definition ids (dealt one per player, not shuffled into a deck). */
export const CHARACTER_DEFS: CardId[] = CHARACTERS.map((c) => c.id);

const INSTANCE_SEP = '__';

/** Build the instance id for the Nth copy of a definition. */
export function makeInstanceId(defId: CardId, seq: number): CardInstanceId {
  return `${defId}${INSTANCE_SEP}${seq}`;
}

/** Recover the definition id from an instance id. */
export function defIdOf(instanceId: CardInstanceId): CardId {
  const idx = instanceId.indexOf(INSTANCE_SEP);
  return idx === -1 ? instanceId : instanceId.slice(0, idx);
}

/** Look up the card definition for an instance id (or definition id). */
export function cardOf(instanceId: CardInstanceId): Card | undefined {
  return CARD_DB[defIdOf(instanceId)];
}
