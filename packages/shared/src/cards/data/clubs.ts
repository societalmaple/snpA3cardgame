import type { ClubCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// CLUB CARDS (Situation deck) — 7 placeholders.
// Equipped for a persistent combat `bonus` (default max 1 club at a time).
// TO EDIT: change names/art and `bonus`.
// ─────────────────────────────────────────────────────────────────────────────

export const CLUBS: ClubCard[] = [
  { id: 'club-01', type: 'club', name: 'Club 01', art: 'CLUB 01', bonus: 1 },
  { id: 'club-02', type: 'club', name: 'Club 02', art: 'CLUB 02', bonus: 1 },
  { id: 'club-03', type: 'club', name: 'Club 03', art: 'CLUB 03', bonus: 2 },
  { id: 'club-04', type: 'club', name: 'Club 04', art: 'CLUB 04', bonus: 2 },
  { id: 'club-05', type: 'club', name: 'Club 05', art: 'CLUB 05', bonus: 2 },
  { id: 'club-06', type: 'club', name: 'Club 06', art: 'CLUB 06', bonus: 3 },
  { id: 'club-07', type: 'club', name: 'Club 07', art: 'CLUB 07', bonus: 3 },
];
