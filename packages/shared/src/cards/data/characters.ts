import type { CharacterCard } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER CARDS, 4 unique characters. One dealt to each player; never discarded.
// TO EDIT: change names/art, `passive`, `side`, and `abilityEffects`.
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTERS: CharacterCard[] = [
  {
    id: 'char-01',
    type: 'character',
    name: 'The Deep Diver',
    art: 'THE DEEP DIVER',
    passive: 'Hyperfocus: When a Situation matches an active Strength, gain +2 OR unlock an alternate solution.',
    side: 'a',
    abilityEffects: [
      { type: 'GRANT_SUPPORT_BONUS', amount: 2, condition: 'strength-match' },
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'hyperfocus', description: 'Unlock an alternate solution when Situation matches active Strength' },
    ],
  },
  {
    id: 'char-02',
    type: 'character',
    name: 'The Pattern Finder',
    art: 'THE PATTERN FINDER',
    passive: 'Organizer: When a Situation contains multiple requirements, identify one requirement and reduce difficulty by 1.',
    side: 'b',
    abilityEffects: [
      { type: 'MODIFY_DIFFICULTY', amount: -1, barriers: ['multiple-requirements', 'complex-task'] },
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'identify-requirement', description: 'Identify one requirement in a multi-requirement Situation' },
    ],
  },
  {
    id: 'char-03',
    type: 'character',
    name: 'The Sensory Architect',
    art: 'THE SENSORY ARCHITECT',
    passive: 'Safety in Numbers: May change one environmental barrier on a sensory Situation or help another player choose an environmental solution.',
    side: 'a',
    abilityEffects: [
      { type: 'CHANGE_ENVIRONMENT', removeBarriers: ['sensory', 'noise', 'lighting', 'crowding'] },
      { type: 'GRANT_TEAM_SUPPORT', amount: 2 },
    ],
  },
  {
    id: 'char-04',
    type: 'character',
    name: 'The Empathic Connector',
    art: 'THE EMPATHIC CONNECTOR',
    passive: 'Mutual Support: When helping another player find a solution/support, both gain a bonus.',
    side: 'b',
    abilityEffects: [
      { type: 'GRANT_TEAM_SUPPORT', amount: 2 },
      { type: 'ENABLE_ALTERNATIVE_SOLUTION', solutionType: 'collaborative-finding', description: 'Help another player find a solution or support' },
    ],
  },
];