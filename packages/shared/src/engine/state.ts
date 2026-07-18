import type { CardInstanceId } from '../cards/types.ts';

export type PlayerId = string;

/**
 * Turn phases. The current player drives most of these; `await_help` is the only
 * phase where a *non-current* player (the chosen helper) must act.
 */
export type Phase =
  | 'await_action' // current player must draw or play a Situation from hand
  | 'combat' // a Situation is active; play cards / ask help / resolve
  | 'await_help' // waiting for the chosen helper to accept/decline
  | 'discard' // current player is over the hand limit and must discard down
  | 'main' // post-draw/post-combat: play cards, then end turn
  | 'game_over';

export interface GameEvent {
  id: number;
  turn: number;
  message: string;
  playerId?: PlayerId;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  level: number;
  characterId: CardInstanceId;
  connected: boolean;
  /** Private, held cards, split per spec into the two "hands". */
  situationHand: CardInstanceId[]; // situations, clubs, levelups held
  experienceHand: CardInstanceId[]; // strengths, friends held
  /** Equipped (public) cards contributing bonuses. */
  strengths: CardInstanceId[];
  friendId: CardInstanceId | null;
  clubId: CardInstanceId | null;
}

/** The Situation currently being fought, plus any accepted help. */
export interface ActiveSituation {
  cardId: CardInstanceId;
  /** Whether this came from the deck (true) or was played from hand (false). */
  fromDeck: boolean;
  helperId: PlayerId | null;
  helperOfferedExperience: number;
}

export interface PendingHelp {
  requesterId: PlayerId;
  helperId: PlayerId;
  offeredExperience: number;
}

export interface GameState {
  phase: Phase;
  players: PlayerState[]; // index order == turn order
  currentPlayerIndex: number;
  turn: number;

  situationDeck: CardInstanceId[]; // draw from the end (top)
  situationDiscard: CardInstanceId[];
  experienceDeck: CardInstanceId[];
  experienceDiscard: CardInstanceId[];

  activeSituation: ActiveSituation | null;
  pendingHelp: PendingHelp | null;
  /** Phase to return to once the current player has discarded down to the limit. */
  resumeAfterDiscard: Phase | null;
  winnerId: PlayerId | null;

  rngState: number;
  log: GameEvent[];
  nextEventId: number;

  /** Reset at the start of each turn. */
  turnFlags: { enteredCombatThisTurn: boolean };
}

export function currentPlayer(state: GameState): PlayerState {
  const p = state.players[state.currentPlayerIndex];
  if (!p) throw new Error('Invalid currentPlayerIndex');
  return p;
}

export function findPlayer(state: GameState, playerId: PlayerId): PlayerState | undefined {
  return state.players.find((p) => p.id === playerId);
}
