import type { Effect } from '../cards/types.ts';
import { cardOf } from '../cards/index.ts';
import { TARGET_LEVEL, STARTING_LEVEL } from '../constants.ts';
import type { GameState, PlayerId } from './state.ts';
import { findPlayer } from './state.ts';
import { drawSituation, drawExperience } from './deck.ts';
import { updatePlayer, pushLog, assertNever } from './util.ts';

/**
 * Interpret a single data-driven Effect against a target player. This is the ONLY
 * place effects turn into state changes, cards never carry code. Add a new Effect
 * variant in cards/types.ts and a case here to extend the game.
 *
 * Difficulty-affecting effects (MODIFY_DIFFICULTY, IGNORE_BARRIER, CHANGE_ENVIRONMENT,
 * GRANT_*) are *contextual*: during combat they are computed by `combatMath` from the
 * active Situation's barriers and the player's active cards. Here they only carry
 * state when there is no active Situation (e.g. a Mess-Up's unmitigated penalty
 * becomes a temporary penalty for the next Situation).
 */
export function applyEffect(state: GameState, effect: Effect, targetId: PlayerId): GameState {
  const target = findPlayer(state, targetId);
  if (!target) return state;
  const name = target.name;

  switch (effect.type) {
    case 'GAIN_LEVEL': {
      // Non-winning level gain: capped strictly below TARGET_LEVEL.
      const capped = Math.max(target.level, Math.min(target.level + effect.amount, TARGET_LEVEL - 1));
      const gained = capped - target.level;
      const s = updatePlayer(state, targetId, (p) => ({ ...p, level: capped }));
      return pushLog(s, `${name} goes up ${gained} level(s) to ${capped}.`, targetId);
    }
    case 'LOSE_LEVEL': {
      const next = Math.max(STARTING_LEVEL, target.level - effect.amount);
      const lost = target.level - next;
      const s = updatePlayer(state, targetId, (p) => ({ ...p, level: next }));
      return pushLog(s, `${name} loses ${lost} level(s), now ${next}.`, targetId);
    }
    case 'GAIN_EXPERIENCE': {
      let s = state;
      let drawn = 0;
      for (let i = 0; i < effect.amount; i++) {
        const res = drawExperience(s);
        if (!res.card) break;
        const card = res.card;
        s = updatePlayer(res.state, targetId, (p) => ({
          ...p,
          experienceHand: [...p.experienceHand, card],
        }));
        drawn++;
      }
      return pushLog(s, `${name} draws ${drawn} Experience card(s).`, targetId);
    }
    case 'DISCARD_EXPERIENCE': {
      const n = Math.min(effect.amount, target.experienceHand.length);
      const s = updatePlayer(state, targetId, (p) => ({
        ...p,
        experienceHand: p.experienceHand.slice(0, p.experienceHand.length - n),
      }));
      return pushLog(s, `${name} discards ${n} Experience card(s).`, targetId);
    }
    case 'DISCARD_SITUATION': {
      const n = Math.min(effect.amount, target.situationHand.length);
      const s = updatePlayer(state, targetId, (p) => ({
        ...p,
        situationHand: p.situationHand.slice(0, p.situationHand.length - n),
      }));
      return pushLog(s, `${name} discards ${n} Situation card(s).`, targetId);
    }
    case 'LOSE_STRENGTH': {
      const n = Math.min(effect.amount, target.strengths.length);
      const s = updatePlayer(state, targetId, (p) => ({
        ...p,
        strengths: p.strengths.slice(0, p.strengths.length - n),
      }));
      return pushLog(s, `${name} loses ${n} Strength(s).`, targetId);
    }
    case 'LOSE_FRIEND': {
      if (!target.friendId) return pushLog(state, `${name} has no Friend to lose.`, targetId);
      const friendId = target.friendId;
      const s = updatePlayer(state, targetId, (p) => ({ ...p, friendId: null }));
      const label = cardOf(friendId)?.name ?? 'Friend';
      return pushLog(s, `${name} loses their Friend (${label}).`, targetId);
    }
    case 'LOSE_CLUB': {
      if (!target.clubId) return pushLog(state, `${name} has no Club to lose.`, targetId);
      const clubId = target.clubId;
      const s = updatePlayer(state, targetId, (p) => ({ ...p, clubId: null }));
      const label = cardOf(clubId)?.name ?? 'Club';
      return pushLog(s, `${name} loses their Club (${label}).`, targetId);
    }
    case 'MODIFY_DIFFICULTY': {
      // Negative amounts (reductions) are computed by combatMath from active cards.
      // Positive amounts become a temporary penalty applied to the next Situation.
      if (effect.amount <= 0) return state;
      const next = target.pendingPenalty + effect.amount;
      const s = updatePlayer(state, targetId, (p) => ({ ...p, pendingPenalty: next }));
      return pushLog(s, `${name} is under pressure. A temporary +${effect.amount} difficulty penalty applies to the next Situation.`, targetId);
    }
    case 'IGNORE_BARRIER':
    case 'CHANGE_ENVIRONMENT':
    case 'ENABLE_ALTERNATIVE_SOLUTION':
    case 'GRANT_SUPPORT_BONUS':
    case 'GRANT_TEAM_SUPPORT':
    case 'REVEAL_SITUATION':
    case 'DISCOVER_STRENGTH':
      // Contextual/declarative effects, resolved by combatMath or the reducer.
      return state;
    case 'CANCEL_CONSEQUENCE': {
      if (!state.activeSituation) return state;
      const active = state.activeSituation;
      const s = {
        ...state,
        activeSituation: {
          ...active,
          cancelledConsequences: [...new Set([...(active.cancelledConsequences ?? []), ...effect.consequenceTypes])],
        },
      };
      return pushLog(s, `${name} cancels ${effect.consequenceTypes.join(', ')} consequence(s).`, targetId);
    }
    case 'PREVENT_MESS_UP': {
      if (!state.activeMessUp) return state;
      if (!effect.messUpIds.includes(cardOf(state.activeMessUp)?.id ?? '')) return state;
      const prevented = cardOf(state.activeMessUp)?.name ?? 'a Mess-Up';
      const s = { ...state, activeMessUp: null };
      return pushLog(s, `${name}'s support prevented ${prevented}.`, targetId);
    }
    case 'DRAW_CARD': {
      let s = state;
      let drawn = 0;
      for (let i = 0; i < effect.amount; i++) {
        const res = effect.deck === 'situation' ? drawSituation(s) : drawExperience(s);
        if (!res.card) break;
        const card = res.card;
        if (effect.deck === 'situation') {
          s = updatePlayer(res.state, targetId, (p) => ({ ...p, situationHand: [...p.situationHand, card] }));
        } else {
          s = updatePlayer(res.state, targetId, (p) => ({ ...p, experienceHand: [...p.experienceHand, card] }));
        }
        drawn++;
      }
      return pushLog(s, `${name} draws ${drawn} ${effect.deck} card(s).`, targetId);
    }
    default:
      // Exhaustiveness guard, a new Effect variant must add a case above.
      return assertNever(effect);
  }
}

/** Apply a list of effects in order to the same target. */
export function applyEffects(state: GameState, effects: readonly Effect[], targetId: PlayerId): GameState {
  return effects.reduce((s, e) => applyEffect(s, e, targetId), state);
}