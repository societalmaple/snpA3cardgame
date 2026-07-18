import type { CardInstanceId } from '../cards/types.ts';
import { cardOf } from '../cards/index.ts';
import { TARGET_LEVEL } from '../constants.ts';
import type { GameState, PlayerId } from './state.ts';
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
  | { type: 'DRAW_SITUATION'; playerId: PlayerId }
  | { type: 'PLAY_SITUATION_FROM_HAND'; playerId: PlayerId; cardId: CardInstanceId }
  | { type: 'PLAY_CARD'; playerId: PlayerId; cardId: CardInstanceId }
  | { type: 'ASK_FOR_HELP'; playerId: PlayerId; helperId: PlayerId; offeredExperience: number }
  | { type: 'RESPOND_TO_HELP'; playerId: PlayerId; accept: boolean }
  | { type: 'RESOLVE_COMBAT'; playerId: PlayerId }
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
    turnFlags: { enteredCombatThisTurn: false },
  };
}

export function applyAction(state: GameState, action: Action): ReduceResult {
  if (state.phase === 'game_over') return fail('The game is over.');

  const cur = currentPlayer(state);
  const isCurrent = cur.id === action.playerId;

  switch (action.type) {
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
          return done({ ...s, phase: 'main' });
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

        const totalExp = situation.reward.experience;
        const toHelper = active.helperId ? Math.min(active.helperOfferedExperience, totalExp) : 0;
        const toSelf = totalExp - toHelper;
        s = drawExperienceTo(s, cur.id, toSelf);
        if (active.helperId && toHelper > 0) s = drawExperienceTo(s, active.helperId, toHelper);
        if (totalExp > 0) {
          const helperNote = active.helperId ? `, ${toHelper} to helper` : '';
          s = pushLog(s, `Experience: ${toSelf} to ${cur.name}${helperNote}.`, cur.id);
        }

        if (newLevel >= TARGET_LEVEL) {
          s = { ...s, winnerId: cur.id, phase: 'game_over' };
          return done(pushLog(s, `🎉 ${cur.name} reaches Level ${TARGET_LEVEL} and wins!`, cur.id));
        }
        return done({ ...s, phase: 'main' });
      }

      s = pushLog(s, `${cur.name} fails ${situation.name}. (${math.total} vs ${math.difficulty})`, cur.id);
      s = applyEffects(s, situation.consequences, cur.id);
      return done({ ...s, phase: 'main' });
    }

    case 'END_TURN': {
      if (!isCurrent) return fail('Not your turn.');
      if (state.phase !== 'main') return fail('You can only end your turn after acting.');
      let s = state;
      if (!s.turnFlags.enteredCombatThisTurn) {
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
      const hasHelper = !!state.activeSituation?.helperId;
      legal.helpTargets = hasHelper ? [] : state.players.filter((p) => p.id !== playerId && p.connected).map((p) => p.id);
      legal.canAskForHelp = !hasHelper && legal.helpTargets.length > 0;
      legal.canResolveCombat = true;
      return legal;
    }
    case 'main':
      legal.playableCards = playableFromHand(player);
      legal.canEndTurn = true;
      return legal;
    default:
      return legal;
  }
}
