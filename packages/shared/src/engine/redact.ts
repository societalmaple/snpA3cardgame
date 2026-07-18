import type { CardInstanceId } from '../cards/types.ts';
import type { GameState, PlayerId, GameEvent, Phase, PendingHelp } from './state.ts';
import { getLegalActions, type LegalActions } from './reduce.ts';
import { combatMath, type CombatMath } from './bonuses.ts';

// ─────────────────────────────────────────────────────────────────────────────
// REDACTION — the server holds the full GameState but sends each player only a
// PlayerView: their own hands in full, everyone else reduced to public info +
// hand *counts*, and decks reduced to counts (so draws can't be predicted).
// ─────────────────────────────────────────────────────────────────────────────

export interface PublicPlayer {
  id: PlayerId;
  name: string;
  level: number;
  characterId: CardInstanceId | null;
  connected: boolean;
  strengths: CardInstanceId[];
  friendId: CardInstanceId | null;
  clubId: CardInstanceId | null;
  situationHandCount: number;
  experienceHandCount: number;
}

export interface ActiveSituationView {
  cardId: CardInstanceId;
  helperId: PlayerId | null;
  math: CombatMath | null;
}

export interface PlayerView {
  you: PlayerId;
  phase: Phase;
  currentPlayerId: PlayerId;
  turn: number;
  winnerId: PlayerId | null;
  players: PublicPlayer[];
  yourSituationHand: CardInstanceId[];
  yourExperienceHand: CardInstanceId[];
  activeSituation: ActiveSituationView | null;
  pendingHelp: PendingHelp | null;
  availableCharacters: CardInstanceId[]; // pickable during character select
  situationDeckCount: number;
  experienceDeckCount: number;
  situationDiscardCount: number;
  experienceDiscardCount: number;
  situationDiscardTop: CardInstanceId | null;
  experienceDiscardTop: CardInstanceId | null;
  log: GameEvent[];
  legal: LegalActions;
}

export function redactFor(state: GameState, playerId: PlayerId): PlayerView {
  const you = state.players.find((p) => p.id === playerId);
  const current = state.players[state.currentPlayerIndex]!;

  const players: PublicPlayer[] = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    level: p.level,
    characterId: p.characterId,
    connected: p.connected,
    strengths: p.strengths,
    friendId: p.friendId,
    clubId: p.clubId,
    situationHandCount: p.situationHand.length,
    experienceHandCount: p.experienceHand.length,
  }));

  const activeSituation: ActiveSituationView | null = state.activeSituation
    ? { cardId: state.activeSituation.cardId, helperId: state.activeSituation.helperId, math: combatMath(state) }
    : null;

  return {
    you: playerId,
    phase: state.phase,
    currentPlayerId: current.id,
    turn: state.turn,
    winnerId: state.winnerId,
    players,
    yourSituationHand: you ? you.situationHand : [],
    yourExperienceHand: you ? you.experienceHand : [],
    activeSituation,
    pendingHelp: state.pendingHelp,
    availableCharacters: state.availableCharacters,
    situationDeckCount: state.situationDeck.length,
    experienceDeckCount: state.experienceDeck.length,
    situationDiscardCount: state.situationDiscard.length,
    experienceDiscardCount: state.experienceDiscard.length,
    situationDiscardTop: state.situationDiscard[state.situationDiscard.length - 1] ?? null,
    experienceDiscardTop: state.experienceDiscard[state.experienceDiscard.length - 1] ?? null,
    log: state.log,
    legal: getLegalActions(state, playerId),
  };
}
