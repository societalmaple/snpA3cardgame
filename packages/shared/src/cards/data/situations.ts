import type { SituationCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// SITUATION CARDS (Situation deck) — 20 placeholders.
//
// TO EDIT: change `name`, `art`, `difficulty`, `reward`, `consequences`, `enhancer`.
// `reward.level` is the ONLY level source that can win the game. Consequences are
// data-driven Effect[] (see ../types.ts). Add/remove entries freely.
// ─────────────────────────────────────────────────────────────────────────────

export const SITUATIONS: SituationCard[] = [
  { id: 'sit-01', type: 'situation', name: 'Situation 01', art: 'SITUATION 01', difficulty: 2, reward: { level: 1, experience: 1 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }] },
  { id: 'sit-02', type: 'situation', name: 'Situation 02', art: 'SITUATION 02', difficulty: 3, reward: { level: 1, experience: 1 }, consequences: [{ type: 'DISCARD_EXPERIENCE', amount: 1 }] },
  { id: 'sit-03', type: 'situation', name: 'Situation 03', art: 'SITUATION 03', difficulty: 3, reward: { level: 1, experience: 1 }, consequences: [{ type: 'DISCARD_SITUATION', amount: 1 }] },
  { id: 'sit-04', type: 'situation', name: 'Situation 04', art: 'SITUATION 04', difficulty: 4, reward: { level: 1, experience: 1 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }] },
  { id: 'sit-05', type: 'situation', name: 'Situation 05', art: 'SITUATION 05', difficulty: 5, reward: { level: 1, experience: 2 }, consequences: [{ type: 'LOSE_STRENGTH', amount: 1 }] },
  { id: 'sit-06', type: 'situation', name: 'Situation 06', art: 'SITUATION 06', difficulty: 6, reward: { level: 1, experience: 1 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }] },
  { id: 'sit-07', type: 'situation', name: 'Situation 07', art: 'SITUATION 07', difficulty: 6, reward: { level: 1, experience: 2 }, consequences: [{ type: 'DISCARD_EXPERIENCE', amount: 1 }] },
  { id: 'sit-08', type: 'situation', name: 'Situation 08', art: 'SITUATION 08', difficulty: 7, reward: { level: 1, experience: 2 }, consequences: [{ type: 'LOSE_FRIEND' }] },
  { id: 'sit-09', type: 'situation', name: 'Situation 09', art: 'SITUATION 09', difficulty: 8, reward: { level: 2, experience: 2 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }, { type: 'DISCARD_EXPERIENCE', amount: 1 }] },
  { id: 'sit-10', type: 'situation', name: 'Situation 10', art: 'SITUATION 10', difficulty: 8, reward: { level: 1, experience: 2 }, consequences: [{ type: 'LOSE_STRENGTH', amount: 1 }] },
  { id: 'sit-11', type: 'situation', name: 'Situation 11', art: 'SITUATION 11', difficulty: 9, reward: { level: 1, experience: 2 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }] },
  { id: 'sit-12', type: 'situation', name: 'Situation 12', art: 'SITUATION 12', difficulty: 10, reward: { level: 2, experience: 2 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }] },
  { id: 'sit-13', type: 'situation', name: 'Situation 13', art: 'SITUATION 13', difficulty: 10, reward: { level: 1, experience: 2 }, consequences: [{ type: 'LOSE_CLUB' }] },
  { id: 'sit-14', type: 'situation', name: 'Situation 14', art: 'SITUATION 14', difficulty: 11, reward: { level: 2, experience: 3 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }, { type: 'LOSE_STRENGTH', amount: 1 }] },
  { id: 'sit-15', type: 'situation', name: 'Situation 15', art: 'SITUATION 15', difficulty: 12, reward: { level: 1, experience: 2 }, consequences: [{ type: 'DISCARD_EXPERIENCE', amount: 2 }] },
  { id: 'sit-16', type: 'situation', name: 'Situation 16', art: 'SITUATION 16', difficulty: 12, reward: { level: 2, experience: 3 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }] },
  { id: 'sit-17', type: 'situation', name: 'Situation 17', art: 'SITUATION 17', difficulty: 13, reward: { level: 2, experience: 3 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }, { type: 'DISCARD_EXPERIENCE', amount: 1 }] },
  { id: 'sit-18', type: 'situation', name: 'Situation 18', art: 'SITUATION 18', difficulty: 14, reward: { level: 2, experience: 3 }, consequences: [{ type: 'LOSE_LEVEL', amount: 2 }] },
  { id: 'sit-19', type: 'situation', name: 'Situation 19', art: 'SITUATION 19', difficulty: 4, reward: { level: 1, experience: 1 }, consequences: [{ type: 'LOSE_LEVEL', amount: 1 }] },
  { id: 'sit-20', type: 'situation', name: 'Situation 20', art: 'SITUATION 20', difficulty: 5, reward: { level: 1, experience: 1 }, consequences: [{ type: 'DISCARD_SITUATION', amount: 1 }] },
];
