import type { MessUpCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// MESS-UP CARDS (Situation deck) — 5 placeholders.
// Resolve immediately when drawn face-up. `effects` is a data-driven Effect[].
// TO EDIT: change names/art and the `effects` list.
// ─────────────────────────────────────────────────────────────────────────────

export const MESSUPS: MessUpCard[] = [
  { id: 'msu-01', type: 'messup', name: 'Mess-Up 01', art: 'MESS-UP 01', effects: [{ type: 'LOSE_LEVEL', amount: 1 }] },
  { id: 'msu-02', type: 'messup', name: 'Mess-Up 02', art: 'MESS-UP 02', effects: [{ type: 'DISCARD_EXPERIENCE', amount: 1 }] },
  { id: 'msu-03', type: 'messup', name: 'Mess-Up 03', art: 'MESS-UP 03', effects: [{ type: 'LOSE_STRENGTH', amount: 1 }] },
  { id: 'msu-04', type: 'messup', name: 'Mess-Up 04', art: 'MESS-UP 04', effects: [{ type: 'LOSE_FRIEND' }] },
  { id: 'msu-05', type: 'messup', name: 'Mess-Up 05', art: 'MESS-UP 05', effects: [{ type: 'DISCARD_SITUATION', amount: 1 }] },
];
