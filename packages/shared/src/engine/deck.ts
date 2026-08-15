import { nextInt } from './rng.ts';
import { makeInstanceId, SITUATIONS, MESSUPS, LEVELUPS, STRENGTHS, FRIENDS, SUPPORTS, SELF_ADVOCACY, CLUBS } from '../cards/index.ts';
import type { CardInstanceId } from '../cards/types.ts';
import type { GameState } from './state.ts';

/** Definitions a Situation draw can produce (Situation deck contents). */
export const SITUATION_DEFS = [...SITUATIONS, ...MESSUPS, ...LEVELUPS];

/** Definitions an Experience reward/start deal can produce (Experience deck contents). */
export const EXPERIENCE_DEFS = [...STRENGTHS, ...FRIENDS, ...SUPPORTS, ...SELF_ADVOCACY, ...CLUBS];

/** Pick a random definition and mint a fresh, unique card instance. */
function drawRandomDef(
  defs: { id: string }[],
  rngState: number,
  counter: number,
): { card: CardInstanceId | null; rngState: number; counter: number } {
  const r = nextInt(rngState, defs.length);
  const def = defs[r.value]!;
  return { card: makeInstanceId(def.id, counter), rngState: r.state, counter: counter + 1 };
}

export function drawSituation(state: GameState): { state: GameState; card: CardInstanceId | null } {
  const { card, rngState, counter } = drawRandomDef(SITUATION_DEFS, state.rngState, state.nextEventId);
  return {
    state: { ...state, rngState, nextEventId: counter },
    card,
  };
}

export function drawExperience(state: GameState): { state: GameState; card: CardInstanceId | null } {
  const { card, rngState, counter } = drawRandomDef(EXPERIENCE_DEFS, state.rngState, state.nextEventId);
  return {
    state: { ...state, rngState, nextEventId: counter },
    card,
  };
}