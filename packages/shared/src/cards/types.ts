// ─────────────────────────────────────────────────────────────────────────────
// CARD TYPES
//
// These are the *definitions* of every card. The actual card data lives in
// ./data/*.ts as plain editable arrays. To add real cards, edit those data files
// and (if needed) extend the interfaces here — the game engine never hardcodes
// individual cards, it reads these fields and interprets `Effect` descriptors.
// ─────────────────────────────────────────────────────────────────────────────

/** Identifier of a card *definition* (e.g. 'str-01'). */
export type CardId = string;

/**
 * Identifier of a specific card *instance* in play (e.g. 'str-01__12'). Decks may
 * contain multiple copies of the same definition, so the engine tracks instances.
 * Use `defIdOf(instanceId)` / `cardOf(instanceId)` (see ../cards/index.ts) to look
 * up the underlying definition.
 */
export type CardInstanceId = string;

export type CardType =
  | 'situation'
  | 'messup'
  | 'club'
  | 'levelup'
  | 'strength'
  | 'friend'
  | 'character';

/**
 * Data-driven effect descriptors. Card consequences / mess-up effects are arrays of
 * these; the engine's effect interpreter (engine/effects.ts) maps each to a state
 * change. Add a new variant here + a case in the interpreter to support new effects
 * — never write per-card logic.
 */
export type Effect =
  | { type: 'GAIN_LEVEL'; amount: number } // non-winning level gain (capped below TARGET_LEVEL)
  | { type: 'LOSE_LEVEL'; amount: number }
  | { type: 'GAIN_EXPERIENCE'; amount: number } // draw N experience cards
  | { type: 'DISCARD_EXPERIENCE'; amount: number }
  | { type: 'DISCARD_SITUATION'; amount: number }
  | { type: 'LOSE_STRENGTH'; amount: number }
  | { type: 'LOSE_FRIEND' }
  | { type: 'LOSE_CLUB' };

export interface BaseCard {
  id: CardId;
  /** Placeholder display name — replace with the real card name later. */
  name: string;
  /** Placeholder art label rendered by <PlaceholderCard>. Real art goes in later. */
  art: string;
}

/** Problems you solve to gain Levels and Experience (Situation deck). */
export interface SituationCard extends BaseCard {
  type: 'situation';
  /** Difficulty the player's total must *exceed* to win. */
  difficulty: number;
  /** Awarded on success. `level` here CAN be the winning level. */
  reward: { level: number; experience: number };
  /** Applied to the loser on failure. */
  consequences: Effect[];
  /** Optional flavor / future numeric hook ("what's different about this one"). */
  enhancer?: string;
}

/** Resolves immediately when drawn face-up (Situation deck). */
export interface MessUpCard extends BaseCard {
  type: 'messup';
  effects: Effect[];
}

/** Your community — a persistent bonus while equipped (Situation deck). */
export interface ClubCard extends BaseCard {
  type: 'club';
  bonus: number;
}

/** "Go Up A Level" — instant non-winning level gain (Situation deck). */
export interface LevelUpCard extends BaseCard {
  type: 'levelup';
  amount: number;
}

/** Permanent bonus while equipped (Experience deck). One of Gardner's intelligences. */
export interface StrengthCard extends BaseCard {
  type: 'strength';
  bonus: number;
  rank: number;
  intelligence: string;
}

/** Companion that adds a bonus in combat while equipped (Experience deck). */
export interface FriendCard extends BaseCard {
  type: 'friend';
  bonus: number;
}

/** Permanent per-player identity; never discarded. Not in any deck. */
export interface CharacterCard extends BaseCard {
  type: 'character';
  /** Placeholder passive description. Numeric passive hooks can be added later. */
  passive: string;
  /** Male/female sides per spec; placeholder only. */
  side: 'a' | 'b';
}

export type Card =
  | SituationCard
  | MessUpCard
  | ClubCard
  | LevelUpCard
  | StrengthCard
  | FriendCard
  | CharacterCard;
