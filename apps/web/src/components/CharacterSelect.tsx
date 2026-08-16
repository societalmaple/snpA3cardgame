import { useState } from 'react';
import { cardOf, type PlayerView, PALETTES } from '@school-days/shared';
import { useStore } from '../store.ts';
import { PlaceholderCard } from './PlaceholderCard.tsx';
import { HelpScreen } from './HelpScreen.tsx';
import { FontSelect } from './FontSelect.tsx';
import styles from './CharacterSelect.module.css';

export function CharacterSelect({ view }: { view: PlayerView }) {
  const { sendAction, leave, palette, refreshPalette, setPalette, background, refreshBackground, font } = useStore();
  const [showHelp, setShowHelp] = useState(false);
  const me = view.you;
  const self = view.players.find((p) => p.id === me);
  const chosen = self?.characterId ?? null;

  const confirmLeave = () => {
    if (window.confirm('Leave the room? You will give up your seat in this game.')) leave();
  };

  const cssVars = {
    '--bg': palette.colors.background,
    '--bg-image': `url(${background})`,
    '--font-family': font,
    '--panel': palette.colors.panel,
    '--panel-border': palette.colors.panelBorder,
    '--primary': palette.colors.primary,
    '--primary-text': palette.colors.primaryText,
    '--secondary': palette.colors.secondary,
    '--secondary-text': palette.colors.secondaryText,
    '--ghost': palette.colors.ghost,
    '--ghost-hover': palette.colors.ghostHover,
    '--input-bg': palette.colors.inputBg,
    '--input-border': palette.colors.inputBorder,
    '--input-focus': palette.colors.inputFocus,
    '--text-primary': palette.colors.textPrimary,
    '--text-secondary': palette.colors.textSecondary,
    '--text-muted': palette.colors.textMuted,
    '--accent': palette.colors.accent,
    '--accent-glow': palette.colors.accentGlow,
    '--overlay': palette.colors.overlay,
    '--player-item': palette.colors.playerItem,
    '--player-item-border': palette.colors.playerItemBorder,
  } as React.CSSProperties;

  if (showHelp) return <HelpScreen onClose={() => setShowHelp(false)} />;

  return (
    <div className={styles.wrap} style={cssVars}>
      <div className={styles.overlay} />
      <div className={styles.topbar}>
        <div className={styles.topLeft}>
          <button className={styles.helpBtn} onClick={() => setShowHelp(true)} aria-label="How to play">
            ?
          </button>
          <button className={styles.leave} onClick={confirmLeave}>
            Leave to lobby
          </button>
        </div>
        <div className={styles.paletteSelector}>
          <select
            value={palette.name}
            onChange={(e) => setPalette(PALETTES.find((p) => p.name === e.target.value)!)}
            className={styles.paletteSelect}
            aria-label="Select color palette"
          >
            {PALETTES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <FontSelect />
          <button className={styles.randomizeBtn} onClick={refreshPalette} aria-label="Randomize palette">
            🎲
          </button>
          <button className={styles.bgBtn} onClick={refreshBackground} aria-label="Randomize background" title="Randomize background">
            🖼️
          </button>
        </div>
      </div>
      <div className={styles.panel}>
        <h1 className={styles.title}>Choose your character</h1>
        <p className={styles.sub}>
          Each character has a permanent passive ability and is never discarded. Once everyone has
          picked, the game begins.
        </p>

        {chosen ? (
          <p className={styles.chosen}>
            You chose <strong>{cardOf(chosen)?.name ?? 'a character'}</strong>. Waiting for the other
            players…
          </p>
        ) : (
          <div className={styles.cards}>
            {view.availableCharacters.map((id) => (
              <PlaceholderCard
                key={id}
                id={id}
                onClick={() => sendAction({ type: 'CHOOSE_CHARACTER', playerId: me, characterId: id })}
              />
            ))}
          </div>
        )}

        <ul className={styles.players}>
          {view.players.map((p) => (
            <li key={p.id} className={styles.player}>
              <span>
                {p.name}
                {p.id === me && <span className={styles.you}> you</span>}
              </span>
              <span className={p.characterId ? styles.ready : styles.waiting}>
                {p.characterId ? (cardOf(p.characterId)?.name ?? 'chosen') : 'choosing…'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
