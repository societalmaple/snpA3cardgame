import { create } from 'zustand';
import type { RoomState, PlayerView, Session, Action, ColorPalette } from '@school-days/shared';
import { createSocket, type GameSocket } from './net/socket.ts';
import { PALETTES } from '@school-days/shared';

const STORAGE_KEY = 'school-days-session';
const PALETTE_KEY = 'school-days-palette';
const BACKGROUND_KEY = 'school-days-background';

export const BACKGROUNDS = ['/bg1.jpg', '/bg2.jpg', '/bg3.jpg', '/bg4.jpg', '/bg5.jpg'];

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

function loadPalette(): ColorPalette | null {
  try {
    const raw = localStorage.getItem(PALETTE_KEY);
    return raw ? (JSON.parse(raw) as ColorPalette) : null;
  } catch {
    return null;
  }
}

function savePalette(palette: ColorPalette): void {
  localStorage.setItem(PALETTE_KEY, JSON.stringify(palette));
}

function pickRandomPalette(): ColorPalette {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)]!;
}

function loadBackground(): string | null {
  try {
    const raw = localStorage.getItem(BACKGROUND_KEY);
    return raw && BACKGROUNDS.includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

function saveBackground(bg: string): void {
  localStorage.setItem(BACKGROUND_KEY, bg);
}

interface Store {
  socket: GameSocket | null;
  connected: boolean;
  session: Session | null;
  room: RoomState | null;
  view: PlayerView | null;
  error: string | null;
  palette: ColorPalette;
  background: string;

  init: () => void;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  sendAction: (action: Action) => void;
  leave: () => void;
  clearError: () => void;
  refreshPalette: () => void;
  setPalette: (palette: ColorPalette) => void;
  refreshBackground: () => void;
}

const initialState: Omit<
  Store,
  | 'init'
  | 'createRoom'
  | 'joinRoom'
  | 'setReady'
  | 'startGame'
  | 'sendAction'
  | 'leave'
  | 'clearError'
  | 'refreshPalette'
  | 'setPalette'
  | 'refreshBackground'
> = {
  socket: null,
  connected: false,
  session: loadSession(),
  room: null,
  view: null,
  error: null,
  palette: loadPalette() ?? pickRandomPalette(),
  background: loadBackground() ?? BACKGROUNDS[0]!,
};

export const useStore = create<Store>((set, get) => ({
  ...initialState,

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

  refreshPalette: () => {
    const newPalette = pickRandomPalette();
    savePalette(newPalette);
    set({ palette: newPalette });
  },

  setPalette: (palette: ColorPalette) => {
    savePalette(palette);
    set({ palette });
  },

  refreshBackground: () => {
    let next = get().background;
    while (next === get().background) {
      next = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]!;
    }
    saveBackground(next);
    set({ background: next });
  },
}));