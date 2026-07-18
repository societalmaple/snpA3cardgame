import { cardOf } from '../cards/index.ts';
import type { GameState, PlayerState } from './state.ts';

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

/** A player's problem-solving power for combat: equipped bonuses only (Level does not count). */
export function playerPower(player: PlayerState): number {
  return equippedBonus(player);
}

export interface CombatMath {
  difficulty: number;
  attackerPower: number;
  helperPower: number;
  total: number;
  wins: boolean;
}

/** Compute the current combat outcome for the active Situation. */
export function combatMath(state: GameState): CombatMath | null {
  const active = state.activeSituation;
  if (!active) return null;
  const situation = cardOf(active.cardId);
  if (situation?.type !== 'situation') return null;

  const attacker = state.players[state.currentPlayerIndex];
  const attackerPower = attacker ? playerPower(attacker) : 0;

  let helperPower = 0;
  if (active.helperId) {
    const helper = state.players.find((p) => p.id === active.helperId);
    if (helper) helperPower = playerPower(helper);
  }

  const total = attackerPower + helperPower;
  return {
    difficulty: situation.difficulty,
    attackerPower,
    helperPower,
    total,
    wins: total >= situation.difficulty,
  };
}
