import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@school-days/shared';

// Socket.IO's client generic order is <ListenEvents, EmitEvents>.
export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): GameSocket {
  // VITE_SERVER_URL overrides; otherwise connect to the same host that served
  // this page (localhost on the dev machine, the LAN IP on other devices).
  const url = import.meta.env.VITE_SERVER_URL ?? `http://${window.location.hostname}:3001`;
  return io(url, { autoConnect: true });
}
