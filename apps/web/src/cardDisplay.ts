import { cardOf, type Card, type CardType, type CardInstanceId, type Effect } from '@school-days/shared';

export const TYPE_LABEL: Record<CardType, string> = {
  situation: 'Situation',
  messup: 'Mess-Up',
  club: 'Club',
  levelup: 'Level Up',
  strength: 'Strength',
  friend: 'Friend',
  character: 'Character',
  support: 'Support',
  selfadvocacy: 'Self-Advocacy',
};

/** One-line stat summary shown on a placeholder card. */
export function statLine(card: Card): string {
  switch (card.type) {
    case 'situation':
      return `Diff ${card.baseDifficulty} · reward +${card.reward.level} lvl / ${card.reward.experience} exp`;
    case 'strength':
      return `+${card.bonus} · rank ${card.rank}`;
    case 'friend':
      return `+${card.bonus}`;
    case 'club':
      return `+${card.bonus}`;
    case 'support':
      return `Support (max 2 active)`;
    case 'selfadvocacy':
      return 'Use during a Situation';
    case 'levelup':
      return `+${card.amount} level (can't win)`;
    case 'messup':
      return card.barrier ? `${card.barrier}` : 'Environmental barrier';
    case 'character':
      return card.passive;
  }
}

export function cardName(id: CardInstanceId): string {
  return cardOf(id)?.name ?? id;
}

/** Teaching text for a card, if any. */
export function teachingText(card: Card): string | undefined {
  if (card.type === 'support' || card.type === 'selfadvocacy') return card.teachingText;
  return undefined;
}

/** Human-readable text for a single data-driven effect. */
export function formatEffect(effect: Effect): string {
  switch (effect.type) {
    case 'GAIN_LEVEL':
      return `+${effect.amount} level`;
    case 'LOSE_LEVEL':
      return `−${effect.amount} level`;
    case 'GAIN_EXPERIENCE':
      return `draw ${effect.amount} exp`;
    case 'DISCARD_EXPERIENCE':
      return `discard ${effect.amount} exp`;
    case 'DISCARD_SITUATION':
      return `discard ${effect.amount} situation`;
    case 'LOSE_STRENGTH':
      return `lose ${effect.amount} strength`;
    case 'LOSE_FRIEND':
      return 'lose friend';
    case 'LOSE_CLUB':
      return 'lose club';
    case 'MODIFY_DIFFICULTY':
      return `difficulty ${effect.amount >= 0 ? '+' : ''}${effect.amount}`;
    case 'IGNORE_BARRIER':
      return `ignore ${effect.barriers.join(', ')}`;
    case 'CANCEL_CONSEQUENCE':
      return `cancel ${effect.consequenceTypes.join(', ')}`;
    case 'CHANGE_ENVIRONMENT':
      return `change environment (${effect.removeBarriers.join(', ')})`;
    case 'ENABLE_ALTERNATIVE_SOLUTION':
      return `alternative: ${effect.description}`;
    case 'PREVENT_MESS_UP':
      return 'prevents a Mess-Up';
    case 'GRANT_SUPPORT_BONUS':
      return `+${effect.amount} when ${effect.condition}`;
    case 'GRANT_TEAM_SUPPORT':
      return `+${effect.amount} team support`;
    case 'DRAW_CARD':
      return `draw ${effect.amount} ${effect.deck}`;
    case 'REVEAL_SITUATION':
      return 'reveal the Situation';
    case 'DISCOVER_STRENGTH':
      return 'discover a new approach';
  }
}

/** Comma-separated summary of an effect list (e.g. a situation's consequences). */
export function formatEffects(effects: readonly Effect[]): string {
  return effects.map(formatEffect).join(', ');
}