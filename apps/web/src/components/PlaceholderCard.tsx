import { cardOf, selfAdvocacyForMessUp, type CardInstanceId } from '@school-days/shared';
import { TYPE_LABEL, statLine, formatEffects, teachingText } from '../cardDisplay.ts';
import { FitText } from './FitText.tsx';
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
      <span className={styles.art}>
        <FitText>{card.art}</FitText>
      </span>
      <FitText className={styles.name}>{card.name}</FitText>
      <FitText className={styles.stat}>{statLine(card)}</FitText>
      {card.type === 'situation' && card.barriers && card.barriers.length > 0 && (
        <FitText className={styles.barriers}>Barriers: {card.barriers.join(', ')}</FitText>
      )}
      {card.type === 'situation' && card.consequences.length > 0 && (
        <FitText className={styles.consequence}>Fail: {formatEffects(card.consequences)}</FitText>
      )}
      {card.type === 'situation' && card.validStrengths && card.validStrengths.length > 0 && (
        <FitText className={styles.connection}>Strengths: {names(card.validStrengths)}</FitText>
      )}
      {card.type === 'situation' && card.validSupports && card.validSupports.length > 0 && (
        <FitText className={styles.connection}>Supports: {names(card.validSupports)}</FitText>
      )}
      {card.type === 'situation' && card.validSelfAdvocacy && card.validSelfAdvocacy.length > 0 && (
        <FitText className={styles.connection}>Self-Advocacy: {names(card.validSelfAdvocacy)}</FitText>
      )}
      {card.type === 'messup' && card.mitigation && (
        <FitText className={styles.connection}>Self-Advocacy: {names(selfAdvocacyForMessUp(card))}</FitText>
      )}
      {teach && <FitText className={styles.teach}>{teach}</FitText>}
    </button>
  );
}