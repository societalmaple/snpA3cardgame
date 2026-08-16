import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { GAME_NAME, type ClientToServerEvents, type ServerToClientEvents } from '@school-days/shared';
import { RoomManager, type Room } from './rooms.ts';

interface SocketData {
  code?: string;
  playerId?: string;
}

const PORT = Number(process.env.PORT ?? 3001);
const manager = new RoomManager();

const httpServer = createServer((req, res) => {
  // Friendly HTTP responses so the server is browsable and uptime monitors
  // (UptimeRobot etc.) get a 200 instead of a 404 "Cannot GET /".
  const body = `${GAME_NAME} server is running. Connect over Socket.IO.`;
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
  // Local dev only: reflect the Vite dev origin. Tighten this for any real deploy.
  cors: { origin: true, methods: ['GET', 'POST'] },
});

httpServer.listen(PORT);

function broadcastViews(room: Room): void {
  if (!room.game) return;
  for (const m of manager.connectedMembers(room)) {
    const view = manager.viewFor(room, m.playerId);
    if (view && m.socketId) io.to(m.socketId).emit('game:view', view);
  }
}

function broadcastRoom(room: Room): void {
  io.to(room.code).emit('room:state', manager.toRoomState(room));
  broadcastViews(room);
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ name }, cb) => {
    const res = manager.createRoom(name);
    if (!res.ok) return cb({ ok: false, error: res.error });
    const { room, session } = res.data;
    socket.data.code = room.code;
    socket.data.playerId = session.playerId;
    socket.join(room.code);
    manager.bindSocket(room.code, session.playerId, socket.id);
    cb({ ok: true, data: session });
    broadcastRoom(room);
  });

  socket.on('room:join', ({ code, name }, cb) => {
    const res = manager.joinRoom(code, name);
    if (!res.ok) return cb({ ok: false, error: res.error });
    const { room, session } = res.data;
    socket.data.code = room.code;
    socket.data.playerId = session.playerId;
    socket.join(room.code);
    manager.bindSocket(room.code, session.playerId, socket.id);
    cb({ ok: true, data: session });
    broadcastRoom(room);
  });

  socket.on('room:reconnect', ({ code, playerId, token }, cb) => {
    const res = manager.reconnect(code, playerId, token);
    if (!res.ok) return cb({ ok: false, error: res.error });
    const { room, session } = res.data;
    socket.data.code = room.code;
    socket.data.playerId = session.playerId;
    socket.join(room.code);
    manager.bindSocket(room.code, session.playerId, socket.id);
    cb({ ok: true, data: session });
    // Send current state directly to the reconnecting socket, then refresh everyone.
    socket.emit('room:state', manager.toRoomState(room));
    const view = manager.viewFor(room, session.playerId);
    if (view) socket.emit('game:view', view);
    broadcastRoom(room);
  });

  socket.on('room:ready', ({ ready }) => {
    const { code, playerId } = socket.data;
    if (!code || !playerId) return;
    const res = manager.setReady(code, playerId, ready);
    if (res.ok) broadcastRoom(res.data);
  });

  socket.on('room:start', (cb) => {
    const { code, playerId } = socket.data;
    if (!code || !playerId) return cb({ ok: false, error: 'Not in a room.' });
    const res = manager.start(code, playerId);
    if (!res.ok) return cb({ ok: false, error: res.error });
    cb({ ok: true, data: null });
    broadcastRoom(res.data);
  });

  socket.on('game:action', (action, cb) => {
    const { code, playerId } = socket.data;
    if (!code || !playerId) return cb({ ok: false, error: 'Not in a room.' });
    const res = manager.applyGameAction(code, playerId, action);
    if (!res.ok) {
      socket.emit('error:msg', res.error);
      return cb({ ok: false, error: res.error });
    }
    cb({ ok: true, data: null });
    broadcastRoom(res.data);
  });

  socket.on('room:leave', () => {
    const room = manager.leaveRoom(socket.id);
    socket.data.code = undefined;
    socket.data.playerId = undefined;
    if (room) {
      socket.leave(room.code);
      broadcastRoom(room);
    }
  });

  socket.on('disconnect', () => {
    const room = manager.disconnectSocket(socket.id);
    if (room) broadcastRoom(room);
  });
});

console.log(`${GAME_NAME} server listening on http://localhost:${PORT}`);
