import type { CardInstanceId } from '../cards/types.ts';
import { cardOf } from '../cards/index.ts';
import { TARGET_LEVEL, HAND_LIMIT } from '../constants.ts';
import type { GameState, PlayerId, PlayerState, Phase } from './state.ts';
import { currentPlayer, findPlayer } from './state.ts';
import { combatMath } from './bonuses.ts';
import { applyEffect, applyEffects } from './effects.ts';
import { drawSituation, drawExperience } from './deck.ts';
import { updatePlayer, pushLog, removeFirst, assertNever } from './util.ts';

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS — the only ways to mutate game state. Every action names its `playerId`
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

/** All currently-equipped card instances (strengths, friend, club). */
function equippedCards(p: PlayerState): CardInstanceId[] {
  return [...p.strengths, ...(p.friendId ? [p.friendId] : []), ...(p.clubId ? [p.clubId] : [])];
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
      { ...state, phase: 'discard', resumeAfterDiscard: resumePhase },
      `${p.name} is over the hand limit (${handSize(p)}/${HAND_LIMIT}) — discard down to ${HAND_LIMIT}.`,
      playerId,
    );
  }
  return { ...state, phase: resumePhase, resumeAfterDiscard: null };
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
    pendingHelp: null,
    resumeAfterDiscard: null,
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
        s = pushLog(s, `Everyone has chosen — ${first.name} goes first.`, first.id);
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
          s = pushLog(s, `${cur.name} faces ${card.name} (difficulty ${card.difficulty}).`, cur.id);
          return done({
            ...s,
            activeSituation: { cardId: drawnId, fromDeck: true, helperId: null, helperOfferedExperience: 0 },
            phase: 'combat',
            turnFlags: { enteredCombatThisTurn: true },
          });
        }
        case 'messup': {
          s = pushLog(s, `${cur.name} drew a Mess-Up: ${card.name}.`, cur.id);
          s = applyEffects(s, card.effects, cur.id);
          return done({ ...s, situationDiscard: [...s.situationDiscard, drawnId], phase: 'main' });
        }
        case 'club':
        case 'levelup': {
          s = updatePlayer(s, cur.id, (p) => ({ ...p, situationHand: [...p.situationHand, drawnId] }));
          s = pushLog(s, `${cur.name} drew ${card.name} into their hand.`, cur.id);
          return done(withHandLimit(s, cur.id, 'main'));
        }
        default: {
          // Strengths/Friends/Characters never belong in the Situation deck; discard defensively.
          return done({ ...s, situationDiscard: [...s.situationDiscard, drawnId], phase: 'main' });
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
      s = pushLog(s, `${cur.name} takes on ${card.name} (difficulty ${card.difficulty}).`, cur.id);
      return done({
        ...s,
        activeSituation: { cardId: action.cardId, fromDeck: false, helperId: null, helperOfferedExperience: 0 },
        phase: 'combat',
        turnFlags: { enteredCombatThisTurn: true },
      });
    }

    case 'PLAY_CARD': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'combat' && state.phase !== 'main') {
        return fail('You can only play cards during combat or your main phase.');
      }
      const card = cardOf(action.cardId);
      if (!card) return fail('Unknown card.');

      switch (card.type) {
        case 'strength': {
          if (!cur.experienceHand.includes(action.cardId)) return fail('That Strength is not in your hand.');
          const s = updatePlayer(state, cur.id, (p) => ({
            ...p,
            experienceHand: removeFirst(p.experienceHand, action.cardId),
            strengths: [...p.strengths, action.cardId],
          }));
          return done(pushLog(s, `${cur.name} equips ${card.name} (+${card.bonus}).`, cur.id));
        }
        case 'friend': {
          if (!cur.experienceHand.includes(action.cardId)) return fail('That Friend is not in your hand.');
          if (cur.friendId) return fail('You already have a Friend equipped (max 1).');
          const s = updatePlayer(state, cur.id, (p) => ({
            ...p,
            experienceHand: removeFirst(p.experienceHand, action.cardId),
            friendId: action.cardId,
          }));
          return done(pushLog(s, `${cur.name} brings in Friend ${card.name} (+${card.bonus}).`, cur.id));
        }
        case 'club': {
          if (!cur.situationHand.includes(action.cardId)) return fail('That Club is not in your hand.');
          if (cur.clubId) return fail('You already have a Club (max 1).');
          const s = updatePlayer(state, cur.id, (p) => ({
            ...p,
            situationHand: removeFirst(p.situationHand, action.cardId),
            clubId: action.cardId,
          }));
          return done(pushLog(s, `${cur.name} joins Club ${card.name} (+${card.bonus}).`, cur.id));
        }
        case 'levelup': {
          if (!cur.situationHand.includes(action.cardId)) return fail('That card is not in your hand.');
          let s = updatePlayer(state, cur.id, (p) => ({ ...p, situationHand: removeFirst(p.situationHand, action.cardId) }));
          s = { ...s, situationDiscard: [...s.situationDiscard, action.cardId] };
          s = applyEffect(s, { type: 'GAIN_LEVEL', amount: card.amount }, cur.id);
          return done(s);
        }
        default:
          return fail('That card cannot be played this way.');
      }
    }

    case 'UNEQUIP_CARD': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'combat' && state.phase !== 'main') {
        return fail('You can only unequip during combat or your main phase.');
      }
      const isStrength = cur.strengths.includes(action.cardId);
      const isFriend = cur.friendId === action.cardId;
      const isClub = cur.clubId === action.cardId;
      if (!isStrength && !isFriend && !isClub) return fail('That card is not equipped.');
      if (handSize(cur) >= HAND_LIMIT) return fail('Your hand is full — make room before unequipping.');
      const card = cardOf(action.cardId);

      let s: GameState;
      if (isStrength) {
        s = updatePlayer(state, cur.id, (p) => ({
          ...p,
          strengths: removeFirst(p.strengths, action.cardId),
          experienceHand: [...p.experienceHand, action.cardId],
        }));
      } else if (isFriend) {
        s = updatePlayer(state, cur.id, (p) => ({ ...p, friendId: null, experienceHand: [...p.experienceHand, action.cardId] }));
      } else {
        // A Club returns to the Situation hand (where Clubs are held).
        s = updatePlayer(state, cur.id, (p) => ({ ...p, clubId: null, situationHand: [...p.situationHand, action.cardId] }));
      }
      return done(pushLog(s, `${cur.name} unequips ${card?.name ?? 'a card'}.`, cur.id));
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

      // Discard the Situation and clear combat regardless of outcome.
      let s: GameState = { ...state, situationDiscard: [...state.situationDiscard, active.cardId], activeSituation: null };

      if (math.wins) {
        const newLevel = cur.level + situation.reward.level;
        s = updatePlayer(s, cur.id, (p) => ({ ...p, level: newLevel }));
        s = pushLog(
          s,
          `${cur.name} solves ${situation.name}! (${math.total} vs ${math.difficulty}) +${situation.reward.level} level → ${newLevel}.`,
          cur.id,
        );

        // Strengths are spent when used to solve a Situation — discard the equipped
        // ones. Friends and Clubs stay equipped.
        const usedStrengths = cur.strengths;
        if (usedStrengths.length > 0) {
          s = updatePlayer(s, cur.id, (p) => ({ ...p, strengths: [] }));
          s = { ...s, experienceDiscard: [...s.experienceDiscard, ...usedStrengths] };
          s = pushLog(s, `${cur.name}'s ${usedStrengths.length} Strength(s) were used up and discarded.`, cur.id);
        }

        const totalExp = situation.reward.experience;
        const toHelper = active.helperId ? Math.min(active.helperOfferedExperience, totalExp) : 0;
        const toSelf = totalExp - toHelper;
        // The current player may draw over the limit here — the discard phase below
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
          const helperNote = active.helperId ? `, ${helperGot} to helper` : '';
          s = pushLog(s, `Experience: ${toSelf} to ${cur.name}${helperNote}.`, cur.id);
        }

        if (newLevel >= TARGET_LEVEL) {
          s = { ...s, winnerId: cur.id, phase: 'game_over' };
          return done(pushLog(s, `🎉 ${cur.name} reaches Level ${TARGET_LEVEL} and wins!`, cur.id));
        }
        return done(withHandLimit(s, cur.id, 'main'));
      }

      s = pushLog(s, `${cur.name} fails ${situation.name}. (${math.total} vs ${math.difficulty})`, cur.id);
      s = applyEffects(s, situation.consequences, cur.id);
      return done({ ...s, phase: 'main' });
    }

    case 'DISCARD_CARD': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'discard') return fail('You can only discard when over the hand limit.');
      const inSit = cur.situationHand.includes(action.cardId);
      const inExp = cur.experienceHand.includes(action.cardId);
      if (!inSit && !inExp) return fail('That card is not in your hand.');

      let s = updatePlayer(state, cur.id, (p) =>
        inSit
          ? { ...p, situationHand: removeFirst(p.situationHand, action.cardId) }
          : { ...p, experienceHand: removeFirst(p.experienceHand, action.cardId) },
      );
      s = inSit
        ? { ...s, situationDiscard: [...s.situationDiscard, action.cardId] }
        : { ...s, experienceDiscard: [...s.experienceDiscard, action.cardId] };
      s = pushLog(s, `${cur.name} discards ${cardOf(action.cardId)?.name ?? 'a card'}.`, cur.id);

      const after = currentPlayer(s);
      if (handSize(after) > HAND_LIMIT) return done(s); // still over the limit
      const resume = s.resumeAfterDiscard ?? 'main';
      return done({ ...s, phase: resume, resumeAfterDiscard: null });
    }

    case 'END_TURN': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'main') return fail('You can only end your turn after acting.');
      let s = state;
      // "Gain problem-solving ability" — draw one Experience card, but only if there
      // is room (an automatic draw shouldn't force a discard as the turn ends).
      if (!s.turnFlags.enteredCombatThisTurn && handSize(cur) < HAND_LIMIT) {
        const before = s;
        s = drawExperienceTo(s, cur.id, 1);
        if (s !== before) s = pushLog(s, `${cur.name} gains problem-solving ability (draws 1 Experience).`, cur.id);
      }
      s = advanceTurn(s);
      const next = currentPlayer(s);
      return done(pushLog(s, `— ${next.name}'s turn (turn ${s.turn}).`, next.id));
    }

    default:
      return assertNever(action);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL ACTIONS — a single source of truth used by both the server (to validate)
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
  };
}

function playableFromHand(
  player: { experienceHand: CardInstanceId[]; situationHand: CardInstanceId[]; friendId: CardInstanceId | null; clubId: CardInstanceId | null },
): CardInstanceId[] {
  const fromExp = player.experienceHand.filter((id) => {
    const t = cardOf(id)?.type;
    return t === 'strength' || (t === 'friend' && !player.friendId);
  });
  const fromSit = player.situationHand.filter((id) => {
    const t = cardOf(id)?.type;
    return t === 'levelup' || (t === 'club' && !player.clubId);
  });
  return [...fromExp, ...fromSit];
}

export function getLegalActions(state: GameState, playerId: PlayerId): LegalActions {
  const legal = emptyLegal();
  if (state.phase === 'game_over') return legal;

  const player = findPlayer(state, playerId);
  if (!player) return legal;

  // Character selection is simultaneous — any player who hasn't chosen may pick.
  if (state.phase === 'character_select') {
    legal.chooseableCharacters = player.characterId === null ? state.availableCharacters : [];
    return legal;
  }

  // The helper responding is the only non-current-player action.
  if (state.phase === 'await_help') {
    legal.canRespondToHelp = state.pendingHelp?.helperId === playerId;
    return legal;
  }

  if (currentPlayer(state).id !== playerId) return legal;

  switch (state.phase) {
    case 'await_action':
      legal.canDraw = true;
      legal.playableSituations = player.situationHand.filter((id) => cardOf(id)?.type === 'situation');
      return legal;
    case 'combat': {
      legal.playableCards = playableFromHand(player);
      legal.unequippable = handSize(player) < HAND_LIMIT ? equippedCards(player) : [];
      const hasHelper = !!state.activeSituation?.helperId;
      legal.helpTargets = hasHelper ? [] : state.players.filter((p) => p.id !== playerId && p.connected).map((p) => p.id);
      legal.canAskForHelp = !hasHelper && legal.helpTargets.length > 0;
      legal.canResolveCombat = true;
      return legal;
    }
    case 'main':
      legal.playableCards = playableFromHand(player);
      legal.unequippable = handSize(player) < HAND_LIMIT ? equippedCards(player) : [];
      legal.canEndTurn = true;
      return legal;
    case 'discard':
      legal.mustDiscard = true;
      legal.discardable = [...player.situationHand, ...player.experienceHand];
      return legal;
    default:
      return legal;
  }
}
