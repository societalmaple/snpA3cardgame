import type { MessUpCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// MESS-UP CARDS (Situation deck), 5 unique.
// Resolve immediately when drawn face-up. Now represent *environmental/support
// barriers* rather than personal failure. Each has `mitigation` options, players
// can use Supports, Self-Advocacy, Strengths, or Friends to remove the barrier.
// Without mitigation, a SMALL TEMPORARY penalty is applied (never permanent loss).
// ─────────────────────────────────────────────────────────────────────────────

export const MESSUPS: MessUpCard[] = [
  {
    id: 'msu-01',
    type: 'messup',
    name: 'Unexpected Routine Change',
    art: 'UNEXPECTED ROUTINE CHANGE',
    barrier: 'The environment changed without notice.',
    mitigation: {
      barrier: 'routine-change',
      supports: ['sup-05', 'sup-10'],
      selfAdvocacy: ['sad-02'],
      strengths: ['str-07'],
      friends: [],
    },
    effects: [],
    unmitigated: [{ type: 'MODIFY_DIFFICULTY', amount: 1, barriers: ['routine-change'] }],
  },
  {
    id: 'msu-02',
    type: 'messup',
    name: 'Sensory Overload Spot',
    art: 'SENSORY OVERLOAD SPOT',
    barrier: 'The environment is overwhelming.',
    mitigation: {
      barrier: 'sensory',
      supports: ['sup-04', 'sup-03', 'sup-08', 'sup-06'],
      selfAdvocacy: ['sad-03'],
      strengths: ['str-08', 'str-05'],
      friends: ['fnd-03'],
    },
    effects: [],
    unmitigated: [{ type: 'MODIFY_DIFFICULTY', amount: 2, barriers: ['sensory'] }],
  },
  {
    id: 'msu-03',
    type: 'messup',
    name: 'Miscommunication Glitch',
    art: 'MISCOMMUNICATION GLITCH',
    barrier: 'The intended message was misunderstood.',
    mitigation: {
      barrier: 'communication',
      supports: ['sup-07'],
      selfAdvocacy: ['sad-04'],
      strengths: ['str-01', 'str-06'],
      friends: ['fnd-01'],
    },
    effects: [],
    unmitigated: [{ type: 'MODIFY_DIFFICULTY', amount: 2, barriers: ['communication'] }],
  },
  {
    id: 'msu-04',
    type: 'messup',
    name: 'Burnout',
    art: 'BURNOUT',
    barrier: 'The player needs recovery.',
    mitigation: {
      barrier: 'burnout',
      supports: ['sup-06'],
      selfAdvocacy: ['sad-05'],
      strengths: ['str-07'],
      friends: ['fnd-03', 'fnd-05'],
    },
    effects: [],
    unmitigated: [{ type: 'MODIFY_DIFFICULTY', amount: 2, barriers: ['burnout'] }],
  },
  {
    id: 'msu-05',
    type: 'messup',
    name: 'Lost Accommodation',
    art: 'LOST ACCOMMODATION',
    barrier: 'A support or environment is temporarily unavailable.',
    mitigation: {
      barrier: 'lost-support',
      supports: ['sup-01', 'sup-02', 'sup-03', 'sup-04', 'sup-05', 'sup-06', 'sup-07', 'sup-08', 'sup-09', 'sup-10'],
      selfAdvocacy: ['sad-01', 'sad-03', 'sad-06'],
      strengths: [],
      friends: ['fnd-01', 'fnd-02'],
    },
    effects: [],
    unmitigated: [{ type: 'MODIFY_DIFFICULTY', amount: 2, barriers: ['lost-support'] }],
  },
];