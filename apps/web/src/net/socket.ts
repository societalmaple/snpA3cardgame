import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@school-days/shared';

// Socket.IO's client generic order is <ListenEvents, EmitEvents>.
export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): GameSocket {
  const url = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
  return io(url, { autoConnect: true });
}
