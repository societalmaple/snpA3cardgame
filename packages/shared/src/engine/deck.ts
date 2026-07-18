import type { CardInstanceId } from '../cards/types.ts';
import type { GameState } from './state.ts';
import { shuffle } from './rng.ts';

/** Draw one card from a deck, reshuffling its discard pile in when empty. */
function drawOne(
  deck: readonly CardInstanceId[],
  discard: readonly CardInstanceId[],
  rngState: number,
): { card: CardInstanceId | null; deck: CardInstanceId[]; discard: CardInstanceId[]; rngState: number } {
  let d = deck.slice();
  let disc = discard.slice();
  let s = rngState;

  if (d.length === 0) {
    if (disc.length === 0) return { card: null, deck: d, discard: disc, rngState: s };
    const sh = shuffle(disc, s);
    d = sh.items;
    s = sh.state;
    disc = [];
  }

  const card = d.pop() ?? null;
  return { card, deck: d, discard: disc, rngState: s };
}

export function drawSituation(state: GameState): { state: GameState; card: CardInstanceId | null } {
  const r = drawOne(state.situationDeck, state.situationDiscard, state.rngState);
  return {
    state: { ...state, situationDeck: r.deck, situationDiscard: r.discard, rngState: r.rngState },
    card: r.card,
  };
}

export function drawExperience(state: GameState): { state: GameState; card: CardInstanceId | null } {
  const r = drawOne(state.experienceDeck, state.experienceDiscard, state.rngState);
  return {
    state: { ...state, experienceDeck: r.deck, experienceDiscard: r.discard, rngState: r.rngState },
    card: r.card,
  };
}
