import type { CharacterCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER CARDS — 4 placeholders. One dealt to each player; never discarded.
// `passive` is placeholder text for now; wire numeric passive hooks into the engine
// later if desired. Each has a male/female `side` per spec (placeholder only).
// TO EDIT: change names/art, `passive`, `side`.
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTERS: CharacterCard[] = [
  { id: 'char-01', type: 'character', name: 'Character 01', art: 'CHARACTER 01', passive: 'Placeholder passive 01.', side: 'a' },
  { id: 'char-02', type: 'character', name: 'Character 02', art: 'CHARACTER 02', passive: 'Placeholder passive 02.', side: 'b' },
  { id: 'char-03', type: 'character', name: 'Character 03', art: 'CHARACTER 03', passive: 'Placeholder passive 03.', side: 'a' },
  { id: 'char-04', type: 'character', name: 'Character 04', art: 'CHARACTER 04', passive: 'Placeholder passive 04.', side: 'b' },
];
