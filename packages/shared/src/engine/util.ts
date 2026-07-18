import type { GameState, PlayerId, PlayerState } from './state.ts';

/** Immutably replace one player via an updater function. */
export function updatePlayer(
  state: GameState,
  playerId: PlayerId,
  fn: (p: PlayerState) => PlayerState,
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? fn(p) : p)),
  };
}

/** Append a log event, advancing the event id counter. */
export function pushLog(state: GameState, message: string, playerId?: PlayerId): GameState {
  const event = { id: state.nextEventId, turn: state.turn, message, ...(playerId ? { playerId } : {}) };
  return { ...state, log: [...state.log, event], nextEventId: state.nextEventId + 1 };
}

/** Remove the first occurrence of a value; returns a new array. */
export function removeFirst<T>(arr: readonly T[], value: T): T[] {
  const idx = arr.indexOf(value);
  if (idx === -1) return arr.slice();
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}

/** Compile-time exhaustiveness guard for discriminated unions. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
