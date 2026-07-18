import type { StrengthCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// STRENGTH CARDS (Experience deck) — 8 placeholders, one per Gardner Multiple
// Intelligence. Equipped for a permanent combat `bonus` (unlimited strengths).
// TO EDIT: change names/art, `bonus`, `rank`. The `intelligence` labels are the
// eight Multiple Intelligences per directions.md.
// ─────────────────────────────────────────────────────────────────────────────

export const STRENGTHS: StrengthCard[] = [
  { id: 'str-01', type: 'strength', name: 'Linguistic', art: 'STRENGTH 01', intelligence: 'Linguistic', rank: 1, bonus: 1 },
  { id: 'str-02', type: 'strength', name: 'Logical-Mathematical', art: 'STRENGTH 02', intelligence: 'Logical-Mathematical', rank: 1, bonus: 2 },
  { id: 'str-03', type: 'strength', name: 'Spatial', art: 'STRENGTH 03', intelligence: 'Spatial', rank: 2, bonus: 2 },
  { id: 'str-04', type: 'strength', name: 'Bodily-Kinesthetic', art: 'STRENGTH 04', intelligence: 'Bodily-Kinesthetic', rank: 2, bonus: 3 },
  { id: 'str-05', type: 'strength', name: 'Musical', art: 'STRENGTH 05', intelligence: 'Musical', rank: 1, bonus: 1 },
  { id: 'str-06', type: 'strength', name: 'Interpersonal', art: 'STRENGTH 06', intelligence: 'Interpersonal', rank: 2, bonus: 3 },
  { id: 'str-07', type: 'strength', name: 'Intrapersonal', art: 'STRENGTH 07', intelligence: 'Intrapersonal', rank: 3, bonus: 4 },
  { id: 'str-08', type: 'strength', name: 'Naturalistic', art: 'STRENGTH 08', intelligence: 'Naturalistic', rank: 3, bonus: 5 },
];
