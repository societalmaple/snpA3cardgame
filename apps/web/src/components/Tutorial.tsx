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
      'This game teaches a strengths-based view of neurodiversity. The key idea: people have different ways of ' +
      'thinking and functioning, and difficulties often come from a mismatch between a person and their environment, ' +
      'not from being less capable. You solve Situations by creating conditions in which you can thrive.',
    cardId: 'sit-01',
    tip: 'Different approaches are useful in different contexts. There is no single "correct" way to learn, communicate, or regulate.',
  },
  {
    title: 'Goal',
    body:
      `Be the first player to reach Well-Being Level ${TARGET_LEVEL}. The winning level must come from successfully ` +
      'solving a Situation. Well-being comes from supportive environments, relationships, strategies, and ' +
      'self-acceptance, not only from performing better.',
  },
  {
    title: 'Choose a Character',
    body:
      'At the start, everyone picks a unique Character. Your Character gives you a permanent passive ability that ' +
      'reinforces the model, like gaining an alternate solution when a Situation matches your strengths, or helping ' +
      'another player choose an environmental solution.',
    cardId: 'char-01',
    tip: 'Characters are never discarded, and each is unique, one per player.',
  },
  {
    title: 'Your Turn',
    body:
      'On your turn you draw a Situation, solve it, then play or equip cards in your main phase and end your turn. ' +
      'If you draw a Mess-Up, it creates a barrier you can often remove.',
  },
  {
    title: 'Situations & Barriers',
    body:
      'Every Situation has a base difficulty and one or more barriers, noise, crowding, time pressure, unclear ' +
      'instructions, sensory overload, social pressure, and more. A barrier is NOT your fault; it is a mismatch ' +
      'between you and the environment.',
    cardId: 'sit-02',
    tip: 'The UI shows "your approach" and the "modified difficulty", different valid solutions, not a hidden correct answer.',
  },
  {
    title: 'Multiple Valid Solutions',
    body:
      'A Situation can be solved in several ways: a relevant Strength, an active Support, a Self-Advocacy card, a ' +
      'Friend, a Club, an environmental change, or teamwork. You are never asked to simply "try harder."',
    cardId: 'sit-06',
  },
  {
    title: 'Strengths',
    body:
      'Strengths give a modest base bonus PLUS a contextual effect, they shine when they fit the Situation. ' +
      'Linguistic helps with explaining and writing; Logical-Mathematical with planning and sequencing; Spatial with ' +
      'diagrams and organization; and so on. Strengths are used up when you solve a Situation.',
    cardId: 'str-01',
    tip: 'A Strength is not universally useful, its value comes from finding the right context.',
  },
  {
    title: 'Supports & Accommodations',
    body:
      `Supports are tools, accommodations, or environmental changes that remove barriers. You can keep up to ` +
      `${MAX_SUPPORTS} active at once. Quiet Workspace helps sensory Situations, Written Instructions helps with ` +
      `unclear instructions, Extra Processing Time helps with time pressure. Supports are NOT "power-ups", they ` +
      'change the conditions so existing abilities can be used.',
    cardId: 'sup-03',
    tip: 'Needing a different format does not mean you understand less.',
  },
  {
    title: 'Self-Advocacy',
    body:
      'Self-Advocacy cards are one-shot cards you play while facing a Situation. Asking for a support is an active ' +
      'skill, not a failure: "Can I Have That in Writing?", "I Need More Processing Time", "Can We Change the ' +
      'Environment?" These reduce the difficulty of matching barriers or cancel a consequence.',
    cardId: 'sad-01',
    tip: 'Self-advocacy helps others understand what you need to succeed.',
  },
  {
    title: 'Friends & Clubs',
    body:
      'Friends provide co-regulation and collaboration: the Active Listener clarifies communication, the Detail ' +
      'Checker spots unclear requirements, the Study Partner breaks down big tasks, the Calm Anchor eases stress. ' +
      'Clubs are supportive communities that help you find environments where your strengths are useful.',
    cardId: 'fnd-03',
  },
  {
    title: 'Mess-Ups Are Barriers, Not Failures',
    body:
      'When you draw a Mess-Up, the environment threw up a barrier, Sensory Overload Spot, Unexpected Routine ' +
      'Change, Miscommunication Glitch, Burnout, or Lost Accommodation. You can usually MITIGATE it with a Support, ' +
      'Self-Advocacy card, Strength, or Friend. If you cannot, you only take a small temporary penalty for the next ' +
      'Situation, never a permanent loss.',
    cardId: 'msu-02',
    tip: 'Needing rest is not losing personal worth. Losing access to a support creates a barrier, the lesson is about access.',
  },
  {
    title: 'Help & Teamwork',
    body:
      'During a Situation you can ask one other player for help. Their strengths and supports can also change the ' +
      'conditions, and Experience rewards can be shared. Collaboration lets different strengths complement each other.',
    cardId: 'sit-04',
  },
  {
    title: 'Discovery',
    body:
      'When you solve a Situation through a matched Strength, Support, or Self-Advocacy approach, you may discover a ' +
      'new approach (an extra Experience card). It is never a random "superpower" assigned to your neurotype, it is ' +
      '"here is one thing that worked for me."',
  },
  {
    title: 'Hand Limit & Discarding',
    body:
      `You hold up to ${HAND_LIMIT} cards across your two hands. If you go over, you discard down, choosing what to ` +
      'keep. If a consequence asks you to discard, you can pay from your hand or from equipped cards.',
  },
  {
    title: 'You are ready!',
    body:
      'Remember the 10 ideas: strengths and difficulties can coexist; a difficulty is not a lack of ability; changing ' +
      'the environment can remove a barrier; accommodations give access, not unfair advantage; self-advocacy is a ' +
      'skill; different people solve the same problem differently; and there is no single right way to function. ' +
      'Have fun, and help each other thrive!',
    tip: 'You can reopen this tutorial anytime with the "?" button.',
  },
];

export function Tutorial({ onClose }: { onClose: () => void }) {
  const { palette } = useStore();
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;

  const cssVars = {
    '--bg': palette.colors.background,
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