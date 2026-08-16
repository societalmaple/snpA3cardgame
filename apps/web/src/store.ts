import { create } from 'zustand';
import type { RoomState, PlayerView, Session, Action, ColorPalette } from '@school-days/shared';
import { createSocket, type GameSocket } from './net/socket.ts';
import { PALETTES } from '@school-days/shared';

const STORAGE_KEY = 'school-days-session';
const PALETTE_KEY = 'school-days-palette';
const BACKGROUND_KEY = 'school-days-background';
const FONT_KEY = 'school-days-font';

const BASE = import.meta.env.BASE_URL;
export const BACKGROUNDS = [
  `${BASE}bg1.jpg`,
  `${BASE}bg2.jpg`,
  `${BASE}bg3.jpg`,
  `${BASE}bg4.jpg`,
  `${BASE}bg5.jpg`,
];

export interface FontOption {
  name: string;
  family: string;
  /** Multiplier applied to card text so wider fonts (e.g. OpenDyslexic) keep their layout. */
  scale: number;
}

export const FONTS: FontOption[] = [
  { name: 'System', family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", scale: 1 },
  { name: 'Verdana', family: 'Verdana, Geneva, sans-serif', scale: 1 },
  { name: 'Trebuchet', family: "'Trebuchet MS', Trebuchet, sans-serif", scale: 1 },
  { name: 'Arial', family: 'Arial, Helvetica, sans-serif', scale: 1 },
  { name: 'OpenDyslexic', family: "'OpenDyslexic', Verdana, sans-serif", scale: 0.9 },
];

export function fontScaleOf(font: string): number {
  return FONTS.find((f) => f.family === font)?.scale ?? 1;
}

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

function loadFont(): string | null {
  try {
    const raw = localStorage.getItem(FONT_KEY);
    return raw && FONTS.some((f) => f.family === raw) ? raw : null;
  } catch {
    return null;
  }
}

function saveFont(font: string): void {
  localStorage.setItem(FONT_KEY, font);
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
  font: string;

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
  setFont: (font: string) => void;
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
  | 'setFont'
> = {
  socket: null,
  connected: false,
  session: loadSession(),
  room: null,
  view: null,
  error: null,
  palette: loadPalette() ?? pickRandomPalette(),
  background: loadBackground() ?? BACKGROUNDS[0]!,
  font: loadFont() ?? FONTS[0]!.family,
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

  setFont: (font: string) => {
    saveFont(font);
    set({ font });
  },
}));