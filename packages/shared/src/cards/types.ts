// ─────────────────────────────────────────────────────────────────────────────
// CARD TYPES
//
// These are the *definitions* of every card. The actual card data lives in
// ./data/*.ts as plain editable arrays. To add real cards, edit those data files
// and (if needed) extend the interfaces here, the game engine never hardcodes
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
  | 'character'
  | 'support'
  | 'selfadvocacy';

/**
 * Data-driven effect descriptors. Card consequences / mess-up effects are arrays of
 * these; the engine's effect interpreter (engine/effects.ts) maps each to a state
 * change. Add a new variant here + a case in the interpreter to support new effects
 *, never write per-card logic.
 */
export type Effect =
  | { type: 'GAIN_LEVEL'; amount: number }
  | { type: 'LOSE_LEVEL'; amount: number }
  | { type: 'GAIN_EXPERIENCE'; amount: number }
  | { type: 'DISCARD_EXPERIENCE'; amount: number }
  | { type: 'DISCARD_SITUATION'; amount: number }
  | { type: 'LOSE_STRENGTH'; amount: number }
  | { type: 'LOSE_FRIEND' }
  | { type: 'LOSE_CLUB' }
  | { type: 'MODIFY_DIFFICULTY'; amount: number; barriers?: string[]; strengthIds?: string[]; supportIds?: string[]; selfAdvocacyIds?: string[] }
  | { type: 'IGNORE_BARRIER'; barriers: string[] }
  | { type: 'CANCEL_CONSEQUENCE'; consequenceTypes: Effect['type'][] }
  | { type: 'CHANGE_ENVIRONMENT'; removeBarriers: string[]; addBarriers?: string[] }
  | { type: 'ENABLE_ALTERNATIVE_SOLUTION'; solutionType: string; description: string }
  | { type: 'PREVENT_MESS_UP'; messUpIds: string[] }
  | { type: 'GRANT_SUPPORT_BONUS'; amount: number; condition: string }
  | { type: 'GRANT_TEAM_SUPPORT'; amount: number }
  | { type: 'DRAW_CARD'; deck: 'situation' | 'experience'; amount: number }
  | { type: 'REVEAL_SITUATION' }
  | { type: 'DISCOVER_STRENGTH'; options: string[] };

export interface BaseCard {
  id: CardId;
  /** Placeholder display name, replace with the real card name later. */
  name: string;
  /** Placeholder art label rendered by <PlaceholderCard>. Real art goes in later. */
  art: string;
}

/** Problems you solve to gain Levels and Experience (Situation deck). */
export interface SituationCard extends BaseCard {
  type: 'situation';
  /** Base difficulty the player's total must *exceed* to win. */
  baseDifficulty: number;
  /** Current modified difficulty (computed at runtime). */
  difficulty?: number;
  /** Awarded on success. `level` here CAN be the winning level. */
  reward: { level: number; experience: number };
  /** Applied to the loser on failure. */
  consequences: Effect[];
  /** Barriers present in this Situation (e.g., 'sensory', 'time-pressure', 'communication'). */
  barriers?: string[];
  /** Strength IDs that can reduce difficulty or provide alternative solutions. */
  validStrengths?: string[];
  /** Support IDs that can modify this Situation. */
  validSupports?: string[];
  /** Self-Advocacy IDs that can address barriers in this Situation. */
  validSelfAdvocacy?: string[];
  /** Environmental solutions (e.g., change setting, reduce noise). */
  environmentalSolutions?: Effect[];
  /** Whether teamwork/cooperation is allowed for this Situation. */
  teamworkAllowed?: boolean;
  /** Alternate solution paths beyond raw power comparison. */
  alternateSolutions?: Effect[];
  /** Optional flavor / future numeric hook. */
  enhancer?: string;
  /** @deprecated Use validStrengths instead. */
  strengthConnection?: string | string[];
}

/** Resolves immediately when drawn face-up (Situation deck). */
export interface MessUpCard extends BaseCard {
  type: 'messup';
  effects: Effect[];
  /** Barrier this Mess-Up represents, can be mitigated instead of always punished. */
  barrier?: string;
  /** Ways the player can mitigate the consequence (barrier types or card IDs). */
  mitigation?: {
    barrier: string;
    supports: string[];
    selfAdvocacy: string[];
    strengths: string[];
    friends: string[];
  };
  /** Small temporary penalty applied if NOT mitigated (never permanent loss). */
  unmitigated?: Effect[];
}

/** Your community, a persistent bonus while equipped (Situation deck). */
export interface ClubCard extends BaseCard {
  type: 'club';
  bonus: number;
  /** Community effects demonstrating how communities help find environments where strengths are useful. */
  communityEffects?: Effect[];
}

/** "Go Up A Level", instant non-winning level gain (Situation deck). */
export interface LevelUpCard extends BaseCard {
  type: 'levelup';
  amount: number;
  /** Flavor text emphasizing well-being rather than "becoming more capable." */
  wellBeingEffect?: string;
}

/** Permanent bonus while equipped (Experience deck). One of Gardner's intelligences. */
export interface StrengthCard extends BaseCard {
  type: 'strength';
  bonus: number;
  rank: number;
  intelligence: string;
  /** Contextual effects when this Strength is relevant to a Situation. */
  contextualEffects?: Effect[];
  /** Barrier types this Strength can address. */
  addressesBarriers?: string[];
}

/** Companion that adds a bonus in combat while equipped (Experience deck). */
export interface FriendCard extends BaseCard {
  type: 'friend';
  bonus: number;
  /** Co-regulation, collaboration, or social support effects. */
  supportEffects?: Effect[];
}

/** Support/Accommodation, tools, environmental changes, or strategies that remove barriers. */
export interface SupportCard extends BaseCard {
  type: 'support';
  /** Maximum 2 active supports per player. */
  effects: Effect[];
  /** Teaching/flavor text explaining the neurodiversity concept. */
  teachingText?: string;
}

/** Self-Advocacy, active skill of asking for appropriate supports. */
export interface SelfAdvocacyCard extends BaseCard {
  type: 'selfadvocacy';
  effects: Effect[];
  /** Teaching/flavor text. */
  teachingText?: string;
}

/** Permanent per-player identity; never discarded. Not in any deck. */
export interface CharacterCard extends BaseCard {
  type: 'character';
  /** Placeholder passive description. Numeric passive hooks can be added later. */
  passive: string;
  /** Male/female sides per spec; placeholder only. */
  side: 'a' | 'b';
  /** Ability effects that implement the character's passive. */
  abilityEffects?: Effect[];
}

export type Card =
  | SituationCard
  | MessUpCard
  | ClubCard
  | LevelUpCard
  | StrengthCard
  | FriendCard
  | CharacterCard
  | SupportCard
  | SelfAdvocacyCard;
