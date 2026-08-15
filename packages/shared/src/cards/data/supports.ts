import type { SupportCard } from '../types.ts';

export const SUPPORTS: SupportCard[] = [
  {
    id: 'sup-01',
    type: 'support',
    name: 'Written Instructions',
    art: 'WRITTEN INSTRUCTIONS',
    effects: [
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['verbal-instructions', 'unclear-instructions', 'lengthy-instructions'] },
    ],
    teachingText: 'Changing the format of information can remove a barrier.',
  },
  {
    id: 'sup-02',
    type: 'support',
    name: 'Extra Processing Time',
    art: 'EXTRA PROCESSING TIME',
    effects: [
      { type: 'IGNORE_BARRIER', barriers: ['time-pressure'] },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['time-pressure'] },
    ],
    teachingText: 'Needing more processing time is not the same as lacking ability.',
  },
  {
    id: 'sup-03',
    type: 'support',
    name: 'Quiet Workspace',
    art: 'QUIET WORKSPACE',
    effects: [
      { type: 'MODIFY_DIFFICULTY', amount: -3, barriers: ['sensory', 'noise'] },
      { type: 'PREVENT_MESS_UP', messUpIds: ['msu-02'] },
    ],
    teachingText: 'Changing the environment can improve access to existing abilities.',
  },
  {
    id: 'sup-04',
    type: 'support',
    name: 'Noise Reduction',
    art: 'NOISE REDUCTION',
    effects: [
      { type: 'IGNORE_BARRIER', barriers: ['noise', 'sensory-overload'] },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['sensory', 'crowding'] },
    ],
    teachingText: 'Reducing sensory barriers allows participation.',
  },
  {
    id: 'sup-05',
    type: 'support',
    name: 'Visual Schedule',
    art: 'VISUAL SCHEDULE',
    effects: [
      { type: 'MODIFY_DIFFICULTY', amount: -3, barriers: ['routine-change', 'unpredictability', 'scheduling'] },
      { type: 'PREVENT_MESS_UP', messUpIds: ['msu-01'] },
    ],
    teachingText: 'Predictability and visual information can support functioning.',
  },
  {
    id: 'sup-06',
    type: 'support',
    name: 'Movement Break',
    art: 'MOVEMENT BREAK',
    effects: [
      { type: 'CANCEL_CONSEQUENCE', consequenceTypes: ['LOSE_LEVEL', 'DISCARD_EXPERIENCE'] },
      { type: 'GRANT_SUPPORT_BONUS', amount: 2, condition: 'burnout-stress' },
    ],
    teachingText: 'Regulation strategies can support performance.',
  },
  {
    id: 'sup-07',
    type: 'support',
    name: 'Alternative Communication',
    art: 'ALTERNATIVE COMMUNICATION',
    effects: [
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['verbal-communication', 'communication-format'] },
      { type: 'IGNORE_BARRIER', barriers: ['must-communicate-verbally'] },
    ],
    teachingText: 'Communication ability is broader than one communication method.',
  },
  {
    id: 'sup-08',
    type: 'support',
    name: 'Flexible Seating',
    art: 'FLEXIBLE SEATING',
    effects: [
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['physical-environment', 'classroom', 'sensory'] },
      { type: 'CANCEL_CONSEQUENCE', consequenceTypes: ['LOSE_CLUB', 'LOSE_FRIEND'] },
    ],
    teachingText: 'The physical environment can be adapted.',
  },
  {
    id: 'sup-09',
    type: 'support',
    name: 'Assistive Technology',
    art: 'ASSISTIVE TECHNOLOGY',
    effects: [
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['sensory', 'communication', 'executive-function', 'reading', 'writing'] },
    ],
    teachingText: 'Tools can provide access without changing the person\'s underlying abilities.',
  },
  {
    id: 'sup-10',
    type: 'support',
    name: 'Advance Notice',
    art: 'ADVANCE NOTICE',
    effects: [
      { type: 'REVEAL_SITUATION' },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['unexpected-change', 'routine-change'] },
      { type: 'PREVENT_MESS_UP', messUpIds: ['msu-01'] },
    ],
    teachingText: 'Preparation can remove a barrier.',
  },
];