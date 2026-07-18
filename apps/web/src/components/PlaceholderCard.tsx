import { cardOf, type CardInstanceId } from '@school-days/shared';
import { TYPE_LABEL, statLine, formatEffects } from '../cardDisplay.ts';
import styles from './PlaceholderCard.module.css';

interface Props {
  id: CardInstanceId;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Renders a single card as a labelled placeholder. When real art is ready, swap the
 * `.art` block below for an <img> keyed off the card's definition id (defIdOf(id)).
 */
export function PlaceholderCard({ id, onClick, selected, disabled, size = 'md' }: Props) {
  const card = cardOf(id);
  if (!card) return <div className={styles.card}>Unknown card</div>;

  const clickable = !!onClick && !disabled;
  const className = [
    styles.card,
    styles[size],
    selected ? styles.selected : '',
    disabled ? styles.disabled : '',
    clickable ? styles.clickable : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} data-type={card.type} onClick={clickable ? onClick : undefined} disabled={disabled}>
      <span className={styles.type}>{TYPE_LABEL[card.type]}</span>
      {/* ── PLACEHOLDER ART: replace with real artwork for defIdOf(id) later ── */}
      <span className={styles.art}>{card.art}</span>
      <span className={styles.name}>{card.name}</span>
      <span className={styles.stat}>{statLine(card)}</span>
      {card.type === 'situation' && card.consequences.length > 0 && (
        <span className={styles.consequence}>Fail: {formatEffects(card.consequences)}</span>
      )}
    </button>
  );
}
