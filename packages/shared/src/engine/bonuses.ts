import { cardOf, defIdOf } from '../cards/index.ts';
import type { Effect, SituationCard } from '../cards/types.ts';
import type { GameState, PlayerState } from './state.ts';

/**
 * Contextual combat math for the strengths-based model.
 *
 * A Situation has a base difficulty and a set of barriers. Effective difficulty is
 * reduced by ANY valid approach the player brings to it, a relevant Strength, an
 * active Support, a Self-Advocacy card played this combat, a Friend, a Club, an
 * environmental change, or a character ability. There is never a single "correct"
 * answer; different approaches are useful in different contexts.
 */

/** Sum of equipped Strength + Friend + Club bonuses. */
export function equippedBonus(player: PlayerState): number {
  let bonus = 0;
  for (const sid of player.strengths) {
    const c = cardOf(sid);
    if (c?.type === 'strength') bonus += c.bonus;
  }
  if (player.friendId) {
    const c = cardOf(player.friendId);
    if (c?.type === 'friend') bonus += c.bonus;
  }
  if (player.clubId) {
    const c = cardOf(player.clubId);
    if (c?.type === 'club') bonus += c.bonus;
  }
  return bonus;
}

/** Get the set of active strength intelligence names for a player. */
export function getActiveStrengthIntelligences(player: PlayerState): string[] {
  const intelligences: string[] = [];
  for (const sid of player.strengths) {
    const c = cardOf(sid);
    if (c?.type === 'strength' && c.intelligence) {
      intelligences.push(c.intelligence);
    }
  }
  return intelligences;
}

/** Check if a player has a strength that matches the situation's connection. */
export function hasStrengthConnection(player: PlayerState, connection: string | string[] | undefined): boolean {
  if (!connection) return false;
  const connections = Array.isArray(connection) ? connection : [connection];
  const active = getActiveStrengthIntelligences(player);
  return connections.some((c) => active.includes(c));
}

/** A player's base problem-solving power for combat: equipped bonuses only (Level does not count). */
export function playerPower(player: PlayerState): number {
  return equippedBonus(player);
}

export interface ApproachReduction {
  label: string;
  kind: 'strength' | 'support' | 'selfadvocacy' | 'friend' | 'club' | 'environment' | 'character';
  amount: number;
}

export interface CombatMath {
  baseDifficulty: number;
  difficulty: number;
  tempPenalty: number;
  attackerPower: number;
  helperPower: number;
  teamBonus: number;
  total: number;
  wins: boolean;
  reductions: ApproachReduction[];
  barriers: string[];
  teamworkAllowed: boolean;
  usedStrengthIds: string[];
  usedSupportIds: string[];
  usedSelfAdvocacyIds: string[];
}

function barriersOverlap(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
  if (!a || !b) return false;
  return a.some((x) => b.includes(x));
}

/** First MODIFY_DIFFICULTY amount on a card's effects that targets a matching barrier. */
function matchingModifierAmount(effects: readonly Effect[] | undefined, situationBarriers: readonly string[]): number {
  if (!effects) return 0;
  for (const e of effects) {
    if (e.type === 'MODIFY_DIFFICULTY' && barriersOverlap(e.barriers, situationBarriers)) return e.amount;
  }
  return 0;
}

/** First MODIFY_DIFFICULTY amount on a card's effects (any barrier), used when the card is an explicitly valid approach. */
function modifierAmount(effects: readonly Effect[] | undefined): number {
  if (!effects) return 0;
  for (const e of effects) if (e.type === 'MODIFY_DIFFICULTY') return e.amount;
  return 0;
}

/** Count barriers this card's IGNORE_BARRIER / CHANGE_ENVIRONMENT effects would remove. */
function removedBarrierCount(effects: readonly Effect[] | undefined, situationBarriers: readonly string[]): number {
  if (!effects) return 0;
  let n = 0;
  for (const e of effects) {
    if (e.type === 'IGNORE_BARRIER') n += e.barriers.filter((b) => situationBarriers.includes(b)).length;
    if (e.type === 'CHANGE_ENVIRONMENT') n += (e.removeBarriers ?? []).filter((b) => situationBarriers.includes(b)).length;
  }
  return n;
}

/** Does this card's effects include a GRANT_TEAM_SUPPORT contribution? */
function teamSupportOf(effects: readonly Effect[] | undefined): number {
  if (!effects) return 0;
  let n = 0;
  for (const e of effects) if (e.type === 'GRANT_TEAM_SUPPORT') n += e.amount;
  return n;
}

/** Does the card provide a contextual power bonus given the current Situation? */
function grantBonusOf(effects: readonly Effect[] | undefined, situation: SituationCard, state: GameState, player: PlayerState): number {
  if (!effects) return 0;
  let n = 0;
  for (const e of effects) {
    if (e.type !== 'GRANT_SUPPORT_BONUS') continue;
    if (grantBonusApplies(e.condition, situation, state, player)) n += e.amount;
  }
  return n;
}

function grantBonusApplies(condition: string, situation: SituationCard, state: GameState, player: PlayerState): boolean {
  const b = situation.barriers ?? [];
  switch (condition) {
    case 'strength-match':
      // A relevant Strength is already reducing this Situation.
      return (situation.validStrengths ?? []).some((s) => player.strengths.map(defIdOf).includes(s));
    case 'movement-break':
    case 'movement-regulation':
      return b.some((x) => ['movement', 'physical-regulation', 'sensory-regulation', 'burnout', 'stress', 'time-pressure'].includes(x)) ||
        (situation.validSupports ?? []).includes('sup-06');
    case 'self-advocacy':
      return (situation.validSelfAdvocacy ?? []).length > 0 || player.clubId === 'club-05';
    case 'burnout-stress':
      return b.some((x) => ['burnout', 'stress', 'anxiety', 'anticipation'].includes(x));
    default:
      return false;
  }
}

function baseDifficultyOf(situation: SituationCard): number {
  return situation.baseDifficulty ?? situation.difficulty ?? 0;
}

/** Compute the current combat outcome for the active Situation. */
export function combatMath(state: GameState): CombatMath | null {
  const active = state.activeSituation;
  if (!active) return null;
  const situation = cardOf(active.cardId);
  if (situation?.type !== 'situation') return null;

  const attacker = state.players[state.currentPlayerIndex];
  if (!attacker) return null;
  let helper: PlayerState | null = null;
  if (active.helperId) helper = state.players.find((p) => p.id === active.helperId) ?? null;

  const barriers = situation.barriers ?? [];
  const reductions: ApproachReduction[] = [];
  let teamBonus = 0;
  let attackerGrant = 0;
  let helperGrant = 0;

  /** Apply the contextual effects of one of a player's equipped cards. */
  const collectCard = (
    player: PlayerState,
    instanceId: string,
    label: string,
    kind: ApproachReduction['kind'],
    effects: readonly Effect[] | undefined,
    explicitlyValid = false,
  ) => {
    const mod = explicitlyValid ? modifierAmount(effects) || -2 : matchingModifierAmount(effects, barriers);
    const removed = explicitlyValid ? 0 : removedBarrierCount(effects, barriers);
    if (mod !== 0 || removed > 0) {
      reductions.push({ label, kind, amount: mod + removed });
    }
    teamBonus += teamSupportOf(effects);
    if (player.id === attacker.id) attackerGrant += grantBonusOf(effects, situation, state, player);
    else if (helper && player.id === helper.id) helperGrant += grantBonusOf(effects, situation, state, player);
  };

  const usedStrengthIds: string[] = [];
  const usedSupportIds: string[] = [];
  const usedSelfAdvocacyIds: string[] = [];

  // Equipped Strengths, valuable only when they fit the Situation's valid approaches.
  for (const sid of attacker.strengths) {
    const c = cardOf(sid);
    if (c?.type !== 'strength') continue;
    const defId = defIdOf(sid);
    if (situation.validStrengths?.includes(defId)) {
      collectCard(attacker, sid, c.name, 'strength', c.contextualEffects, true);
      usedStrengthIds.push(sid);
    }
  }

  // Active Supports, the spec's central mechanic: they change the conditions.
  for (const sid of attacker.supports) {
    const c = cardOf(sid);
    if (c?.type !== 'support') continue;
    const defId = defIdOf(sid);
    if (situation.validSupports?.includes(defId)) {
      collectCard(attacker, sid, c.name, 'support', c.effects, true);
      usedSupportIds.push(sid);
    }
  }

  // Self-Advocacy cards played during this combat, asking for a support is a skill.
  for (const sid of active.selfAdvocacyPlayed ?? []) {
    const c = cardOf(sid);
    if (c?.type !== 'selfadvocacy') continue;
    const defId = defIdOf(sid);
    if (situation.validSelfAdvocacy?.includes(defId)) {
      collectCard(attacker, sid, c.name, 'selfadvocacy', c.effects, true);
      usedSelfAdvocacyIds.push(sid);
    }
  }

  // Friend support effects.
  if (attacker.friendId) {
    const c = cardOf(attacker.friendId);
    if (c?.type === 'friend') collectCard(attacker, attacker.friendId, c.name, 'friend', c.supportEffects);
  }

  // Club community effects.
  if (attacker.clubId) {
    const c = cardOf(attacker.clubId);
    if (c?.type === 'club') collectCard(attacker, attacker.clubId, c.name, 'club', c.communityEffects);
  }

  // Character ability.
  if (attacker.characterId) {
    const c = cardOf(attacker.characterId);
    if (c?.type === 'character') collectCard(attacker, attacker.characterId, c.name, 'character', c.abilityEffects);
  }

  // The helper contributes their own valid approaches + power.
  if (helper) {
    for (const sid of helper.strengths) {
      const c = cardOf(sid);
      if (c?.type !== 'strength') continue;
      const defId = defIdOf(sid);
      if (situation.validStrengths?.includes(defId)) collectCard(helper, sid, `${c.name} (helper)`, 'strength', c.contextualEffects, true);
    }
    for (const sid of helper.supports) {
      const c = cardOf(sid);
      if (c?.type !== 'support') continue;
      const defId = defIdOf(sid);
      if (situation.validSupports?.includes(defId)) collectCard(helper, sid, `${c.name} (helper)`, 'support', c.effects, true);
    }
    for (const sid of active.selfAdvocacyPlayed ?? []) {
      const c = cardOf(sid);
      if (c?.type !== 'selfadvocacy') continue;
      if (situation.validSelfAdvocacy?.includes(defIdOf(sid))) collectCard(helper, sid, `${c.name} (helper)`, 'selfadvocacy', c.effects, true);
    }
    if (helper.friendId) {
      const c = cardOf(helper.friendId);
      if (c?.type === 'friend') collectCard(helper, helper.friendId, `${c.name} (helper)`, 'friend', c.supportEffects);
    }
    if (helper.clubId) {
      const c = cardOf(helper.clubId);
      if (c?.type === 'club') collectCard(helper, helper.clubId, `${c.name} (helper)`, 'club', c.communityEffects);
    }
  }

  const tempPenalty = active.tempPenalty ?? 0;
  const reductionSum = reductions.reduce((n, r) => n + r.amount, 0);
  const difficulty = Math.max(0, baseDifficultyOf(situation) + tempPenalty + reductionSum);

  const attackerPower = playerPower(attacker) + attackerGrant;
  const helperPower = (helper ? playerPower(helper) : 0) + helperGrant;
  const total = attackerPower + helperPower + teamBonus;

  return {
    baseDifficulty: baseDifficultyOf(situation),
    difficulty,
    tempPenalty,
    attackerPower,
    helperPower,
    teamBonus,
    total,
    wins: total >= difficulty,
    reductions,
    barriers,
    teamworkAllowed: situation.teamworkAllowed ?? false,
    usedStrengthIds,
    usedSupportIds,
    usedSelfAdvocacyIds,
  };
}