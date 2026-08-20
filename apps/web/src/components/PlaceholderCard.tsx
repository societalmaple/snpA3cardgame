import { cardOf, selfAdvocacyForMessUp, type CardInstanceId } from '@school-days/shared';
import { TYPE_LABEL, statLine, formatEffects, teachingText } from '../cardDisplay.ts';
import { FitWords } from './FitWords.tsx';
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
      <FitWords className={styles.type} text={TYPE_LABEL[card.type]} />
      {/* ── PLACEHOLDER ART: replace with real artwork for defIdOf(id) later ── */}
      <span className={styles.art}>
        <FitWords text={card.art} />
      </span>
      <FitWords className={styles.name} text={card.name} />
      <FitWords className={styles.stat} text={statLine(card)} />
      {card.type === 'situation' && card.barriers && card.barriers.length > 0 && (
        <FitWords className={styles.barriers} text={`Barriers: ${card.barriers.join(', ')}`} />
      )}
      {card.type === 'situation' && card.consequences.length > 0 && (
        <FitWords className={styles.consequence} text={`Fail: ${formatEffects(card.consequences)}`} />
      )}
      {card.type === 'situation' && card.validStrengths && card.validStrengths.length > 0 && (
        <FitWords className={styles.connection} text={`Strengths: ${names(card.validStrengths)}`} />
      )}
      {card.type === 'situation' && card.validSupports && card.validSupports.length > 0 && (
        <FitWords className={styles.connection} text={`Supports: ${names(card.validSupports)}`} />
      )}
      {card.type === 'situation' && card.validSelfAdvocacy && card.validSelfAdvocacy.length > 0 && (
        <FitWords className={styles.connection} text={`Self-Advocacy: ${names(card.validSelfAdvocacy)}`} />
      )}
      {card.type === 'messup' && card.mitigation && (
        <FitWords className={styles.connection} text={`Self-Advocacy: ${names(selfAdvocacyForMessUp(card))}`} />
      )}
      {teach && <FitWords className={styles.teach} text={teach} />}
    </button>
  );
}