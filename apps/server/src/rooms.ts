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

const MAX_NAME_LENGTH = 16;

/**
 * Names are checked before they are stored: non-empty, short, and free of
 * profanity. Terms are listed in normalized form (letter-substitution tricks
 * like "5" for "s" are folded before matching).
 */
const PROFANITY: readonly string[] = [
  'anal', 'anus', 'arse', 'arsehole', 'ass', 'asshole', 'bastard', 'bitch', 'blowjob', 'boobs',
  'boner', 'bollocks', 'bullshit', 'clit', 'cock', 'cocksucker', 'cum', 'cunt', 'dick',
  'dickhead', 'dildo', 'douche', 'fag', 'faggot', 'fanny', 'fuck', 'fucker', 'fucking',
  'fucked', 'fuk', 'fck', 'fuq', 'fxck', 'gangbang', 'genitals', 'hentai', 'hoe', 'hooker',
  'horny', 'jackass', 'jizz', 'kike', 'masturbate', 'motherfucker', 'nazi', 'nigga', 'nigger',
  'nude', 'nudity', 'piss', 'porn', 'porno', 'prostitute', 'pussy', 'rape', 'raped', 'raping',
  'retard', 'scrotum', 'sex', 'sexy', 'shit', 'shitty', 'slut', 'sperm', 'spic', 'tits',
  'titty', 'twat', 'vagina', 'viagra', 'wanker', 'whore', 'wtf', 'xxx',
];

function normalizeForProfanity(name: string): string {
  return name
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/[$]/g, 's')
    .replace(/[@]/g, 'a')
    .replace(/[^a-z0-9 ]/g, ' ');
}

function containsProfanity(name: string): boolean {
  const normalized = normalizeForProfanity(name);
  return PROFANITY.some((term) => new RegExp(`\\b${term}\\b`).test(normalized));
}

/** Trim + validate a display name. */
function validateName(name: string): Result<string> {
  const trimmed = name.trim();
  if (!trimmed) return fail('Name is required.');
  if (trimmed.length > MAX_NAME_LENGTH) return fail(`Name is too long (max ${MAX_NAME_LENGTH} characters).`);
  if (containsProfanity(trimmed)) return fail('That name contains inappropriate language.');
  return ok(trimmed);
}

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
    const nameRes = validateName(name);
    if (!nameRes.ok) return fail(nameRes.error);
    const trimmed = nameRes.data;
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
    const nameRes = validateName(name);
    if (!nameRes.ok) return fail(nameRes.error);
    const trimmed = nameRes.data;
    if (!room) return fail('Room not found.');
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
        this.endIfAbandoned(room);
        return room;
      }
    }
    return null;
  }

  /** Hard leave: removes the member from the room entirely (Leave buttons). */
  leaveRoom(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      const m = room.members.find((x) => x.socketId === socketId);
      if (m) {
        this.removeMember(room, m.playerId);
        this.endIfAbandoned(room);
        return room;
      }
    }
    return null;
  }

  private removeMember(room: Room, playerId: string): void {
    room.members = room.members.filter((m) => m.playerId !== playerId);
    if (room.members.length === 0) {
      this.rooms.delete(room.code);
      return;
    }
    this.reassignHost(room);
  }

  /** If the host is gone, promote the first still-connected member. */
  private reassignHost(room: Room): void {
    if (room.members.some((m) => m.playerId === room.hostId && m.connected)) return;
    const next = room.members.find((m) => m.connected);
    if (next) room.hostId = next.playerId;
  }

  /**
   * A game needs MIN_PLAYERS connected players to remain playable. When drops leave
   * fewer than that, abandon the game and send whoever is left back to the lobby.
   * Offline members are dropped so the room can be restarted cleanly.
   */
  private endIfAbandoned(room: Room): void {
    if (room.phase !== 'in_game') return;
    if (room.members.filter((m) => m.connected).length >= MIN_PLAYERS) return;
    room.game = null;
    room.phase = 'lobby';
    room.members = room.members.filter((m) => m.connected);
    room.members.forEach((m) => (m.ready = false));
    this.reassignHost(room);
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
