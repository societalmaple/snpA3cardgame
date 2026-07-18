import type { Effect } from '../cards/types.ts';
import { cardOf } from '../cards/index.ts';
import { TARGET_LEVEL, STARTING_LEVEL } from '../constants.ts';
import type { GameState, PlayerId } from './state.ts';
import { findPlayer } from './state.ts';
import { drawExperience } from './deck.ts';
import { updatePlayer, pushLog, assertNever } from './util.ts';

/**
 * Interpret a single data-driven Effect against a target player. This is the ONLY
 * place effects turn into state changes — cards never carry code. Add a new Effect
 * variant in cards/types.ts and a case here to extend the game.
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
      const removed = target.experienceHand.slice(target.experienceHand.length - n);
      const s = updatePlayer(state, targetId, (p) => ({
        ...p,
        experienceHand: p.experienceHand.slice(0, p.experienceHand.length - n),
      }));
      return pushLog(
        { ...s, experienceDiscard: [...s.experienceDiscard, ...removed] },
        `${name} discards ${n} Experience card(s).`,
        targetId,
      );
    }
    case 'DISCARD_SITUATION': {
      const n = Math.min(effect.amount, target.situationHand.length);
      const removed = target.situationHand.slice(target.situationHand.length - n);
      const s = updatePlayer(state, targetId, (p) => ({
        ...p,
        situationHand: p.situationHand.slice(0, p.situationHand.length - n),
      }));
      return pushLog(
        { ...s, situationDiscard: [...s.situationDiscard, ...removed] },
        `${name} discards ${n} Situation card(s).`,
        targetId,
      );
    }
    case 'LOSE_STRENGTH': {
      const n = Math.min(effect.amount, target.strengths.length);
      const removed = target.strengths.slice(target.strengths.length - n);
      const s = updatePlayer(state, targetId, (p) => ({
        ...p,
        strengths: p.strengths.slice(0, p.strengths.length - n),
      }));
      return pushLog(
        { ...s, experienceDiscard: [...s.experienceDiscard, ...removed] },
        `${name} loses ${n} Strength(s).`,
        targetId,
      );
    }
    case 'LOSE_FRIEND': {
      if (!target.friendId) return pushLog(state, `${name} has no Friend to lose.`, targetId);
      const friendId = target.friendId;
      const s = updatePlayer(state, targetId, (p) => ({ ...p, friendId: null }));
      const label = cardOf(friendId)?.name ?? 'Friend';
      return pushLog(
        { ...s, experienceDiscard: [...s.experienceDiscard, friendId] },
        `${name} loses their Friend (${label}).`,
        targetId,
      );
    }
    case 'LOSE_CLUB': {
      if (!target.clubId) return pushLog(state, `${name} has no Club to lose.`, targetId);
      const clubId = target.clubId;
      const s = updatePlayer(state, targetId, (p) => ({ ...p, clubId: null }));
      const label = cardOf(clubId)?.name ?? 'Club';
      return pushLog(
        { ...s, situationDiscard: [...s.situationDiscard, clubId] },
        `${name} loses their Club (${label}).`,
        targetId,
      );
    }
    default:
      // Exhaustiveness guard — a new Effect variant must add a case above.
      return assertNever(effect);
  }
}

/** Apply a list of effects in order to the same target. */
export function applyEffects(state: GameState, effects: readonly Effect[], targetId: PlayerId): GameState {
  return effects.reduce((s, e) => applyEffect(s, e, targetId), state);
}
