import type { CardInstanceId } from '../cards/types.ts';
import { cardOf, defIdOf, selfAdvocacyForMessUp } from '../cards/index.ts';
import { TARGET_LEVEL, HAND_LIMIT, MAX_SUPPORTS } from '../constants.ts';
import type { Effect } from '../cards/types.ts';
import type { GameState, PlayerId, PlayerState, Phase } from './state.ts';
import { currentPlayer, findPlayer } from './state.ts';
import { combatMath } from './bonuses.ts';
import { applyEffect, applyEffects } from './effects.ts';
import { drawSituation, drawExperience } from './deck.ts';
import { updatePlayer, pushLog, removeFirst, assertNever } from './util.ts';

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS, the only ways to mutate game state. Every action names its `playerId`
// so the server can verify the sender. `applyAction` validates fully and returns a
// Result (never throws on illegal input), so the server can reject cleanly.
// ─────────────────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'CHOOSE_CHARACTER'; playerId: PlayerId; characterId: CardInstanceId }
  | { type: 'DRAW_SITUATION'; playerId: PlayerId }
  | { type: 'PLAY_SITUATION_FROM_HAND'; playerId: PlayerId; cardId: CardInstanceId }
  | { type: 'PLAY_CARD'; playerId: PlayerId; cardId: CardInstanceId }
  | { type: 'ASK_FOR_HELP'; playerId: PlayerId; helperId: PlayerId; offeredExperience: number }
  | { type: 'RESPOND_TO_HELP'; playerId: PlayerId; accept: boolean }
  | { type: 'RESOLVE_COMBAT'; playerId: PlayerId }
  | { type: 'RESOLVE_MESS_UP'; playerId: PlayerId; cardId: CardInstanceId | null }
  | { type: 'DISCARD_CARD'; playerId: PlayerId; cardId: CardInstanceId }
  | { type: 'UNEQUIP_CARD'; playerId: PlayerId; cardId: CardInstanceId }
  | { type: 'END_TURN'; playerId: PlayerId };

export type ActionType = Action['type'];

export type ReduceResult = { ok: true; state: GameState } | { ok: false; error: string };

const fail = (error: string): ReduceResult => ({ ok: false, error });
const done = (state: GameState): ReduceResult => ({ ok: true, state });

/** Draw N experience cards to a player, threading rng/deck state. */
function drawExperienceTo(state: GameState, playerId: PlayerId, n: number): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    const r = drawExperience(s);
    if (!r.card) {
      s = r.state;
      break;
    }
    const card = r.card;
    s = updatePlayer(r.state, playerId, (p) => ({ ...p, experienceHand: [...p.experienceHand, card] }));
  }
  return s;
}

/** Total cards a player holds across both hands. */
function handSize(p: PlayerState): number {
  return p.situationHand.length + p.experienceHand.length;
}

/** All currently-equipped card instances (strengths, friend, club, supports). */
function equippedCards(p: PlayerState): CardInstanceId[] {
  return [...p.strengths, ...(p.friendId ? [p.friendId] : []), ...(p.clubId ? [p.clubId] : []), ...p.supports];
}

/**
 * Cards a player may discard to satisfy a forced-discard consequence, includes
 * equipped cards, so a "discard experience" hit can be paid with an equipped Strength
 * or Support.
 */
function discardCandidates(p: PlayerState, pool: 'experience' | 'situation' | 'any'): CardInstanceId[] {
  const experience = [...p.experienceHand, ...p.strengths, ...p.supports, ...(p.friendId ? [p.friendId] : []), ...(p.clubId ? [p.clubId] : [])];
  const situation = [...p.situationHand];
  if (pool === 'experience') return experience;
  if (pool === 'situation') return situation;
  return [...experience, ...situation];
}

/** Remove one owned card (hand or equipped). Decks are infinite, so gone is gone. */
function removeCard(state: GameState, playerId: PlayerId, cardId: CardInstanceId): GameState {
  return updatePlayer(state, playerId, (p) => {
    if (p.experienceHand.includes(cardId)) return { ...p, experienceHand: removeFirst(p.experienceHand, cardId) };
    if (p.situationHand.includes(cardId)) return { ...p, situationHand: removeFirst(p.situationHand, cardId) };
    if (p.strengths.includes(cardId)) return { ...p, strengths: removeFirst(p.strengths, cardId) };
    if (p.supports.includes(cardId)) return { ...p, supports: removeFirst(p.supports, cardId) };
    if (p.friendId === cardId) return { ...p, friendId: null };
    if (p.clubId === cardId) return { ...p, clubId: null };
    return p;
  });
}

/** Cards the current player may use to mitigate the active Mess-Up. */
function messUpMitigationOptions(state: GameState, playerId: PlayerId): CardInstanceId[] {
  const p = findPlayer(state, playerId);
  if (!p || !state.activeMessUp) return [];
  const messup = cardOf(state.activeMessUp);
  if (messup?.type !== 'messup' || !messup.mitigation) return [];
  const mit = messup.mitigation;
  const opts: CardInstanceId[] = [];
  for (const sid of p.supports) if (mit.supports.includes(defIdOf(sid))) opts.push(sid);
  for (const id of p.experienceHand) {
    const c = cardOf(id);
    if (c?.type === 'selfadvocacy' && selfAdvocacyForMessUp(messup).includes(defIdOf(id))) opts.push(id);
  }
  for (const sid of p.strengths) if (mit.strengths.includes(defIdOf(sid))) opts.push(sid);
  if (p.friendId && mit.friends.includes(defIdOf(p.friendId))) opts.push(p.friendId);
  return opts;
}

/** Does an active Support automatically prevent this Mess-Up? */
function autoPreventedMessUp(state: GameState, playerId: PlayerId, messUpDefId: string): boolean {
  const p = findPlayer(state, playerId);
  if (!p) return false;
  for (const sid of p.supports) {
    const c = cardOf(sid);
    if (c?.type !== 'support') continue;
    for (const e of c.effects) {
      if (e.type === 'PREVENT_MESS_UP' && e.messUpIds.includes(messUpDefId)) return true;
    }
  }
  return false;
}

/** Start a Situation, carrying any temporary penalty into the combat math. */
function startSituation(state: GameState, cardId: CardInstanceId, fromDeck: boolean): GameState {
  const cur = currentPlayer(state);
  const tempPenalty = cur.pendingPenalty;
  const s = updatePlayer(state, cur.id, (p) => ({ ...p, pendingPenalty: 0 }));
  return {
    ...s,
    activeSituation: {
      cardId,
      fromDeck,
      helperId: null,
      helperOfferedExperience: 0,
      selfAdvocacyPlayed: [],
      cancelledConsequences: [],
      tempPenalty,
    },
    phase: 'combat',
    turnFlags: { enteredCombatThisTurn: true },
  };
}

/** Does a Self-Advocacy card legitimately fit the active Situation's barriers? */
function selfAdvocacyFitsSituation(cardId: CardInstanceId, active: GameState['activeSituation']): boolean {
  if (!active) return false;
  const c = cardOf(cardId);
  if (c?.type !== 'selfadvocacy') return false;
  const situation = cardOf(active.cardId);
  if (situation?.type !== 'situation') return false;
  if (situation.validSelfAdvocacy?.includes(defIdOf(cardId))) return true;
  const barriers = situation.barriers ?? [];
  for (const e of c.effects) {
    if (e.type === 'MODIFY_DIFFICULTY' && (e.barriers ?? []).some((b) => barriers.includes(b))) return true;
    if (e.type === 'IGNORE_BARRIER' && e.barriers.some((b) => barriers.includes(b))) return true;
  }
  return false;
}

/**
 * Apply a card's consequences/effects. Non-discard effects resolve immediately;
 * "discard N card(s)" effects become an interactive obligation so the player picks
 * what to lose (from hand or equipped), routing through the `discard` phase.
 */
function applyConsequences(state: GameState, effects: readonly Effect[], playerId: PlayerId, resumePhase: Phase): GameState {
  const isDiscard = (e: Effect) => e.type === 'DISCARD_EXPERIENCE' || e.type === 'DISCARD_SITUATION';
  const immediate = effects.filter((e) => !isDiscard(e));
  const discards = effects.filter(isDiscard);
  let s = applyEffects(state, immediate, playerId);

  if (discards.length > 0) {
    const count = discards.reduce((n, e) => n + ('amount' in e ? e.amount : 0), 0);
    const hasExp = discards.some((e) => e.type === 'DISCARD_EXPERIENCE');
    const hasSit = discards.some((e) => e.type === 'DISCARD_SITUATION');
    const pool = hasExp && hasSit ? 'any' : hasExp ? 'experience' : 'situation';
    const player = findPlayer(s, playerId)!;
    const need = Math.min(count, discardCandidates(player, pool).length);
    if (need > 0) {
      s = { ...s, phase: 'discard', discardTask: { kind: 'count', remaining: need, pool }, resumeAfterDiscard: resumePhase };
      return pushLog(s, `${player.name} must discard ${need} card(s) from hand or equipped.`, playerId);
    }
  }
  return { ...s, phase: resumePhase, resumeAfterDiscard: null, discardTask: null };
}

/**
 * After a draw, route to the discard phase if the (current) player is over the hand
 * limit, otherwise continue to `resumePhase`. The player picks what to discard, so
 * they can keep a freshly drawn card by ditching an older one.
 */
function withHandLimit(state: GameState, playerId: PlayerId, resumePhase: Phase): GameState {
  const p = findPlayer(state, playerId);
  if (p && handSize(p) > HAND_LIMIT) {
    return pushLog(
      { ...state, phase: 'discard', discardTask: { kind: 'limit' }, resumeAfterDiscard: resumePhase },
      `${p.name} is over the hand limit (${handSize(p)}/${HAND_LIMIT}). Discard down to ${HAND_LIMIT}.`,
      playerId,
    );
  }
  return { ...state, phase: resumePhase, resumeAfterDiscard: null, discardTask: null };
}

/** Advance to the next connected player and reset per-turn state. */
function advanceTurn(state: GameState): GameState {
  const n = state.players.length;
  let nextIndex = (state.currentPlayerIndex + 1) % n;
  for (let guard = 0; guard < n && !state.players[nextIndex]!.connected; guard++) {
    nextIndex = (nextIndex + 1) % n;
  }
  return {
    ...state,
    currentPlayerIndex: nextIndex,
    turn: state.turn + 1,
    phase: 'await_action',
    activeSituation: null,
    activeMessUp: null,
    pendingHelp: null,
    resumeAfterDiscard: null,
    discardTask: null,
    turnFlags: { enteredCombatThisTurn: false },
  };
}

export function applyAction(state: GameState, action: Action): ReduceResult {
  if (state.phase === 'game_over') return fail('The game is over.');

  const cur = currentPlayer(state);
  const isCurrent = cur.id === action.playerId;

  switch (action.type) {
    case 'CHOOSE_CHARACTER': {
      if (state.phase !== 'character_select') return fail('Characters are not being chosen right now.');
      const player = findPlayer(state, action.playerId);
      if (!player) return fail('No such player.');
      if (player.characterId) return fail('You already chose a character.');
      if (!state.availableCharacters.includes(action.characterId)) return fail('That character is taken.');

      let s = updatePlayer(state, action.playerId, (p) => ({ ...p, characterId: action.characterId }));
      s = { ...s, availableCharacters: state.availableCharacters.filter((id) => id !== action.characterId) };
      s = pushLog(s, `${player.name} chose ${cardOf(action.characterId)?.name ?? 'a character'}.`, action.playerId);

      if (s.players.every((p) => p.characterId !== null)) {
        const first = s.players[0]!;
        s = { ...s, phase: 'await_action', currentPlayerIndex: 0, turn: 1 };
        s = pushLog(s, `Everyone has chosen. ${first.name} goes first.`, first.id);
      }
      return done(s);
    }

    case 'DRAW_SITUATION': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'await_action') return fail('You can only draw at the start of your turn.');

      const draw = drawSituation(state);
      if (!draw.card) return fail('Situation deck is empty.');
      const drawnId = draw.card;
      const card = cardOf(drawnId);
      if (!card) return fail('Unknown card drawn.');
      let s = draw.state;

      switch (card.type) {
        case 'situation': {
          s = pushLog(s, `${cur.name} faces ${card.name} (difficulty ${card.baseDifficulty ?? card.difficulty}).`, cur.id);
          return done(startSituation(s, drawnId, true));
        }
        case 'messup': {
          s = pushLog(s, `${cur.name} drew a Mess-Up: ${card.name}. ${card.barrier ?? ''}`, cur.id);
          s = { ...s, activeMessUp: drawnId };

          // An active Support may automatically prevent certain Mess-Ups.
          if (autoPreventedMessUp(s, cur.id, card.id)) {
            const prevented = card.name;
            s = pushLog(s, `A Support prevented ${prevented}.`, cur.id);
            return done({ ...s, activeMessUp: null, phase: 'main' });
          }

          // Otherwise the player may mitigate with a Support / Self-Advocacy /
          // Strength / Friend, or accept a small temporary penalty.
          if (messUpMitigationOptions(s, cur.id).length > 0) {
            return done({ ...s, phase: 'messup' });
          }
          s = applyEffects(s, card.unmitigated ?? [], cur.id);
          return done({ ...s, activeMessUp: null, phase: 'main' });
        }
        case 'levelup': {
          s = updatePlayer(s, cur.id, (p) => ({ ...p, situationHand: [...p.situationHand, drawnId] }));
          s = pushLog(s, `${cur.name} drew ${card.name} into their hand.`, cur.id);
          return done(withHandLimit(s, cur.id, 'main'));
        }
        default: {
          // Strengths/Friends/Characters never belong in the Situation pool; drop defensively.
          return done({ ...s, phase: 'main' });
        }
      }
    }

    case 'PLAY_SITUATION_FROM_HAND': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'await_action') return fail('You can only start a Situation at the start of your turn.');
      if (!cur.situationHand.includes(action.cardId)) return fail('That card is not in your hand.');
      const card = cardOf(action.cardId);
      if (card?.type !== 'situation') return fail('That card is not a Situation.');

      let s = updatePlayer(state, cur.id, (p) => ({ ...p, situationHand: removeFirst(p.situationHand, action.cardId) }));
      s = pushLog(s, `${cur.name} takes on ${card.name} (difficulty ${card.baseDifficulty ?? card.difficulty}).`, cur.id);
      return done(startSituation(s, action.cardId, false));
    }

    case 'PLAY_CARD': {
      const isHelper = state.phase === 'combat' && state.activeSituation?.helperId === action.playerId;
      if (!isCurrent && !isHelper) return fail('Not your turn.');
      if (state.phase !== 'combat' && state.phase !== 'main') {
        return fail('You can only play cards during combat or your main phase.');
      }
      const actingPlayer = findPlayer(state, action.playerId)!;
      const card = cardOf(action.cardId);
      if (!card) return fail('Unknown card.');

      switch (card.type) {
        case 'strength': {
          if (!actingPlayer.experienceHand.includes(action.cardId)) return fail('That Strength is not in your hand.');
          const s = updatePlayer(state, action.playerId, (p) => ({
            ...p,
            experienceHand: removeFirst(p.experienceHand, action.cardId),
            strengths: [...p.strengths, action.cardId],
          }));
          return done(pushLog(s, `${actingPlayer.name} equips ${card.name} (+${card.bonus}).`, action.playerId));
        }
        case 'support': {
          if (!actingPlayer.experienceHand.includes(action.cardId)) return fail('That Support is not in your hand.');
          if (actingPlayer.supports.length >= MAX_SUPPORTS) return fail(`You can have at most ${MAX_SUPPORTS} active Supports.`);
          const s = updatePlayer(state, action.playerId, (p) => ({
            ...p,
            experienceHand: removeFirst(p.experienceHand, action.cardId),
            supports: [...p.supports, action.cardId],
          }));
          return done(pushLog(s, `${actingPlayer.name} activates Support ${card.name}.`, action.playerId));
        }
        case 'selfadvocacy': {
          if (state.phase !== 'combat') return fail('Self-Advocacy cards can only be used while facing a Situation.');
          if (!actingPlayer.experienceHand.includes(action.cardId)) return fail('That Self-Advocacy card is not in your hand.');
          if (!selfAdvocacyFitsSituation(action.cardId, state.activeSituation)) {
            return fail('That Self-Advocacy card does not address this Situation\'s barriers.');
          }
          let s = updatePlayer(state, action.playerId, (p) => ({
            ...p,
            experienceHand: removeFirst(p.experienceHand, action.cardId),
          }));
          const active = s.activeSituation!;
          const cancelled = card.effects
            .filter((e): e is Extract<Effect, { type: 'CANCEL_CONSEQUENCE' }> => e.type === 'CANCEL_CONSEQUENCE')
            .flatMap((e) => e.consequenceTypes);
          s = {
            ...s,
            activeSituation: {
              ...active,
              selfAdvocacyPlayed: [...(active.selfAdvocacyPlayed ?? []), action.cardId],
              cancelledConsequences: [...new Set([...(active.cancelledConsequences ?? []), ...cancelled])],
            },
          };
          return done(pushLog(s, `${actingPlayer.name} uses self-advocacy: "${card.name}".`, action.playerId));
        }
        case 'friend': {
          if (!actingPlayer.experienceHand.includes(action.cardId)) return fail('That Friend is not in your hand.');
          if (actingPlayer.friendId) return fail('You already have a Friend equipped (max 1).');
          const s = updatePlayer(state, action.playerId, (p) => ({
            ...p,
            experienceHand: removeFirst(p.experienceHand, action.cardId),
            friendId: action.cardId,
          }));
          return done(pushLog(s, `${actingPlayer.name} brings in Friend ${card.name} (+${card.bonus}).`, action.playerId));
        }
        case 'club': {
          if (!actingPlayer.experienceHand.includes(action.cardId)) return fail('That Club is not in your hand.');
          if (actingPlayer.clubId) return fail('You already have a Club (max 1).');
          const s = updatePlayer(state, action.playerId, (p) => ({
            ...p,
            experienceHand: removeFirst(p.experienceHand, action.cardId),
            clubId: action.cardId,
          }));
          return done(pushLog(s, `${actingPlayer.name} joins Club ${card.name} (+${card.bonus}).`, action.playerId));
        }
        case 'levelup': {
          if (!actingPlayer.situationHand.includes(action.cardId)) return fail('That card is not in your hand.');
          let s = updatePlayer(state, action.playerId, (p) => ({ ...p, situationHand: removeFirst(p.situationHand, action.cardId) }));
          s = applyEffect(s, { type: 'GAIN_LEVEL', amount: card.amount }, action.playerId);
          return done(s);
        }
        default:
          return fail('That card cannot be played this way.');
      }
    }

    case 'UNEQUIP_CARD': {
      const isHelper = state.phase === 'combat' && state.activeSituation?.helperId === action.playerId;
      if (!isCurrent && !isHelper) return fail('Not your turn.');
      if (state.phase !== 'combat' && state.phase !== 'main') {
        return fail('You can only unequip during combat or your main phase.');
      }
      const actingPlayer = findPlayer(state, action.playerId)!;
      const isStrength = actingPlayer.strengths.includes(action.cardId);
      const isFriend = actingPlayer.friendId === action.cardId;
      const isClub = actingPlayer.clubId === action.cardId;
      const isSupport = actingPlayer.supports.includes(action.cardId);
      if (!isStrength && !isFriend && !isClub && !isSupport) return fail('That card is not equipped.');
      if (handSize(actingPlayer) >= HAND_LIMIT) return fail('Your hand is full. Make room before unequipping.');
      const card = cardOf(action.cardId);

      let s: GameState;
      if (isStrength) {
        s = updatePlayer(state, action.playerId, (p) => ({
          ...p,
          strengths: removeFirst(p.strengths, action.cardId),
          experienceHand: [...p.experienceHand, action.cardId],
        }));
      } else if (isFriend) {
        s = updatePlayer(state, action.playerId, (p) => ({ ...p, friendId: null, experienceHand: [...p.experienceHand, action.cardId] }));
      } else if (isSupport) {
        s = updatePlayer(state, action.playerId, (p) => ({
          ...p,
          supports: removeFirst(p.supports, action.cardId),
          experienceHand: [...p.experienceHand, action.cardId],
        }));
      } else if (isClub) {
        // A Club returns to the Experience hand (Clubs are Experience cards).
        s = updatePlayer(state, action.playerId, (p) => ({ ...p, clubId: null, experienceHand: [...p.experienceHand, action.cardId] }));
      } else {
        return fail('That card is not equipped.');
      }
      return done(pushLog(s, `${actingPlayer.name} unequips ${card?.name ?? 'a card'}.`, action.playerId));
    }

    case 'ASK_FOR_HELP': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'combat') return fail('You can only ask for help during combat.');
      if (!state.activeSituation) return fail('No active Situation.');
      if (state.activeSituation.helperId) return fail('You already have a helper.');
      if (action.helperId === action.playerId) return fail('You cannot ask yourself.');
      if (action.offeredExperience < 0) return fail('Offer cannot be negative.');
      const helper = findPlayer(state, action.helperId);
      if (!helper) return fail('No such player.');

      const s: GameState = {
        ...state,
        phase: 'await_help',
        pendingHelp: { requesterId: action.playerId, helperId: action.helperId, offeredExperience: action.offeredExperience },
      };
      return done(pushLog(s, `${cur.name} asks ${helper.name} for help (offering ${action.offeredExperience} Experience).`, action.playerId));
    }

    case 'RESPOND_TO_HELP': {
      if (state.phase !== 'await_help' || !state.pendingHelp) return fail('No help request pending.');
      if (action.playerId !== state.pendingHelp.helperId) return fail('This help request is not for you.');
      const ph = state.pendingHelp;
      const helper = findPlayer(state, ph.helperId);

      if (action.accept) {
        if (!state.activeSituation) return fail('No active Situation.');
        const s: GameState = {
          ...state,
          phase: 'combat',
          pendingHelp: null,
          activeSituation: { ...state.activeSituation, helperId: ph.helperId, helperOfferedExperience: ph.offeredExperience },
        };
        return done(pushLog(s, `${helper?.name ?? 'Helper'} agrees to help.`, ph.helperId));
      }
      const s: GameState = { ...state, phase: 'combat', pendingHelp: null };
      return done(pushLog(s, `${helper?.name ?? 'Helper'} declines to help.`, ph.helperId));
    }

    case 'RESOLVE_COMBAT': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'combat') return fail('No combat to resolve.');
      const active = state.activeSituation;
      if (!active) return fail('No active Situation.');
      const situation = cardOf(active.cardId);
      if (situation?.type !== 'situation') return fail('Active card is not a Situation.');
      const math = combatMath(state);
      if (!math) return fail('Cannot compute combat.');

      // Clear the active Situation and combat regardless of outcome.
      let s: GameState = { ...state, activeSituation: null };

      if (math.wins) {
        const newLevel = cur.level + situation.reward.level;
        s = updatePlayer(s, cur.id, (p) => ({ ...p, level: newLevel }));
        s = pushLog(
          s,
          `${cur.name} solves ${situation.name}! (${math.total} vs ${math.difficulty}) +${situation.reward.level} level → ${newLevel}.`,
          cur.id,
        );

        // Strengths are spent when used to solve a Situation, discard the equipped
        // ones. Friends, Clubs, and Supports stay.
        const usedStrengths = cur.strengths;
        if (usedStrengths.length > 0) {
          s = updatePlayer(s, cur.id, (p) => ({ ...p, strengths: [] }));
          s = pushLog(s, `${cur.name}'s ${usedStrengths.length} Strength(s) were used up.`, cur.id);
        }

        // Discovery, solving through a matched Strength / Support / Self-Advocacy
        // reveals a new approach (an extra Experience card). It is never a random
        // "superpower" assignment; it is "here is one thing that worked for me."
        const discovered = math.usedStrengthIds.length + math.usedSupportIds.length + math.usedSelfAdvocacyIds.length;
        if (discovered > 0 && handSize(cur) < HAND_LIMIT) {
          const before = s;
          s = drawExperienceTo(s, cur.id, 1);
          if (s !== before) {
            s = pushLog(s, `${cur.name} discovered a new approach that worked for them.`, cur.id);
          }
        }

        const totalExp = situation.reward.experience;
        const toHelper = active.helperId ? Math.min(active.helperOfferedExperience, totalExp) : 0;
        const toSelf = totalExp - toHelper;
        // The current player may draw over the limit here, the discard phase below
        // makes them trim down. The helper can't discard on someone else's turn, so
        // their reward is capped to whatever hand room they have.
        s = drawExperienceTo(s, cur.id, toSelf);
        let helperGot = 0;
        if (active.helperId && toHelper > 0) {
          const helper = findPlayer(s, active.helperId);
          const room = helper ? Math.max(0, HAND_LIMIT - handSize(helper)) : 0;
          helperGot = Math.min(toHelper, room);
          if (helperGot > 0) s = drawExperienceTo(s, active.helperId, helperGot);
        }
        if (totalExp > 0) {
          const helperName = active.helperId ? findPlayer(s, active.helperId)?.name : undefined;
          const helperNote = active.helperId && helperGot > 0 ? `, and ${helperGot} to ${helperName ?? 'the helper'}` : '';
          const cardWord = toSelf === 1 ? 'card' : 'cards';
          s = pushLog(s, `${cur.name} gains ${toSelf} Experience ${cardWord}${helperNote}.`, cur.id);
        }

        if (newLevel >= TARGET_LEVEL) {
          s = { ...s, winnerId: cur.id, phase: 'game_over' };
          return done(pushLog(s, `🎉 ${cur.name} reaches Level ${TARGET_LEVEL} and wins!`, cur.id));
        }
        return done(withHandLimit(s, cur.id, 'main'));
      }

      // Failure, apply consequences, but skip any the player cancelled with a
      // Self-Advocacy card. Failing is never "you are deficient"; consequences are
      // temporary barriers, not permanent losses.
      const cancelled = active.cancelledConsequences ?? [];
      const consequences = situation.consequences.filter((e) => !cancelled.includes(e.type));
      s = pushLog(s, `${cur.name} doesn't solve ${situation.name} yet. (${math.total} vs ${math.difficulty})`, cur.id);
      return done(applyConsequences(s, consequences, cur.id, 'main'));
    }

    case 'RESOLVE_MESS_UP': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'messup' || !state.activeMessUp) return fail('Nothing to resolve right now.');
      const messup = cardOf(state.activeMessUp);
      if (messup?.type !== 'messup') return fail('Active Mess-Up is invalid.');

      if (action.cardId === null) {
        let s = applyEffects(state, messup.unmitigated ?? [], cur.id);
        s = pushLog(s, `${cur.name} endures ${messup.name}.`, cur.id);
        return done({ ...s, activeMessUp: null, phase: 'main' });
      }

      const options = messUpMitigationOptions(state, cur.id);
      if (!options.includes(action.cardId)) return fail('That card cannot mitigate this Mess-Up.');
      const cardId = action.cardId;
      const isSelfAdvocacy = cardOf(cardId)?.type === 'selfadvocacy';
      let s = state;
      if (isSelfAdvocacy) {
        s = updatePlayer(s, cur.id, (p) => ({ ...p, experienceHand: removeFirst(p.experienceHand, cardId) }));
      }
      s = pushLog(s, `${cur.name} uses ${cardOf(cardId)?.name ?? 'a card'} to remove the barrier.`, cur.id);
      return done({ ...s, activeMessUp: null, phase: 'main' });
    }

    case 'DISCARD_CARD': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'discard' || !state.discardTask) return fail('Nothing to discard right now.');
      const task = state.discardTask;
      const candidates =
        task.kind === 'limit' ? [...cur.situationHand, ...cur.experienceHand] : discardCandidates(cur, task.pool);
      if (!candidates.includes(action.cardId)) return fail('You cannot discard that card right now.');

      let s = removeCard(state, cur.id, action.cardId);
      s = pushLog(s, `${cur.name} discards ${cardOf(action.cardId)?.name ?? 'a card'}.`, cur.id);
      const after = currentPlayer(s);

      if (task.kind === 'limit') {
        if (handSize(after) > HAND_LIMIT) return done(s); // still over the limit
      } else {
        const remaining = task.remaining - 1;
        if (remaining > 0 && discardCandidates(after, task.pool).length > 0) {
          return done({ ...s, discardTask: { ...task, remaining } });
        }
      }
      const resume = s.resumeAfterDiscard ?? 'main';
      return done({ ...s, phase: resume, resumeAfterDiscard: null, discardTask: null });
    }

    case 'END_TURN': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'main') return fail('You can only end your turn after acting.');
      let s = state;
      // "Gain problem-solving ability", draw one Experience card, but only if there
      // is room (an automatic draw shouldn't force a discard as the turn ends).
      if (!s.turnFlags.enteredCombatThisTurn && handSize(cur) < HAND_LIMIT) {
        const before = s;
        s = drawExperienceTo(s, cur.id, 1);
        if (s !== before) s = pushLog(s, `${cur.name} gains problem-solving ability (draws 1 Experience).`, cur.id);
      }
      s = advanceTurn(s);
      const next = currentPlayer(s);
      return done(pushLog(s, `${next.name}'s turn (turn ${s.turn}).`, next.id));
    }

    default:
      return assertNever(action);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL ACTIONS, a single source of truth used by both the server (to validate)
// and the client (to enable/disable controls). Computed for a specific viewer.
// ─────────────────────────────────────────────────────────────────────────────

export interface LegalActions {
  canDraw: boolean;
  playableSituations: CardInstanceId[]; // startable from hand at await_action
  playableCards: CardInstanceId[]; // equip/levelup during combat or main
  canAskForHelp: boolean;
  helpTargets: PlayerId[];
  canRespondToHelp: boolean;
  canResolveCombat: boolean;
  canEndTurn: boolean;
  mustDiscard: boolean;
  discardable: CardInstanceId[]; // cards you may discard while over the hand limit
  unequippable: CardInstanceId[]; // equipped cards you may return to your hand
  chooseableCharacters: CardInstanceId[]; // characters you may pick during setup
  mitigations: CardInstanceId[]; // cards you may use to remove a Mess-Up barrier
  canAcceptMessUp: boolean; // may accept a Mess-Up's temporary penalty
}

function emptyLegal(): LegalActions {
  return {
    canDraw: false,
    playableSituations: [],
    playableCards: [],
    canAskForHelp: false,
    helpTargets: [],
    canRespondToHelp: false,
    canResolveCombat: false,
    canEndTurn: false,
    mustDiscard: false,
    discardable: [],
    unequippable: [],
    chooseableCharacters: [],
    mitigations: [],
    canAcceptMessUp: false,
  };
}

function playableFromHand(
  player: {
    experienceHand: CardInstanceId[];
    situationHand: CardInstanceId[];
    friendId: CardInstanceId | null;
    clubId: CardInstanceId | null;
    supports: CardInstanceId[];
  },
  opts: { phase: Phase; activeSituation: GameState['activeSituation'] },
): CardInstanceId[] {
  const fromExp = player.experienceHand.filter((id) => {
    const t = cardOf(id)?.type;
    return (
      t === 'strength' ||
      (t === 'friend' && !player.friendId) ||
      (t === 'support' && player.supports.length < MAX_SUPPORTS) ||
      (t === 'club' && !player.clubId) ||
      (t === 'selfadvocacy' && opts.phase === 'combat' && selfAdvocacyFitsSituation(id, opts.activeSituation))
    );
  });
  const fromSit = player.situationHand.filter((id) => {
    const t = cardOf(id)?.type;
    return t === 'levelup';
  });
  return [...fromExp, ...fromSit];
}

export function getLegalActions(state: GameState, playerId: PlayerId): LegalActions {
  const legal = emptyLegal();
  if (state.phase === 'game_over') return legal;

  const player = findPlayer(state, playerId);
  if (!player) return legal;

  // Character selection is simultaneous, any player who hasn't chosen may pick.
  if (state.phase === 'character_select') {
    legal.chooseableCharacters = player.characterId === null ? state.availableCharacters : [];
    return legal;
  }

  // The helper responding is the only non-current-player action.
  if (state.phase === 'await_help') {
    legal.canRespondToHelp = state.pendingHelp?.helperId === playerId;
    return legal;
  }

  if (currentPlayer(state).id !== playerId) {
    // Allow helper to play cards during combat if they accepted help
    if (state.phase === 'combat' && state.activeSituation?.helperId === playerId) {
      // fall through to combat case
    } else {
      return legal;
    }
  }

  switch (state.phase) {
    case 'await_action':
      legal.canDraw = true;
      legal.playableSituations = player.situationHand.filter((id) => cardOf(id)?.type === 'situation');
      return legal;
    case 'combat': {
      legal.playableCards = playableFromHand(player, { phase: state.phase, activeSituation: state.activeSituation });
      legal.unequippable = handSize(player) < HAND_LIMIT ? equippedCards(player) : [];
      const hasHelper = !!state.activeSituation?.helperId;
      legal.helpTargets = hasHelper ? [] : state.players.filter((p) => p.id !== playerId && p.connected).map((p) => p.id);
      legal.canAskForHelp = !hasHelper && legal.helpTargets.length > 0;
      legal.canResolveCombat = true;
      return legal;
    }
    case 'main':
      legal.playableCards = playableFromHand(player, { phase: state.phase, activeSituation: state.activeSituation });
      legal.unequippable = handSize(player) < HAND_LIMIT ? equippedCards(player) : [];
      legal.canEndTurn = true;
      return legal;
    case 'messup':
      legal.mitigations = messUpMitigationOptions(state, playerId);
      legal.canAcceptMessUp = true;
      return legal;
    case 'discard': {
      const task = state.discardTask;
      if (!task) return legal;
      legal.mustDiscard = true;
      legal.discardable =
        task.kind === 'limit' ? [...player.situationHand, ...player.experienceHand] : discardCandidates(player, task.pool);
      return legal;
    }
    default:
      return legal;
  }
}
