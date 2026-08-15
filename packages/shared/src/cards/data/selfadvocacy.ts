import type { SelfAdvocacyCard } from '../types.ts';

export const SELF_ADVOCACY: SelfAdvocacyCard[] = [
  {
    id: 'sad-01',
    type: 'selfadvocacy',
    name: 'Can I Have That in Writing?',
    art: 'CAN I HAVE THAT IN WRITING',
    effects: [
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['verbal-instructions', 'unclear-instructions'] },
      { type: 'CHANGE_ENVIRONMENT', removeBarriers: ['verbal-instructions'], addBarriers: ['written-information'] },
    ],
    teachingText: 'Needing a different format does not mean you understand less.',
  },
  {
    id: 'sad-02',
    type: 'selfadvocacy',
    name: 'I Need More Processing Time',
    art: 'I NEED MORE PROCESSING TIME',
    effects: [
      { type: 'IGNORE_BARRIER', barriers: ['time-pressure'] },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['time-pressure'] },
    ],
    teachingText: 'Asking for processing time is an active skill, not a failure.',
  },
  {
    id: 'sad-03',
    type: 'selfadvocacy',
    name: 'Can We Change the Environment?',
    art: 'CAN WE CHANGE THE ENVIRONMENT',
    effects: [
      { type: 'CHANGE_ENVIRONMENT', removeBarriers: ['sensory', 'noise', 'crowding', 'lighting', 'physical-environment'] },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['sensory', 'environment'] },
    ],
    teachingText: 'Self-advocacy helps others understand what you need to succeed.',
  },
  {
    id: 'sad-04',
    type: 'selfadvocacy',
    name: 'Can I Explain It Another Way?',
    art: 'CAN I EXPLAIN IT ANOTHER WAY',
    effects: [
      { type: 'IGNORE_BARRIER', barriers: ['must-communicate-verbally', 'communication-format'] },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['verbal-communication', 'communication-format'] },
    ],
    teachingText: 'There is more than one way to communicate understanding.',
  },
  {
    id: 'sad-05',
    type: 'selfadvocacy',
    name: 'I Need a Break',
    art: 'I NEED A BREAK',
    effects: [
      { type: 'CANCEL_CONSEQUENCE', consequenceTypes: ['LOSE_LEVEL', 'DISCARD_EXPERIENCE', 'DISCARD_SITUATION'] },
    ],
    teachingText: 'Taking a break can help you return ready to participate.',
  },
  {
    id: 'sad-06',
    type: 'selfadvocacy',
    name: 'What Exactly Is Expected?',
    art: 'WHAT EXACTLY IS EXPECTED',
    effects: [
      { type: 'REVEAL_SITUATION' },
      { type: 'MODIFY_DIFFICULTY', amount: -2, barriers: ['unclear-expectations', 'hidden-curriculum'] },
    ],
    teachingText: 'Clarifying expectations is a valid strategy, not a weakness.',
  },
];