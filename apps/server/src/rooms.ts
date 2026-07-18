import { randomUUID, randomInt } from 'node:crypto';
import {
  createGame,
  applyAction,
  redactFor,
  MIN_PLAYERS,
  MAX_PLAYERS,
  ROOM_CODE_LENGTH,
  type GameState,
  type Action,
  type RoomState,
  type RoomPhase,
  type Session,
  type PlayerView,
} from '@school-days/shared';

interface RoomMember {
  playerId: string;
  name: string;
  token: string;
  ready: boolean;
  connected: boolean;
  socketId: string | null;
}

interface Room {
  code: string;
  hostId: string;
  phase: RoomPhase;
  members: RoomMember[];
  game: GameState | null;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const ok = <T>(data: T): Result<T> => ({ ok: true, data });
const fail = (error: string): Result<never> => ({ ok: false, error });

/** In-memory authority for all rooms. Nothing is persisted (per the plan). */
export class RoomManager {
  private rooms = new Map<string, Room>();

  private freshCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
    for (let attempt = 0; attempt < 1000; attempt++) {
      let code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += alphabet[randomInt(0, alphabet.length)];
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Could not allocate a room code');
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  createRoom(name: string): Result<{ room: Room; session: Session }> {
    const trimmed = name.trim();
    if (!trimmed) return fail('Name is required.');
    const code = this.freshCode();
    const playerId = randomUUID();
    const token = randomUUID();
    const room: Room = {
      code,
      hostId: playerId,
      phase: 'lobby',
      members: [{ playerId, name: trimmed, token, ready: false, connected: true, socketId: null }],
      game: null,
    };
    this.rooms.set(code, room);
    return ok({ room, session: { playerId, token, roomCode: code } });
  }

  joinRoom(code: string, name: string): Result<{ room: Room; session: Session }> {
    const room = this.rooms.get(code.toUpperCase());
    const trimmed = name.trim();
    if (!room) return fail('Room not found.');
    if (!trimmed) return fail('Name is required.');
    if (room.phase !== 'lobby') return fail('That game has already started.');
    if (room.members.length >= MAX_PLAYERS) return fail('Room is full.');

    const playerId = randomUUID();
    const token = randomUUID();
    room.members.push({ playerId, name: trimmed, token, ready: false, connected: true, socketId: null });
    return ok({ room, session: { playerId, token, roomCode: room.code } });
  }

  reconnect(code: string, playerId: string, token: string): Result<{ room: Room; session: Session }> {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return fail('Room not found.');
    const member = room.members.find((m) => m.playerId === playerId);
    if (!member || member.token !== token) return fail('Invalid session.');
    member.connected = true;
    if (room.game) room.game = setConnected(room.game, playerId, true);
    return ok({ room, session: { playerId, token, roomCode: room.code } });
  }

  bindSocket(code: string, playerId: string, socketId: string): void {
    const m = this.member(code, playerId);
    if (m) m.socketId = socketId;
  }

  setReady(code: string, playerId: string, ready: boolean): Result<Room> {
    const room = this.rooms.get(code);
    if (!room) return fail('Room not found.');
    const m = room.members.find((x) => x.playerId === playerId);
    if (!m) return fail('You are not in this room.');
    m.ready = ready;
    return ok(room);
  }

  start(code: string, playerId: string): Result<Room> {
    const room = this.rooms.get(code);
    if (!room) return fail('Room not found.');
    if (room.phase !== 'lobby') return fail('The game has already started.');
    if (playerId !== room.hostId) return fail('Only the host can start the game.');
    if (room.members.length < MIN_PLAYERS) return fail(`Need at least ${MIN_PLAYERS} players.`);
    if (!room.members.every((m) => m.ready)) return fail('All players must be ready.');

    const seed = randomInt(0, 2 ** 31 - 1);
    room.game = createGame(room.members.map((m) => ({ id: m.playerId, name: m.name })), seed);
    room.phase = 'in_game';
    return ok(room);
  }

  applyGameAction(code: string, playerId: string, action: Action): Result<Room> {
    const room = this.rooms.get(code);
    if (!room) return fail('Room not found.');
    if (room.phase !== 'in_game' || !room.game) return fail('No game in progress.');
    // Authority: force the action's playerId to the authenticated sender.
    const res = applyAction(room.game, { ...action, playerId });
    if (!res.ok) return fail(res.error);
    room.game = res.state;
    if (res.state.phase === 'game_over') room.phase = 'ended';
    return ok(room);
  }

  /** Mark a socket's player disconnected; returns the affected room, if any. */
  disconnectSocket(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      const m = room.members.find((x) => x.socketId === socketId);
      if (m) {
        m.connected = false;
        m.socketId = null;
        if (room.game) room.game = setConnected(room.game, m.playerId, false);
        return room;
      }
    }
    return null;
  }

  private member(code: string, playerId: string): RoomMember | undefined {
    return this.rooms.get(code)?.members.find((m) => m.playerId === playerId);
  }

  toRoomState(room: Room): RoomState {
    return {
      code: room.code,
      phase: room.phase,
      hostId: room.hostId,
      players: room.members.map((m) => ({
        id: m.playerId,
        name: m.name,
        ready: m.ready,
        connected: m.connected,
        isHost: m.playerId === room.hostId,
      })),
    };
  }

  viewFor(room: Room, playerId: string): PlayerView | null {
    return room.game ? redactFor(room.game, playerId) : null;
  }

  connectedMembers(room: Room): RoomMember[] {
    return room.members.filter((m) => m.connected && m.socketId);
  }
}

function setConnected(game: GameState, playerId: string, connected: boolean): GameState {
  return { ...game, players: game.players.map((p) => (p.id === playerId ? { ...p, connected } : p)) };
}

export type { Room, RoomMember };
