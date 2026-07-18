import type { FriendCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// FRIEND CARDS (Experience deck) — 6 placeholders.
// Equipped companion adding a combat `bonus` (default max 1 friend at a time).
// TO EDIT: change names/art and `bonus`.
// ─────────────────────────────────────────────────────────────────────────────

export const FRIENDS: FriendCard[] = [
  { id: 'fnd-01', type: 'friend', name: 'Friend 01', art: 'FRIEND 01', bonus: 1 },
  { id: 'fnd-02', type: 'friend', name: 'Friend 02', art: 'FRIEND 02', bonus: 2 },
  { id: 'fnd-03', type: 'friend', name: 'Friend 03', art: 'FRIEND 03', bonus: 2 },
  { id: 'fnd-04', type: 'friend', name: 'Friend 04', art: 'FRIEND 04', bonus: 3 },
  { id: 'fnd-05', type: 'friend', name: 'Friend 05', art: 'FRIEND 05', bonus: 3 },
  { id: 'fnd-06', type: 'friend', name: 'Friend 06', art: 'FRIEND 06', bonus: 4 },
];
