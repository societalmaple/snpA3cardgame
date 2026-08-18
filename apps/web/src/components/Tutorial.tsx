import { useEffect, useState } from 'react';
import { useStore, fontScaleOf } from '../store.ts';
import { PlaceholderCard } from './PlaceholderCard.tsx';
import { TARGET_LEVEL, MAX_SUPPORTS, HAND_LIMIT } from '@school-days/shared';
import styles from './Tutorial.module.css';

interface Step {
  title: string;
  body: string;
  /** data-tutorial zone on the game screen to spotlight; 'page' means the whole screen. */
  zone: string;
  /** Example cards to show in the tooltip. */
  cardIds?: string[];
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Solve It!',
    body:
      `Race other players to Well-Being Level ${TARGET_LEVEL}. The level that wins must come from solving a ` +
      'Situation. This short tour shows the screen and explains each card type.',
    zone: 'page',
  },
  {
    title: 'Top bar',
    body:
      'Room code, turn number, and whose turn it is. You can reopen this tour anytime from the Tutorial button.',
    zone: 'topbar',
  },
  {
    title: 'Opponents',
    body: "Everyone else's name, level, and what they hold. The active player is highlighted.",
    zone: 'opponents',
  },
  {
    title: 'Action area',
    body:
      'This is the heart of your turn. Read the instruction at the top, then use the buttons to draw a Situation, ' +
      'Resolve, or End your turn. Situations and their difficulty show up here.',
    zone: 'center',
  },
  {
    title: 'Your cards',
    body:
      `Your equipped cards and two hands (Situation and Experience). You can hold up to ${HAND_LIMIT} cards. ` +
      'Click a highlighted card to play it.',
    zone: 'self',
  },
  {
    title: 'Game log',
    body: 'A running record of everything that just happened in the game.',
    zone: 'log',
  },
  {
    title: 'Situations',
    body:
      'Each turn you draw a Situation with a base difficulty and barriers. Solve it any way you can: a matching ' +
      'Strength, a Support, a Self-Advocacy card, a Friend or Club, or a teammate. Solving it wins Levels and ' +
      'Experience.',
    zone: 'page',
    cardIds: ['sit-01'],
  },
  {
    title: 'Mess-Ups',
    body:
      'A Mess-Up is a barrier the environment threw up — not your fault. Fix it with a Support, Self-Advocacy, ' +
      'Strength, or Friend, or endure a small temporary penalty.',
    zone: 'page',
    cardIds: ['msu-02'],
  },
  {
    title: 'Characters & Strengths',
    body:
      'Your Character is a permanent ability you never lose. A Strength adds a base bonus PLUS a bigger bonus when ' +
      'it fits the Situation, and is used up when you solve one.',
    zone: 'page',
    cardIds: ['char-01', 'str-01'],
  },
  {
    title: 'Supports & Self-Advocacy',
    body:
      `Supports are tools that remove barriers (keep up to ${MAX_SUPPORTS} active at once). Self-Advocacy cards are ` +
      'one-shot: asking for help changes the conditions and can cancel a consequence.',
    zone: 'page',
    cardIds: ['sup-03', 'sad-01'],
  },
  {
    title: 'Friends & Clubs',
    body:
      'A Friend helps co-regulate and team up (limit 1). A Club is a caring community that finds places where your ' +
      'strengths shine (limit 1).',
    zone: 'page',
    cardIds: ['fnd-03', 'club-01'],
  },
  {
    title: 'Level Ups',
    body: 'Level Up cards raise your Well-Being, but can never be the level that wins the game.',
    zone: 'page',
    cardIds: ['lvl-01'],
  },
  {
    title: "You're ready!",
    body:
      'On your turn: draw a Situation, lower its difficulty with your cards, then Resolve. Mess-Ups are just ' +
      'barriers you can fix. Have fun!',
    zone: 'page',
  },
];

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function Tutorial({ onClose }: { onClose: () => void }) {
  const { palette, background, font } = useStore();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = STEPS[index]!;
  const isPage = step.zone === 'page';

  useEffect(() => {
    const measure = () => {
      if (isPage) {
        setRect(null);
        return;
      }
      const el = document.querySelector<HTMLElement>(`[data-tutorial="${step.zone}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };

    if (!isPage) {
      document.querySelector<HTMLElement>(`[data-tutorial="${step.zone}"]`)?.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
    measure();
    const onScroll = () => measure();
    const onResize = () => measure();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    let ro: ResizeObserver | undefined;
    const target = document.querySelector<HTMLElement>(`[data-tutorial="${step.zone}"]`);
    if (target && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      ro.observe(target);
    }
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [step.zone, isPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const cssVars = {
    '--bg': palette.colors.background,
    '--bg-image': `url(${background})`,
    '--font-family': font,
    '--font-scale': String(fontScaleOf(font)),
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

  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const centered = isPage || !rect;

  const spotStyle =
    rect && !isPage
      ? { left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }
      : undefined;

  const tooltipStyle = centered ? undefined : tooltipStyleFor(rect);
  const tooltipClass = [
    styles.tooltip,
    step.cardIds?.length ? styles.wide : '',
    centered ? styles.centered : styles.anchored,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={styles.wrap}
      style={cssVars}
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial step ${index + 1}: ${step.title}`}
    >
      {isPage || !rect ? <div className={styles.dim} /> : <div className={styles.spot} style={spotStyle} />}
      <div className={tooltipClass} style={tooltipStyle}>
        <header className={styles.header}>
          <h1 className={styles.title}>Interactive Tutorial</h1>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close tutorial">
            ✕
          </button>
        </header>

        <div className={styles.content}>
          <h2 className={styles.stepTitle}>
            {index + 1}. {step.title}
          </h2>
          <p className={styles.body}>{step.body}</p>
          {step.cardIds && (
            <div className={styles.cards}>
              {step.cardIds.map((id) => (
                <PlaceholderCard key={id} id={id} size="sm" />
              ))}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button className={styles.secondary} disabled={isFirst} onClick={() => setIndex(index - 1)}>
            ← Back
          </button>
          <span className={styles.counter}>
            {index + 1} / {STEPS.length}
          </span>
          {isLast ? (
            <button className={styles.primary} onClick={onClose} autoFocus>
              Start playing
            </button>
          ) : (
            <button className={styles.primary} onClick={() => setIndex(index + 1)} autoFocus>
              Next →
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function tooltipStyleFor(rect: Rect): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (vw < 640) {
    return { left: 12, right: 12, bottom: 12, width: 'auto' };
  }

  const width = Math.min(24 * 16, vw - 32);
  const estimate = 230;
  const rectBottom = rect.top + rect.height;
  let top = rectBottom + 16;
  if (top + estimate > vh - 16 && rect.top - estimate - 16 > 16) {
    top = Math.max(16, rect.top - estimate - 16);
  } else {
    top = Math.min(top, vh - estimate - 16);
  }
  const left = Math.min(Math.max(16, rect.left), vw - width - 16);
  return { left, top, width };
}