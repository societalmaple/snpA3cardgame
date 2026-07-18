import { cardOf, type Card, type CardType, type CardInstanceId, type Effect } from '@school-days/shared';

export const TYPE_LABEL: Record<CardType, string> = {
  situation: 'Situation',
  messup: 'Mess-Up',
  club: 'Club',
  levelup: 'Level Up',
  strength: 'Strength',
  friend: 'Friend',
  character: 'Character',
};

/** One-line stat summary shown on a placeholder card. */
export function statLine(card: Card): string {
  switch (card.type) {
    case 'situation':
      return `Diff ${card.difficulty} · reward +${card.reward.level} lvl / ${card.reward.experience} exp`;
    case 'strength':
      return `+${card.bonus} · rank ${card.rank}`;
    case 'friend':
      return `+${card.bonus}`;
    case 'club':
      return `+${card.bonus}`;
    case 'levelup':
      return `+${card.amount} level (can't win)`;
    case 'messup':
      return `${card.effects.length} effect(s)`;
    case 'character':
      return card.passive;
  }
}

export function cardName(id: CardInstanceId): string {
  return cardOf(id)?.name ?? id;
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
  }
}

/** Comma-separated summary of an effect list (e.g. a situation's consequences). */
export function formatEffects(effects: readonly Effect[]): string {
  return effects.map(formatEffect).join(', ');
}
