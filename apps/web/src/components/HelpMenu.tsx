import styles from './HelpMenu.module.css';

interface Props {
  onTutorial: () => void;
  onHelp: () => void;
  onClose: () => void;
}

export function HelpMenu({ onTutorial, onHelp, onClose }: Props) {
  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label="Choose how to learn the game"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title}>Learn the game</h2>
        <p className={styles.sub}>Pick how you'd like to learn the rules.</p>
        <button className={styles.option} onClick={onTutorial} autoFocus>
          <span className={styles.icon}>📖</span>
          <span className={styles.optText}>
            <span className={styles.optLabel}>Interactive tutorial</span>
            <span className={styles.optHint}>Step-by-step, guided</span>
          </span>
        </button>
        <button className={styles.option} onClick={onHelp}>
          <span className={styles.icon}>📄</span>
          <span className={styles.optText}>
            <span className={styles.optLabel}>How to play</span>
            <span className={styles.optHint}>Full written rules</span>
          </span>
        </button>
      </div>
    </div>
  );
}
