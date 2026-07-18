import { MIN_PLAYERS, MAX_PLAYERS, STARTING_LEVEL, STARTING_EXPERIENCE } from '../constants.ts';
import {
  SITUATION_DECK_RECIPE,
  EXPERIENCE_DECK_RECIPE,
  CHARACTER_DEFS,
  makeInstanceId,
  type DeckEntry,
} from '../cards/index.ts';
import type { CardInstanceId } from '../cards/types.ts';
import type { GameState, PlayerState } from './state.ts';
import { shuffle } from './rng.ts';

export interface PlayerSeed {
  id: string;
  name: string;
}

/** Expand a deck recipe into concrete card instance ids. */
function expandRecipe(
  recipe: readonly DeckEntry[],
  counterStart: number,
): { instances: CardInstanceId[]; counter: number } {
  const instances: CardInstanceId[] = [];
  let counter = counterStart;
  for (const entry of recipe) {
    for (let i = 0; i < entry.copies; i++) {
      instances.push(makeInstanceId(entry.defId, counter++));
    }
  }
  return { instances, counter };
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
  const sit = expandRecipe(SITUATION_DECK_RECIPE, counter);
  counter = sit.counter;
  const exp = expandRecipe(EXPERIENCE_DECK_RECIPE, counter);
  counter = exp.counter;
  const charInstances = CHARACTER_DEFS.map((defId) => makeInstanceId(defId, counter++));

  let rngState = seed | 0;
  const shuffledSit = shuffle(sit.instances, rngState);
  rngState = shuffledSit.state;
  const shuffledExp = shuffle(exp.instances, rngState);
  rngState = shuffledExp.state;
  const shuffledChars = shuffle(charInstances, rngState);
  rngState = shuffledChars.state;

  const situationDeck = shuffledSit.items;
  const experienceDeck = shuffledExp.items;

  const players: PlayerState[] = playerSeeds.map((ps, idx) => ({
    id: ps.id,
    name: ps.name,
    level: STARTING_LEVEL,
    characterId: shuffledChars.items[idx]!,
    connected: true,
    situationHand: [],
    experienceHand: [],
    strengths: [],
    friendId: null,
    clubId: null,
  }));

  // Deal starting Experience cards round-robin from the top of the deck.
  for (let i = 0; i < STARTING_EXPERIENCE; i++) {
    for (const p of players) {
      const card = experienceDeck.pop();
      if (card) p.experienceHand.push(card);
    }
  }

  return {
    phase: 'await_action',
    players,
    currentPlayerIndex: 0,
    turn: 1,
    situationDeck,
    situationDiscard: [],
    experienceDeck,
    experienceDiscard: [],
    activeSituation: null,
    pendingHelp: null,
    winnerId: null,
    rngState,
    log: [{ id: 0, turn: 1, message: 'Game started.' }],
    nextEventId: 1,
    turnFlags: { enteredCombatThisTurn: false },
  };
}
