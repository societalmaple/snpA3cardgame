// ─────────────────────────────────────────────────────────────────────────────
// NETWORK PROTOCOL — the typed contract between the Socket.IO server and clients.
// Shared so both ends agree on event names and payload shapes.
// ─────────────────────────────────────────────────────────────────────────────

import type { Action } from './engine/reduce.ts';
import type { PlayerView } from './engine/redact.ts';
import type { GameEvent } from './engine/state.ts';

export type RoomPhase = 'lobby' | 'in_game' | 'ended';

export interface RoomPlayerInfo {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
}

export interface RoomState {
  code: string;
  phase: RoomPhase;
  hostId: string;
  players: RoomPlayerInfo[];
}

/** Handed to a client on create/join; used to reconnect after a drop. */
export interface Session {
  playerId: string;
  token: string;
  roomCode: string;
}

/** Standard acknowledgement for request/response events. */
export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export interface ClientToServerEvents {
  'room:create': (payload: { name: string }, cb: (res: Ack<Session>) => void) => void;
  'room:join': (payload: { code: string; name: string }, cb: (res: Ack<Session>) => void) => void;
  'room:reconnect': (payload: { code: string; playerId: string; token: string }, cb: (res: Ack<Session>) => void) => void;
  'room:ready': (payload: { ready: boolean }) => void;
  'room:start': (cb: (res: Ack<null>) => void) => void;
  'room:leave': () => void;
  'game:action': (action: Action, cb: (res: Ack<null>) => void) => void;
}

export interface ServerToClientEvents {
  'room:state': (room: RoomState) => void;
  'game:view': (view: PlayerView) => void;
  'game:event': (event: GameEvent) => void;
  'error:msg': (message: string) => void;
}

export const ROOM_CODE_LENGTH = 4;
export const RECONNECT_GRACE_MS = 60_000;
