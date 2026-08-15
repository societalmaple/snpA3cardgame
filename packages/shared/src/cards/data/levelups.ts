import type { LevelUpCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// GO-UP-A-LEVEL CARDS (Situation deck), 4 unique.
// Instantly raise Well-Being Level by `amount`, but can NEVER be the winning level
// (the engine caps non-combat level gains below TARGET_LEVEL).
// TO EDIT: change names/art, `amount`, and `wellBeingEffect`.
// ─────────────────────────────────────────────────────────────────────────────

export const LEVELUPS: LevelUpCard[] = [
  {
    id: 'lvl-01',
    type: 'levelup',
    name: 'Breakthrough Realization',
    art: 'BREAKTHROUGH REALIZATION',
    amount: 1,
    wellBeingEffect: 'Gain +1 Well-Being. If you discovered a new Strength or successful strategy this turn, draw 1 Experience.',
  },
  {
    id: 'lvl-02',
    type: 'levelup',
    name: 'Finding Your Group',
    art: 'FINDING YOUR GROUP',
    amount: 1,
    wellBeingEffect: 'Gain +1 Well-Being. If you solved a Situation collaboratively, gain an additional benefit.',
  },
  {
    id: 'lvl-03',
    type: 'levelup',
    name: 'Mastered Routine',
    art: 'MASTERED ROUTINE',
    amount: 1,
    wellBeingEffect: 'Gain +1 Well-Being. If you successfully used a Support or environmental strategy, gain 1 Experience.',
  },
  {
    id: 'lvl-04',
    type: 'levelup',
    name: 'Self-Acceptance',
    art: 'SELF-ACCEPTANCE',
    amount: 1,
    wellBeingEffect: 'Gain +1 Well-Being. This card explicitly reinforces that the goal is not conforming to a single standard of functioning.',
  },
];