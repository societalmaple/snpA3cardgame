import { useState } from 'react';
import { useStore } from '../store.ts';
import { PlaceholderCard } from './PlaceholderCard.tsx';
import { TARGET_LEVEL, MAX_SUPPORTS, HAND_LIMIT } from '@school-days/shared';
import styles from './Tutorial.module.css';

interface Step {
  title: string;
  body: string;
  cardId?: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Solve It!',
    body:
      'This game is about a strengths-based view of neurodiversity. People think and work in different ways, and ' +
      'hard things often happen when a person and their surroundings do not fit together. That is not about being ' +
      'less capable. You win by changing the conditions so you can do your best.',
    cardId: 'sit-01',
    tip: 'Different approaches work in different settings. There is no one "correct" way to learn, talk, or feel.',
  },
  {
    title: 'Goal',
    body:
      `Be the first player to reach Well-Being Level ${TARGET_LEVEL}. The level that wins must come from solving a ` +
      'Situation. Well-being grows from supportive places, good relationships, and strategies, not just from doing better.',
  },
  {
    title: 'Choose a Character',
    body:
      'At the start, each player picks a unique Character. Your Character gives you a steady ability that fits the ' +
      'game, like an extra way to solve a Situation when it matches your strengths, or helping someone else pick an ' +
      'environmental solution.',
    cardId: 'char-01',
    tip: 'Characters are never thrown away, and each one is used by only one player.',
  },
  {
    title: 'Your Turn',
    body:
      'On your turn you draw a Situation, try to solve it, then play or equip cards and end your turn. If you draw a ' +
      'Mess-Up, it sets up a barrier you can usually remove.',
  },
  {
    title: 'Situations & Barriers',
    body:
      'Every Situation has a base difficulty and one or more barriers, like noise, crowding, time pressure, unclear ' +
      'instructions, too much input, or social pressure. A barrier is not your fault. It means the setting does not ' +
      'fit you yet.',
    cardId: 'sit-02',
    tip: 'The screen shows "your approach" and the "modified difficulty". These are different good ways to win, not a hidden answer.',
  },
  {
    title: 'Multiple Ways to Solve',
    body:
      'You can solve a Situation in more than one way: a matching Strength, an active Support, a Self-Advocacy card, ' +
      'a Friend, a Club, changing the environment, or working with a teammate. You are never told to just "try harder."',
    cardId: 'sit-06',
  },
  {
    title: 'Strengths',
    body:
      'Strengths give a small base bonus PLUS a context bonus, so they work best when they fit the Situation. ' +
      'Linguistic helps with explaining and writing; Logical-Mathematical with planning and steps; Spatial with ' +
      'diagrams and order; and so on. Strengths are used up when you solve a Situation.',
    cardId: 'str-01',
    tip: 'A Strength is not good everywhere. Its value comes from finding the right place for it.',
  },
  {
    title: 'Supports & Accommodations',
    body:
      `Supports are tools, accommodations, or changes to the environment that remove barriers. You can keep up to ` +
      `${MAX_SUPPORTS} active at once. Quiet Workspace helps with noise, Written Instructions helps with unclear ` +
      `directions, Extra Processing Time helps with time pressure. Supports are NOT "power-ups". They change the ` +
      'setting so the abilities you already have can be used.',
    cardId: 'sup-03',
    tip: 'Getting information in a different way does not mean you understand less.',
  },
  {
    title: 'Self-Advocacy',
    body:
      'Self-Advocacy cards are one-shot cards you play while facing a Situation. Asking for help is a skill, not a ' +
      'weakness: "Can I Have That in Writing?", "I Need More Processing Time", "Can We Change the Environment?" These ' +
      'cards lower the difficulty of matching barriers or cancel a consequence.',
    cardId: 'sad-01',
    tip: 'Telling others what you need helps everyone help you succeed.',
  },
  {
    title: 'Friends & Clubs',
    body:
      'Friends help with co-regulation and teamwork: the Active Listener clears up communication, the Detail Checker ' +
      'spots unclear requirements, the Study Partner breaks big tasks into small ones, the Calm Anchor eases stress. ' +
      'Clubs are caring communities that help you find places where your strengths are useful.',
    cardId: 'fnd-03',
  },
  {
    title: 'Mess-Ups Are Barriers, Not Failures',
    body:
      'When you draw a Mess-Up, the setting threw up a barrier, like Sensory Overload Spot, Unexpected Routine ' +
      'Change, Miscommunication Glitch, Burnout, or Lost Accommodation. You can usually MITIGATE it with a Support, ' +
      'Self-Advocacy card, Strength, or Friend. If you cannot, you only get a small, temporary penalty for the next ' +
      'Situation, never a permanent loss.',
    cardId: 'msu-02',
    tip: 'Needing rest does not lower your worth. Losing a support creates a barrier, and the lesson is about access.',
  },
  {
    title: 'Help & Teamwork',
    body:
      'During a Situation you can ask one other player for help. Their strengths and supports can also change the ' +
      'conditions, and Experience rewards can be shared. Working together lets different strengths add to each other.',
    cardId: 'sit-04',
  },
  {
    title: 'Discovery',
    body:
      'When you solve a Situation using a matching Strength, Support, or Self-Advocacy approach, you may discover a ' +
      'new approach (an extra Experience card). It is never a random "superpower" given to your neurotype. It means ' +
      '"here is one thing that worked for me."',
  },
  {
    title: 'Hand Limit & Discarding',
    body:
      `You can hold up to ${HAND_LIMIT} cards across your two hands. If you go over, you discard down and choose what ` +
      'to keep. If a consequence asks you to discard, you can pay from your hand or from equipped cards.',
  },
  {
    title: 'You are ready!',
    body:
      'Keep these ideas in mind: strengths and difficulties can exist together; a difficulty is not a lack of ' +
      'ability; changing the environment can remove a barrier; accommodations give access, not an unfair edge; ' +
      'self-advocacy is a skill; different people solve the same problem in different ways; and there is no one ' +
      'right way to function. Have fun, and help each other thrive!',
    tip: 'You can reopen this tutorial anytime with the "?" button.',
  },
];

export function Tutorial({ onClose }: { onClose: () => void }) {
  const { palette, background, font } = useStore();
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;

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

  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;

  return (
    <div className={styles.wrap} style={cssVars}>
      <div className={styles.overlay} />
      <div className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>Interactive Tutorial</h1>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close tutorial">
            ✕
          </button>
        </header>

        <div className={styles.progress}>
          {STEPS.map((s, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === index ? styles.dotActive : ''} ${i < index ? styles.dotDone : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Step ${i + 1}: ${s.title}`}
              title={s.title}
            />
          ))}
        </div>

        <div className={styles.content}>
          <h2 className={styles.stepTitle}>
            {index + 1}. {step.title}
          </h2>
          <p className={styles.body}>{step.body}</p>
          {step.cardId && (
            <div className={styles.cardWrap}>
              <PlaceholderCard id={step.cardId} size="md" />
            </div>
          )}
          {step.tip && <p className={styles.tip}>💡 {step.tip}</p>}
        </div>

        <footer className={styles.footer}>
          <button className={styles.secondary} disabled={isFirst} onClick={() => setIndex(index - 1)}>
            ← Back
          </button>
          <span className={styles.counter}>
            {index + 1} / {STEPS.length}
          </span>
          {isLast ? (
            <button className={styles.primary} onClick={onClose}>
              Start playing
            </button>
          ) : (
            <button className={styles.primary} onClick={() => setIndex(index + 1)}>
              Next →
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}