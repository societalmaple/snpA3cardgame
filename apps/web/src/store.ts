import { create } from 'zustand';
import type { RoomState, PlayerView, Session, Action } from '@school-days/shared';
import { createSocket, type GameSocket } from './net/socket.ts';

const STORAGE_KEY = 'school-days-session';

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

interface Store {
  socket: GameSocket | null;
  connected: boolean;
  session: Session | null;
  room: RoomState | null;
  view: PlayerView | null;
  error: string | null;

  init: () => void;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  sendAction: (action: Action) => void;
  leave: () => void;
  clearError: () => void;
}

export const useStore = create<Store>((set, get) => ({
  socket: null,
  connected: false,
  session: loadSession(),
  room: null,
  view: null,
  error: null,

  init: () => {
    if (get().socket) return; // once only
    const socket = createSocket();

    socket.on('connect', () => {
      set({ connected: true });
      // Attempt to resume a prior session (survives page refresh while server is up).
      const session = get().session;
      if (session) {
        socket.emit('room:reconnect', { code: session.roomCode, playerId: session.playerId, token: session.token }, (res) => {
          if (!res.ok) {
            saveSession(null);
            set({ session: null, room: null, view: null });
          }
        });
      }
    });

    socket.on('disconnect', () => set({ connected: false }));
    socket.on('room:state', (room) => set({ room }));
    socket.on('game:view', (view) => set({ view }));
    socket.on('error:msg', (message) => set({ error: message }));

    set({ socket });
  },

  createRoom: (name) => {
    get().socket?.emit('room:create', { name }, (res) => {
      if (res.ok) {
        saveSession(res.data);
        set({ session: res.data, error: null });
      } else set({ error: res.error });
    });
  },

  joinRoom: (code, name) => {
    get().socket?.emit('room:join', { code: code.toUpperCase(), name }, (res) => {
      if (res.ok) {
        saveSession(res.data);
        set({ session: res.data, error: null });
      } else set({ error: res.error });
    });
  },

  setReady: (ready) => get().socket?.emit('room:ready', { ready }),

  startGame: () =>
    get().socket?.emit('room:start', (res) => {
      if (!res.ok) set({ error: res.error });
    }),

  sendAction: (action) =>
    get().socket?.emit('game:action', action, (res) => {
      if (!res.ok) set({ error: res.error });
    }),

  leave: () => {
    get().socket?.emit('room:leave');
    saveSession(null);
    set({ session: null, room: null, view: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
