import { describe, it, expect } from 'vitest';
import {
  createGame,
  applyAction,
  getLegalActions,
  redactFor,
  cardOf,
  makeInstanceId,
  applyEffect,
  nextInt,
  SITUATION_DEFS,
  TARGET_LEVEL,
  HAND_LIMIT,
  type Action,
  type GameState,
} from '../index.ts';

/** Collect every card instance id currently on the table (no decks anymore). */
function gatherIds(state: GameState): string[] {
  const ids: string[] = [];
  for (const p of state.players) {
    if (p.characterId) ids.push(p.characterId);
    ids.push(...p.situationHand, ...p.experienceHand, ...p.strengths, ...p.supports);
    if (p.friendId) ids.push(p.friendId);
    if (p.clubId) ids.push(p.clubId);
  }
  ids.push(...state.availableCharacters);
  if (state.activeSituation) ids.push(state.activeSituation.cardId);
  if (state.activeMessUp) ids.push(state.activeMessUp);
  return ids;
}
const sig = (state: GameState) => gatherIds(state).slice().sort().join('|');
const twoPlayers = () => createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 12345);

/** Create a game and run every player through character select, returning play state. */
function startedGame(seed = 12345): GameState {
  let s = twoPlayers();
  if (seed !== 12345) s = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], seed);
  while (s.phase === 'character_select') {
    const chooser = s.players.find((p) => p.characterId === null)!;
    const pick = getLegalActions(s, chooser.id).chooseableCharacters[0]!;
    const r = applyAction(s, { type: 'CHOOSE_CHARACTER', playerId: chooser.id, characterId: pick });
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  return s;
}

describe('setup', () => {
  it('starts in character select: experience dealt, no characters assigned yet', () => {
    const g = twoPlayers();
    expect(g.players).toHaveLength(2);
    expect(g.phase).toBe('character_select');
    expect(g.availableCharacters).toHaveLength(4);
    for (const p of g.players) {
      expect(p.experienceHand).toHaveLength(4);
      expect(p.level).toBe(1);
      expect(p.characterId).toBeNull();
    }
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
  it('shows own hands but only counts for opponents', () => {
    const view = redactFor(twoPlayers(), 'p2');
    expect(view.you).toBe('p2');
    expect(view.yourExperienceHand).toHaveLength(4);
    const p1 = view.players.find((p) => p.id === 'p1')!;
    expect(p1.experienceHandCount).toBe(4);
    expect('experienceHand' in p1).toBe(false);
    expect('situationHand' in p1).toBe(false);
    const v = view as unknown as Record<string, unknown>;
    expect(v.situationDeck).toBeUndefined();
    expect(v.experienceDeck).toBeUndefined();
  });
});

describe('character selection', () => {
  it('lets each player pick a unique character, then begins the game', () => {
    let s = twoPlayers();
    expect(getLegalActions(s, 'p1').chooseableCharacters).toHaveLength(4);

    const c1 = getLegalActions(s, 'p1').chooseableCharacters[0]!;
    const r1 = applyAction(s, { type: 'CHOOSE_CHARACTER', playerId: 'p1', characterId: c1 });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    s = r1.state;
    expect(s.phase).toBe('character_select'); // still waiting for p2

    // p1 can't choose again; p2 can't take p1's character
    expect(applyAction(s, { type: 'CHOOSE_CHARACTER', playerId: 'p1', characterId: getLegalActions(s, 'p2').chooseableCharacters[0]! }).ok).toBe(false);
    expect(applyAction(s, { type: 'CHOOSE_CHARACTER', playerId: 'p2', characterId: c1 }).ok).toBe(false);
    // can't draw before selection completes
    expect(applyAction(s, { type: 'DRAW_SITUATION', playerId: 'p1' }).ok).toBe(false);

    const c2 = getLegalActions(s, 'p2').chooseableCharacters[0]!;
    const r2 = applyAction(s, { type: 'CHOOSE_CHARACTER', playerId: 'p2', characterId: c2 });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    s = r2.state;
    expect(s.phase).toBe('await_action');
    expect(s.players.find((p) => p.id === 'p1')!.characterId).toBe(c1);
    expect(s.players.find((p) => p.id === 'p2')!.characterId).toBe(c2);
    expect(getLegalActions(s, 'p1').canDraw).toBe(true);
  });
});

describe('validation', () => {
  it('rejects a non-current player drawing', () => {
    expect(applyAction(startedGame(), { type: 'DRAW_SITUATION', playerId: 'p2' }).ok).toBe(false);
  });
  it('rejects ending a turn before acting', () => {
    expect(applyAction(startedGame(), { type: 'END_TURN', playerId: 'p1' }).ok).toBe(false);
  });
});

describe('effects', () => {
  it('caps GAIN_LEVEL below TARGET_LEVEL (Go-Up-A-Level can never win)', () => {
    const s = applyEffect(twoPlayers(), { type: 'GAIN_LEVEL', amount: 99 }, 'p1');
    expect(s.players.find((p) => p.id === 'p1')!.level).toBe(TARGET_LEVEL - 1);
  });
  it('floors LOSE_LEVEL at 1', () => {
    const s = applyEffect(twoPlayers(), { type: 'LOSE_LEVEL', amount: 99 }, 'p1');
    expect(s.players.find((p) => p.id === 'p1')!.level).toBe(1);
  });
});

describe('combat and victory', () => {
  it('wins the game by solving a Situation to reach TARGET_LEVEL (15)', () => {
    expect(TARGET_LEVEL).toBe(15);
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 777);
    // sit-01 (diff 6, connects Bodily-Kinesthetic + Musical) solved with both
    // connected strengths → effective difficulty 4, total 2+3=5 → wins.
    const s: GameState = {
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: makeInstanceId('sit-01', 900), fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true, askedHelpThisTurn: false },
      players: base.players.map((p) =>
        p.id === 'p1' ? { ...p, level: TARGET_LEVEL - 1, strengths: ['str-05__901', 'str-04__902'] } : p,
      ),
    };
    const res = applyAction(s, { type: 'RESOLVE_COMBAT', playerId: 'p1' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.state.winnerId).toBe('p1');
    expect(res.state.phase).toBe('game_over');
    expect(applyAction(res.state, { type: 'END_TURN', playerId: 'p1' }).ok).toBe(false);
  });

  it('counts equipped bonuses only (not level): lose without a match, win when total >= effective', () => {
    const base = twoPlayers();
    const combat = (extra: Partial<{ strengths: string[]; friendId: string | null; clubId: string | null }>): GameState => ({
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: makeInstanceId('sit-02', 1), fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true, askedHelpThisTurn: false },
      players: base.players.map((p) => (p.id === 'p1' ? { ...p, level: 14, strengths: [], friendId: null, clubId: null, ...extra } : p)),
    });

    // sit-02 (diff 6, connects Linguistic). High level but no equipped bonus → total 0 < 6 → loses.
    const loss = applyAction(combat({}), { type: 'RESOLVE_COMBAT', playerId: 'p1' });
    expect(loss.ok).toBe(true);
    if (!loss.ok) return;
    expect(loss.state.winnerId).toBeNull();

    // Bodily-Kinesthetic +2 doesn't match Linguistic → effective 6, total 2 < 6 → loses.
    const loss2 = applyAction(combat({ strengths: [makeInstanceId('str-05', 2)] }), { type: 'RESOLVE_COMBAT', playerId: 'p1' });
    expect(loss2.ok).toBe(true);
    if (!loss2.ok) return;
    expect(loss2.state.winnerId).toBeNull();

    // Intrapersonal +4 doesn't match Linguistic → effective 6, total 4 < 6 → loses.
    const loss3 = applyAction(combat({ strengths: [makeInstanceId('str-07', 3)] }), { type: 'RESOLVE_COMBAT', playerId: 'p1' });
    expect(loss3.ok).toBe(true);
    if (!loss3.ok) return;
    expect(loss3.state.winnerId).toBeNull();

    // Linguistic (+2) matched, effective 4; plus Logical-Mathematical (+3) → total 5 ≥ 4 → wins.
    const win = applyAction(combat({ strengths: [makeInstanceId('str-01', 4), makeInstanceId('str-02', 5)] }), {
      type: 'RESOLVE_COMBAT',
      playerId: 'p1',
    });
    expect(win.ok).toBe(true);
    if (win.ok) expect(win.state.winnerId).toBe('p1');
  });

  it('counts an accepted helper toward the combat total', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 555);
    const s: GameState = {
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: makeInstanceId('sit-02', 7), fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true, askedHelpThisTurn: false },
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

  it('only allows one help request per turn, even if the helper declines', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, { id: 'p3', name: 'Cara' }], 616);
    const s: GameState = {
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: makeInstanceId('sit-02', 7), fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true, askedHelpThisTurn: false },
    };
    const asked = applyAction(s, { type: 'ASK_FOR_HELP', playerId: 'p1', helperId: 'p2', offeredExperience: 1 });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    const declined = applyAction(asked.state, { type: 'RESPOND_TO_HELP', playerId: 'p2', accept: false });
    expect(declined.ok).toBe(true);
    if (!declined.ok) return;
    expect(declined.state.phase).toBe('combat');
    expect(declined.state.turnFlags.askedHelpThisTurn).toBe(true);
    expect(getLegalActions(declined.state, 'p1').canAskForHelp).toBe(false);
    const again = applyAction(declined.state, { type: 'ASK_FOR_HELP', playerId: 'p1', helperId: 'p3', offeredExperience: 1 });
    expect(again.ok).toBe(false);
  });
});

describe('strength consumption and unequip', () => {
  it('removes equipped Strengths when a Situation is solved, but keeps Friend/Club', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 4242);
    // sit-02 (diff 6, connects Linguistic) solved with str-01 → effective 4, total 2+3=5 → wins.
    const s: GameState = {
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: makeInstanceId('sit-02', 5), fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true, askedHelpThisTurn: false },
      players: base.players.map((p) =>
        p.id === 'p1'
          ? { ...p, level: 5, strengths: ['str-01__900', 'str-02__901'], friendId: 'fnd-01__902', clubId: 'club-01__903', experienceHand: [], situationHand: [] }
          : p,
      ),
    };
    const res = applyAction(s, { type: 'RESOLVE_COMBAT', playerId: 'p1' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const p1 = res.state.players.find((p) => p.id === 'p1')!;
    expect(p1.strengths).toEqual([]); // strengths consumed
    expect(p1.level).toBe(6);
    expect(p1.friendId).toBe('fnd-01__902'); // friend kept
    expect(p1.clubId).toBe('club-01__903'); // club kept
  });

  it('keeps equipped Strengths when the solve attempt fails', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 4243);
    // sit-19 (diff 15, connects Spatial + Interpersonal, LOSE_LEVEL consequences).
    // Bodily-Kinesthetic +2 doesn't match → effective 15, total 2 < 15 → loses.
    const s: GameState = {
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: makeInstanceId('sit-19', 9), fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true, askedHelpThisTurn: false },
      players: base.players.map((p) => (p.id === 'p1' ? { ...p, level: 1, strengths: ['str-05__900'] } : p)),
    };
    const res = applyAction(s, { type: 'RESOLVE_COMBAT', playerId: 'p1' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.state.players.find((p) => p.id === 'p1')!.strengths).toEqual(['str-05__900']);
  });

  it('unequips a Strength back into the experience hand', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 900);
    const s: GameState = {
      ...base,
      phase: 'main',
      currentPlayerIndex: 0,
      players: base.players.map((p) => (p.id === 'p1' ? { ...p, strengths: ['str-08__900'], experienceHand: [], situationHand: [] } : p)),
    };
    const res = applyAction(s, { type: 'UNEQUIP_CARD', playerId: 'p1', cardId: 'str-08__900' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const p1 = res.state.players.find((p) => p.id === 'p1')!;
    expect(p1.strengths).toEqual([]);
    expect(p1.experienceHand).toEqual(['str-08__900']);
  });

  it('unequips a Club back into the experience hand', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 901);
    const s: GameState = {
      ...base,
      phase: 'main',
      currentPlayerIndex: 0,
      players: base.players.map((p) => (p.id === 'p1' ? { ...p, clubId: 'club-02__900', situationHand: [], experienceHand: [] } : p)),
    };
    const res = applyAction(s, { type: 'UNEQUIP_CARD', playerId: 'p1', cardId: 'club-02__900' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const p1 = res.state.players.find((p) => p.id === 'p1')!;
    expect(p1.clubId).toBeNull();
    expect(p1.experienceHand).toEqual(['club-02__900']);
  });

  it('rejects unequip when the hand is already full', () => {
    const base = createGame([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }], 902);
    const fullHand = Array.from({ length: HAND_LIMIT }, (_, i) => `str-01__${800 + i}`);
    const s: GameState = {
      ...base,
      phase: 'main',
      currentPlayerIndex: 0,
      players: base.players.map((p) => (p.id === 'p1' ? { ...p, strengths: ['str-02__950'], experienceHand: fullHand, situationHand: [] } : p)),
    };
    expect(applyAction(s, { type: 'UNEQUIP_CARD', playerId: 'p1', cardId: 'str-02__950' }).ok).toBe(false);
  });
});

describe('failure discard consequences', () => {
  it('lets the player choose what to discard, including an equipped card, after failing', () => {
    const base = twoPlayers();
    // sit-03 (diff 7, connects Spatial, DISCARD_EXPERIENCE x1). Linguistic +2 doesn't match →
    // effective 7, total 2 < 7 → loses, so the player must discard an Experience card.
    const s: GameState = {
      ...base,
      phase: 'combat',
      currentPlayerIndex: 0,
      activeSituation: { cardId: makeInstanceId('sit-03', 3), fromDeck: true, helperId: null, helperOfferedExperience: 0 },
      turnFlags: { enteredCombatThisTurn: true, askedHelpThisTurn: false },
      // one equipped Strength, empty hands, so the only way to pay the discard is the equipped card
      players: base.players.map((p) => (p.id === 'p1' ? { ...p, strengths: ['str-01__700'], experienceHand: [], situationHand: [] } : p)),
    };

    const failed = applyAction(s, { type: 'RESOLVE_COMBAT', playerId: 'p1' });
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.state.winnerId).toBeNull();
    expect(failed.state.phase).toBe('discard');
    expect(failed.state.discardTask).toEqual({ kind: 'count', remaining: 1, pool: 'experience' });

    const legal = getLegalActions(failed.state, 'p1');
    expect(legal.mustDiscard).toBe(true);
    expect(legal.discardable).toContain('str-01__700'); // equipped strength is a valid discard

    const after = applyAction(failed.state, { type: 'DISCARD_CARD', playerId: 'p1', cardId: 'str-01__700' });
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.state.phase).toBe('main');
    expect(after.state.players.find((p) => p.id === 'p1')!.strengths).toEqual([]);
  });
});

describe('hand limit', () => {
  /** Find an rng state whose next Situation draw lands in the hand (a levelup). */
  function findHandCardDrawRng(): number {
    for (let s = 1; s < 1_000_000; s++) {
      const r = nextInt(s, SITUATION_DEFS.length);
      const c = SITUATION_DEFS[r.value]!;
      if (c.type === 'levelup') return s;
    }
    throw new Error('no qualifying rngState found');
  }

  it('drawing over the limit forces a discard, and you choose what to keep', () => {
    const base = twoPlayers();
    const fullHand = Array.from({ length: HAND_LIMIT }, (_, i) => `str-01__${900 + i}`);
    const s: GameState = {
      ...base,
      currentPlayerIndex: 0,
      phase: 'await_action',
      rngState: findHandCardDrawRng(),
      players: base.players.map((p) => (p.id === 'p1' ? { ...p, experienceHand: fullHand, situationHand: [] } : p)),
    };
    const drawn = applyAction(s, { type: 'DRAW_SITUATION', playerId: 'p1' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;
    expect(drawn.state.phase).toBe('discard');

    const legal = getLegalActions(drawn.state, 'p1');
    expect(legal.mustDiscard).toBe(true);
    expect(legal.discardable).toHaveLength(HAND_LIMIT + 1);
    // cannot end turn while over the limit
    expect(applyAction(drawn.state, { type: 'END_TURN', playerId: 'p1' }).ok).toBe(false);

    const discarded = applyAction(drawn.state, { type: 'DISCARD_CARD', playerId: 'p1', cardId: legal.discardable[0]! });
    expect(discarded.ok).toBe(true);
    if (!discarded.ok) return;
    expect(discarded.state.phase).toBe('main');
    const p1 = discarded.state.players.find((p) => p.id === 'p1')!;
    expect(p1.situationHand.length + p1.experienceHand.length).toBe(HAND_LIMIT);
  });

  it('rejects DISCARD_CARD when not over the limit', () => {
    expect(applyAction(twoPlayers(), { type: 'DISCARD_CARD', playerId: 'p1', cardId: 'x' }).ok).toBe(false);
  });
});

describe('mess-up mitigation', () => {
  it('offers Self-Advocacy cards that logically address the Mess-Up barrier', () => {
    let s = startedGame();
    const cur = s.players[s.currentPlayerIndex]!;
    const fitting = makeInstanceId('sad-03', 900); // Can We Change the Environment? addresses 'routine-change'
    const unrelated = makeInstanceId('sad-05', 901); // I Need a Break does not address 'routine-change'
    s = {
      ...s,
      activeMessUp: makeInstanceId('msu-01', 902), // Unexpected Routine Change
      phase: 'messup',
      players: s.players.map((p) =>
        p.id === cur.id ? { ...p, experienceHand: [fitting, unrelated, ...p.experienceHand] } : p,
      ),
    };
    const legal = getLegalActions(s, cur.id);
    expect(legal.mitigations).toContain(fitting);
    expect(legal.mitigations).not.toContain(unrelated);
  });
});

describe('full auto-played game', () => {
  it('rotates turns, keeps every instance id unique, and produces a winner', () => {
    let s = createGame(
      [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, { id: 'p3', name: 'Cara' }],
      2024,
    );
    const seenCurrent = new Set<string>();
    let steps = 0;
    const MAX = 20000;

    while (s.phase !== 'game_over' && steps < MAX) {
      steps++;
      if (s.phase === 'character_select') {
        const chooser = s.players.find((p) => p.characterId === null)!;
        const pick = getLegalActions(s, chooser.id).chooseableCharacters[0]!;
        const r = applyAction(s, { type: 'CHOOSE_CHARACTER', playerId: chooser.id, characterId: pick });
        expect(r.ok).toBe(true);
        if (!r.ok) break;
        s = r.state;
        continue;
      }
      if (s.phase === 'await_help') {
        const r = applyAction(s, { type: 'RESPOND_TO_HELP', playerId: s.pendingHelp!.helperId, accept: false });
        expect(r.ok).toBe(true);
        if (!r.ok) break;
        s = r.state;
        continue;
      }
      if (s.phase === 'messup') {
        const legalM = getLegalActions(s, s.players[s.currentPlayerIndex]!.id);
        const mitigation = legalM.mitigations[0] ?? null;
        const r = applyAction(s, { type: 'RESOLVE_MESS_UP', playerId: s.players[s.currentPlayerIndex]!.id, cardId: mitigation });
        expect(r.ok, r.ok ? '' : r.error).toBe(true);
        if (!r.ok) break;
        s = r.state;
        continue;
      }
      const curId = s.players[s.currentPlayerIndex]!.id;
      seenCurrent.add(curId);
      const legal = getLegalActions(s, curId);
      let action: Action;
      if (legal.mustDiscard) action = { type: 'DISCARD_CARD', playerId: curId, cardId: legal.discardable[0]! };
      else if (legal.canDraw) action = { type: 'DRAW_SITUATION', playerId: curId };
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

      // Infinite draws mint fresh instances: every id on the table must be unique and resolvable.
      const ids = gatherIds(s);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(cardOf(id)).toBeTruthy();
      for (const p of s.players) expect(p.level).toBeGreaterThanOrEqual(1);
    }

    expect(steps).toBeLessThan(MAX);
    expect(s.phase).toBe('game_over');
    expect(s.winnerId).toBeTruthy();
    expect(seenCurrent.size).toBe(3);
    expect(s.players.find((p) => p.id === s.winnerId)!.level).toBeGreaterThanOrEqual(TARGET_LEVEL);
  });
});