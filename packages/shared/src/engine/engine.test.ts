import { describe, it, expect } from 'vitest';
import {
  createGame,
  applyAction,
  getLegalActions,
  redactFor,
  cardOf,
  applyEffect,
  TARGET_LEVEL,
  type Action,
  type GameState,
} from '../index.ts';

function gatherIds(state: GameState): string[] {
  const ids: string[] = [];
  for (const p of state.players) {
    ids.push(p.characterId, ...p.situationHand, ...p.experienceHand, ...p.strengths);
    if (p.friendId) ids.push(p.friendId);
    if (p.clubId) ids.push(p.clubId);
  }
  ids.push(...state.situationDeck, ...state.situationDiscard, ...state.experienceDeck, ...state.experienceDiscard);
  if (state.activeSituation) ids.push(state.activeSituation.cardId);
  return ids;
}
const sig = (state: GameState) => gatherIds(state).slice().sort().join('|');
const twoPlayers = () => createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 12345);

describe('setup', () => {
  it('deals 4 experience cards + a character to each player', () => {
    const g = twoPlayers();
    expect(g.players).toHaveLength(2);
    for (const p of g.players) {
      expect(p.experienceHand).toHaveLength(4);
      expect(p.level).toBe(1);
      expect(cardOf(p.characterId)?.type).toBe('character');
    }
    expect(g.phase).toBe('await_action');
  });

  it('rejects player counts outside 2-4', () => {
    expect(() => createGame([{ id: 'p1', name: 'A' }], 1)).toThrow();
    expect(() => createGame([1, 2, 3, 4, 5].map((n) => ({ id: `p${n}`, name: `P${n}` })), 1)).toThrow();
  });

  it('is deterministic for a given seed', () => {
    const a = createGame([{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }], 42);
    const b = createGame([{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }], 42);
    expect(sig(a)).toBe(sig(b));
  });
});

describe('redaction', () => {
  it('shows own hands but only counts for opponents and decks', () => {
    const view = redactFor(twoPlayers(), 'p2');
    expect(view.you).toBe('p2');
    expect(view.yourExperienceHand).toHaveLength(4);
    const p1 = view.players.find((p) => p.id === 'p1')!;
    expect(p1.experienceHandCount).toBe(4);
    expect('experienceHand' in p1).toBe(false);
    expect('situationHand' in p1).toBe(false);
    expect(typeof view.situationDeckCount).toBe('number');
    expect((view as unknown as Record<string, unknown>).situationDeck).toBeUndefined();
  });
});

describe('validation', () => {
  it('rejects a non-current player drawing', () => {
    expect(applyAction(twoPlayers(), { type: 'DRAW_SITUATION', playerId: 'p2' }).ok).toBe(false);
  });
  it('rejects ending a turn before acting', () => {
    expect(applyAction(twoPlayers(), { type: 'END_TURN', playerId: 'p1' }).ok).toBe(false);
  });
});

describe('effects', () => {
  it('caps GAIN_LEVEL below TARGET_LEVEL (Go-Up-A-Level can never win)', () => {
    const s = applyEffect(twoPlayers(), { type: 'GAIN_LEVEL', amount: 10 }, 'p1');
    expect(s.players.find((p) => p.id === 'p1')!.level).toBe(TARGET_LEVEL - 1);
  });
  it('floors LOSE_LEVEL at 1', () => {
    const s = applyEffect(twoPlayers(), { type: 'LOSE_LEVEL', amount: 99 }, 'p1');
    expect(s.players.find((p) => p.id === 'p1')!.level).toBe(1);
  });
});

describe('combat and victory', () => {
  it('wins the game by solving a Situation to reach TARGET_LEVEL', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 777);
    const sitId = base.situationDeck.find((id) => {
      const c = cardOf(id);
      return c?.type === 'situation' && c.difficulty <= 3;
    })!;
    const s: GameState = {
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: sitId, fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true },
      players: base.players.map((p) => (p.id === 'p1' ? { ...p, level: 4 } : p)),
    };
    const res = applyAction(s, { type: 'RESOLVE_COMBAT', playerId: 'p1' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.state.winnerId).toBe('p1');
    expect(res.state.phase).toBe('game_over');
    expect(applyAction(res.state, { type: 'END_TURN', playerId: 'p1' }).ok).toBe(false);
  });

  it('counts an accepted helper toward the combat total', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 555);
    const sitId = base.situationDeck.find((id) => cardOf(id)?.type === 'situation')!;
    const s: GameState = {
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: sitId, fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true },
    };
    const asked = applyAction(s, { type: 'ASK_FOR_HELP', playerId: 'p1', helperId: 'p2', offeredExperience: 1 });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.state.phase).toBe('await_help');
    expect(applyAction(asked.state, { type: 'RESOLVE_COMBAT', playerId: 'p1' }).ok).toBe(false);
    const accepted = applyAction(asked.state, { type: 'RESPOND_TO_HELP', playerId: 'p2', accept: true });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.state.phase).toBe('combat');
    expect(accepted.state.activeSituation?.helperId).toBe('p2');
  });
});

describe('full auto-played game', () => {
  it('conserves every card, rotates turns, and produces a winner', () => {
    let s = createGame(
      [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, { id: 'p3', name: 'Cara' }],
      2024,
    );
    const initialSig = sig(s);
    const seenCurrent = new Set<string>();
    let steps = 0;
    const MAX = 20000;

    while (s.phase !== 'game_over' && steps < MAX) {
      steps++;
      if (s.phase === 'await_help') {
        const r = applyAction(s, { type: 'RESPOND_TO_HELP', playerId: s.pendingHelp!.helperId, accept: false });
        expect(r.ok).toBe(true);
        if (!r.ok) break;
        s = r.state;
        continue;
      }
      const curId = s.players[s.currentPlayerIndex]!.id;
      seenCurrent.add(curId);
      const legal = getLegalActions(s, curId);
      let action: Action;
      if (legal.canDraw) action = { type: 'DRAW_SITUATION', playerId: curId };
      else if (s.phase === 'combat') {
        action = legal.playableCards.length
          ? { type: 'PLAY_CARD', playerId: curId, cardId: legal.playableCards[0]! }
          : { type: 'RESOLVE_COMBAT', playerId: curId };
      } else {
        action = legal.playableCards.length
          ? { type: 'PLAY_CARD', playerId: curId, cardId: legal.playableCards[0]! }
          : { type: 'END_TURN', playerId: curId };
      }
      const r = applyAction(s, action);
      expect(r.ok, r.ok ? '' : r.error).toBe(true);
      if (!r.ok) break;
      s = r.state;
      expect(sig(s)).toBe(initialSig); // no card created or destroyed
      for (const p of s.players) expect(p.level).toBeGreaterThanOrEqual(1);
    }

    expect(steps).toBeLessThan(MAX);
    expect(s.phase).toBe('game_over');
    expect(s.winnerId).toBeTruthy();
    expect(seenCurrent.size).toBe(3);
    expect(s.players.find((p) => p.id === s.winnerId)!.level).toBeGreaterThanOrEqual(TARGET_LEVEL);
  });
});
