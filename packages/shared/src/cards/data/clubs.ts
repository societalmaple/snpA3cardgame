import type { ClubCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// CLUB CARDS (Situation deck), 7 unique.
// Equipped for a persistent combat `bonus` (default max 1 club at a time).
// TO EDIT: change names/art, `bonus`, and `communityEffects`.
// ─────────────────────────────────────────────────────────────────────────────

export const CLUBS: ClubCard[] = [
  {
    id: 'club-01',
    type: 'club',
    name: 'Robotics & Coding',
    art: 'ROBOTICS & CODING',
    bonus: 1,
    communityEffects: [
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'problem-decomposition', description: 'Collaborative technical problem solving through decomposition' },
      { type: 'GRANT_TEAM_SUPPORT', amount: 2 },
    ],
  },
  {
    id: 'club-02',
    type: 'club',
    name: 'Creative Writing & TTRPG',
    art: 'CREATIVE WRITING & TTRPG',
    bonus: 1,
    communityEffects: [
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'alternative-communication', description: 'Creative and narrative approaches to communication' },
      { type: 'IGNORE_BARRIER', barriers: ['communication-format', 'must-communicate-verbally'] },
    ],
  },
  {
    id: 'club-03',
    type: 'club',
    name: 'Esports & Strategy Gaming',
    art: 'ESPORTS & STRATEGY GAMING',
    bonus: 1,
    communityEffects: [
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'planning-pattern-recognition', description: 'Strategic planning and pattern recognition approaches' },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['planning', 'sequencing', 'patterned-information'] },
    ],
  },
  {
    id: 'club-04',
    type: 'club',
    name: 'Maker Space & Crafting',
    art: 'MAKER SPACE & CRAFTING',
    bonus: 1,
    communityEffects: [
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'hands-on-visual', description: 'Hands-on and visual problem-solving approaches' },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['hands-on-problem-solving', 'visual-structure', 'physical-space'] },
    ],
  },
  {
    id: 'club-05',
    type: 'club',
    name: 'Peer Advocacy Network',
    art: 'PEER ADVOCACY NETWORK',
    bonus: 1,
    communityEffects: [
      { type: 'GRANT_SUPPORT_BONUS', amount: 2, condition: 'self-advocacy' },
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'self-advocacy-support', description: 'Improves Self-Advocacy and support effects' },
    ],
  },
  {
    id: 'club-06',
    type: 'club',
    name: 'Nature & Stargazing',
    art: 'NATURE & STARGAZING',
    bonus: 1,
    communityEffects: [
      { type: 'CHANGE_ENVIRONMENT', removeBarriers: ['sensory-overload', 'artificial-environment', 'indoor-stress'] },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['sensory-regulation', 'grounding', 'environment'] },
    ],
  },
  {
    id: 'club-07',
    type: 'club',
    name: 'Music Jam',
    art: 'MUSIC JAM',
    bonus: 1,
    communityEffects: [
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'rhythm-collaboration', description: 'Rhythm-based regulation and collaborative music-making' },
      { type: 'GRANT_TEAM_SUPPORT', amount: 2 },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['rhythm', 'timing', 'emotional-regulation', 'sensory-regulation'] },
    ],
  },
];