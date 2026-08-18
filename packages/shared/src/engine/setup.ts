import { MIN_PLAYERS, MAX_PLAYERS, STARTING_LEVEL, STARTING_EXPERIENCE } from '../constants.ts';
import { CHARACTER_DEFS, makeInstanceId } from '../cards/index.ts';
import type { CardInstanceId } from '../cards/types.ts';
import type { GameState, PlayerState } from './state.ts';
import { nextInt } from './rng.ts';
import { EXPERIENCE_DEFS } from './deck.ts';

export interface PlayerSeed {
  id: string;
  name: string;
}

/** Pick a random definition and create a new instance id. */
function drawRandomDef(
  defs: { id: string }[],
  rngState: number,
  counter: number,
): { cardId: CardInstanceId; rngState: number; counter: number } {
  const r = nextInt(rngState, defs.length);
  const def = defs[r.value]!;
  return { cardId: makeInstanceId(def.id, counter), rngState: r.state, counter: counter + 1 };
}

/**
 * Build a fresh, ready-to-play game state. Lobby / ready handling lives in the
 * server layer; this produces the authoritative in-game state once play begins.
 */
export function createGame(playerSeeds: readonly PlayerSeed[], seed: number): GameState {
  if (playerSeeds.length < MIN_PLAYERS || playerSeeds.length > MAX_PLAYERS) {
    throw new Error(`Need ${MIN_PLAYERS}-${MAX_PLAYERS} players, got ${playerSeeds.length}`);
  }
  if (new Set(playerSeeds.map((p) => p.id)).size !== playerSeeds.length) {
    throw new Error('Duplicate player ids');
  }

  let counter = 0;
  const charInstances = CHARACTER_DEFS.map((defId) => makeInstanceId(defId, counter++));

  let rngState = seed | 0;

  // Characters are not dealt, players pick during the character-select phase.
  const players: PlayerState[] = playerSeeds.map((ps) => ({
    id: ps.id,
    name: ps.name,
    level: STARTING_LEVEL,
    characterId: null,
    connected: true,
    situationHand: [],
    experienceHand: [],
    strengths: [],
    friendId: null,
    clubId: null,
    supports: [],
    pendingPenalty: 0,
  }));

  // Deal starting Experience cards randomly.
  for (let i = 0; i < STARTING_EXPERIENCE; i++) {
    for (const p of players) {
      const { cardId, rngState: newRng, counter: newCounter } = drawRandomDef(EXPERIENCE_DEFS, rngState, counter);
      rngState = newRng;
      counter = newCounter;
      p.experienceHand.push(cardId);
    }
  }

  return {
    phase: 'character_select',
    players,
    currentPlayerIndex: 0,
    turn: 1,
    availableCharacters: charInstances,
    activeSituation: null,
    activeMessUp: null,
    pendingHelp: null,
    resumeAfterDiscard: null,
    discardTask: null,
    winnerId: null,
    rngState,
    log: [{ id: 0, turn: 1, message: 'Players are choosing characters.' }],
    nextEventId: 1,
    turnFlags: { enteredCombatThisTurn: false, askedHelpThisTurn: false },
  };
}