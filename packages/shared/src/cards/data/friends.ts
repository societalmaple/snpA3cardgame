import type { FriendCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// FRIEND CARDS (Experience deck), 6 unique.
// Equipped companion adding a combat `bonus` (default max 1 friend at a time).
// TO EDIT: change names/art, `bonus`, and `supportEffects`.
// ─────────────────────────────────────────────────────────────────────────────

export const FRIENDS: FriendCard[] = [
  {
    id: 'fnd-01',
    type: 'friend',
    name: 'The Active Listener',
    art: 'THE ACTIVE LISTENER',
    bonus: 1,
    supportEffects: [
      { type: 'IGNORE_BARRIER', barriers: ['verbal-communication', 'communication-mismatch'] },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['unclear-expectations', 'verbal-communication'] },
    ],
  },
  {
    id: 'fnd-02',
    type: 'friend',
    name: 'The Detail Checker',
    art: 'THE DETAIL CHECKER',
    bonus: 1,
    supportEffects: [
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['unclear-instructions', 'hidden-curriculum', 'unclear-expectations'] },
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'clarify-requirements', description: 'Identify unclear requirements and reduce difficulty' },
    ],
  },
  {
    id: 'fnd-03',
    type: 'friend',
    name: 'The Calm Anchor',
    art: 'THE CALM ANCHOR',
    bonus: 1,
    supportEffects: [
      { type: 'CANCEL_CONSEQUENCE', consequenceTypes: ['LOSE_LEVEL', 'DISCARD_EXPERIENCE'] },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['sensory', 'stress', 'anxiety', 'emotional-regulation'] },
    ],
  },
  {
    id: 'fnd-04',
    type: 'friend',
    name: 'The Study Partner',
    art: 'THE STUDY PARTNER',
    bonus: 1,
    supportEffects: [
      { type: 'CHANGE_ENVIRONMENT', removeBarriers: ['task-volume', 'prioritization'] },
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'break-down-task', description: 'Break large task into manageable parts' },
    ],
  },
  {
    id: 'fnd-05',
    type: 'friend',
    name: 'The Co-Regulation Companion',
    art: 'THE CO-REGULATION COMPANION',
    bonus: 2,
    supportEffects: [
      { type: 'GRANT_TEAM_SUPPORT', amount: 3 },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['sensory', 'emotional-regulation', 'stress'] },
    ],
  },
  {
    id: 'fnd-06',
    type: 'friend',
    name: 'The Energetic One',
    art: 'THE ENERGETIC ONE',
    bonus: 1,
    supportEffects: [
      { type: 'GRANT_SUPPORT_BONUS', amount: 2, condition: 'movement-regulation' },
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'movement-approach', description: 'Support movement-based regulation or alternate approach' },
    ],
  },
];