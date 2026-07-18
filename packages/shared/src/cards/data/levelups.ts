import type { LevelUpCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// GO-UP-A-LEVEL CARDS (Situation deck) — 4 placeholders.
// Instantly raise Well-Being Level by `amount`, but can NEVER be the winning level
// (the engine caps non-combat level gains below TARGET_LEVEL).
// TO EDIT: change names/art and `amount`.
// ─────────────────────────────────────────────────────────────────────────────

export const LEVELUPS: LevelUpCard[] = [
  { id: 'lvl-01', type: 'levelup', name: 'Go Up A Level 01', art: 'LEVEL UP 01', amount: 1 },
  { id: 'lvl-02', type: 'levelup', name: 'Go Up A Level 02', art: 'LEVEL UP 02', amount: 1 },
  { id: 'lvl-03', type: 'levelup', name: 'Go Up A Level 03', art: 'LEVEL UP 03', amount: 1 },
  { id: 'lvl-04', type: 'levelup', name: 'Go Up A Level 04', art: 'LEVEL UP 04', amount: 1 },
];
