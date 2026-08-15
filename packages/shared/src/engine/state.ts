import type { CardInstanceId } from '../cards/types.ts';
import type { Effect } from '../cards/types.ts';

export type PlayerId = string;

/**
 * Turn phases. The current player drives most of these; `await_help` is the only
 * phase where a *non-current* player (the chosen helper) must act.
 */
export type Phase =
  | 'character_select' // everyone picks a Character before play begins
  | 'await_action' // current player must draw or play a Situation from hand
  | 'combat' // a Situation is active; play cards / ask help / resolve
  | 'messup' // a Mess-Up was drawn; the player may mitigate it or accept a small temporary penalty
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
  /** Null until the player picks one during the character-select phase. */
  characterId: CardInstanceId | null;
  connected: boolean;
  /** Private, held cards, split per spec into the two "hands". */
  situationHand: CardInstanceId[]; // situations, clubs, levelups held
  experienceHand: CardInstanceId[]; // strengths, friends, supports, self-advocacy held
  /** Equipped (public) cards contributing bonuses. */
  strengths: CardInstanceId[];
  friendId: CardInstanceId | null;
  clubId: CardInstanceId | null;
  /** Active Supports/Accommodations (max MAX_SUPPORTS), tools that remove barriers. */
  supports: CardInstanceId[];
  /** Temporary difficulty penalty from an unmitigated Mess-Up; applied to the next Situation. */
  pendingPenalty: number;
}

/** The Situation currently being fought, plus any accepted help. */
export interface ActiveSituation {
  cardId: CardInstanceId;
  /** Whether this came from the deck (true) or was played from hand (false). */
  fromDeck: boolean;
  helperId: PlayerId | null;
  helperOfferedExperience: number;
  /** One-shot Self-Advocacy cards played during this combat. */
  selfAdvocacyPlayed?: CardInstanceId[];
  /** Consequence types cancelled during this combat (e.g. LOSE_LEVEL). */
  cancelledConsequences?: Effect['type'][];
  /** Temporary difficulty penalty carried over from an unmitigated Mess-Up. */
  tempPenalty?: number;
}

export interface PendingHelp {
  requesterId: PlayerId;
  helperId: PlayerId;
  offeredExperience: number;
}

/**
 * What the current player must do while in the `discard` phase.
 * - `limit`: trim down until at/under the hand limit (hand cards only).
 * - `count`: discard `remaining` cards to satisfy a consequence; `pool` says which
 *   of the player's cards qualify (hand *and* equipped).
 */
export type DiscardTask =
  | { kind: 'limit' }
  | { kind: 'count'; remaining: number; pool: 'experience' | 'situation' | 'any' };

export interface GameState {
  phase: Phase;
  players: PlayerState[]; // index order == turn order
  currentPlayerIndex: number;
  turn: number;

  /** Characters not yet picked during the character-select phase. */
  availableCharacters: CardInstanceId[];

  activeSituation: ActiveSituation | null;
  /** Mess-Up currently awaiting mitigation (the `messup` phase). */
  activeMessUp: CardInstanceId | null;
  pendingHelp: PendingHelp | null;
  /** Phase to return to once the current player has finished discarding. */
  resumeAfterDiscard: Phase | null;
  /** Active obligation during the `discard` phase (null otherwise). */
  discardTask: DiscardTask | null;
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
