import { cardOf, type Card, type CardType, type CardInstanceId } from '@school-days/shared';

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
