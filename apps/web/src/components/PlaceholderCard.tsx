import { cardOf, type CardInstanceId } from '@school-days/shared';
import { TYPE_LABEL, statLine, formatEffects, teachingText } from '../cardDisplay.ts';
import styles from './PlaceholderCard.module.css';

interface Props {
  id: CardInstanceId;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Play a fly-in animation when the card appears (e.g. freshly equipped/played). */
  animated?: boolean;
}

/**
 * Renders a single card as a labelled placeholder. When real art is ready, swap the
 * `.art` block below for an <img> keyed off the card's definition id (defIdOf(id)).
 */
export function PlaceholderCard({ id, onClick, selected, disabled, size = 'md', animated }: Props) {
  const card = cardOf(id);
  if (!card) return <div className={styles.card}>Unknown card</div>;

  const clickable = !!onClick && !disabled;
  const className = [
    styles.card,
    styles[size],
    selected ? styles.selected : '',
    disabled ? styles.disabled : '',
    clickable ? styles.clickable : '',
    animated ? styles.animated : '',
  ]
    .filter(Boolean)
    .join(' ');

  const teach = teachingText(card);

  const names = (ids: string[] | undefined) =>
    ids ? ids.map((id) => cardOf(id)?.name ?? id).join(', ') : '';

  return (
    <button type="button" className={className} data-type={card.type} onClick={clickable ? onClick : undefined} disabled={disabled}>
      <span className={styles.type}>{TYPE_LABEL[card.type]}</span>
      {/* ── PLACEHOLDER ART: replace with real artwork for defIdOf(id) later ── */}
      <span className={styles.art}>{card.art}</span>
      <span className={styles.name}>{card.name}</span>
      <span className={styles.stat}>{statLine(card)}</span>
      {card.type === 'situation' && card.barriers && card.barriers.length > 0 && (
        <span className={styles.barriers}>Barriers: {card.barriers.join(', ')}</span>
      )}
      {card.type === 'situation' && card.consequences.length > 0 && (
        <span className={styles.consequence}>Fail: {formatEffects(card.consequences)}</span>
      )}
      {card.type === 'situation' && card.validStrengths && card.validStrengths.length > 0 && (
        <span className={styles.connection}>Strengths: {names(card.validStrengths)}</span>
      )}
      {card.type === 'situation' && card.validSupports && card.validSupports.length > 0 && (
        <span className={styles.connection}>Supports: {names(card.validSupports)}</span>
      )}
      {card.type === 'situation' && card.validSelfAdvocacy && card.validSelfAdvocacy.length > 0 && (
        <span className={styles.connection}>Self-Advocacy: {names(card.validSelfAdvocacy)}</span>
      )}
      {teach && <span className={styles.teach}>{teach}</span>}
    </button>
  );
}