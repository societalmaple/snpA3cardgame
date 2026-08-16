import { useStore, fontScaleOf } from '../store.ts';
import { TARGET_LEVEL, MAX_SUPPORTS, HAND_LIMIT } from '@school-days/shared';
import { FontSelect } from './FontSelect.tsx';
import styles from './HelpScreen.module.css';

export function HelpScreen({ onClose }: { onClose: () => void }) {
  const { palette, refreshPalette, background, refreshBackground, font } = useStore();

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

  return (
    <div className={styles.wrap} style={cssVars}>
      <div className={styles.overlay} />
      <div className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>How to Play</h1>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close help">
            ✕
          </button>
        </header>

        <div className={styles.content}>
          <section>
            <h2>The Big Idea</h2>
            <p>
              People have different ways of thinking and functioning. <strong>Difficulties come from a mismatch
              between a person and their environment</strong>, not from being less capable. In this game you solve
              Situations by using strengths, supports, self-advocacy, relationships, and environmental changes to
              create conditions in which you can thrive.
            </p>
          </section>

          <section>
            <h2>Goal</h2>
            <p>
              Be the first player to reach <strong>Well-Being Level {TARGET_LEVEL}</strong>. The winning level must
              come from successfully solving a Situation. Well-being can come from supportive environments,
              relationships, strategies, and self-acceptance, not only from performing better.
            </p>
          </section>

          <section>
            <h2>Turn Structure</h2>
            <ol>
              <li>
                <strong>Face a Situation:</strong> Draw 1 card from the Situation deck.
                <ul>
                  <li><strong>Mess-Up:</strong> The environment threw up a barrier. Resolve it or mitigate it (see below).</li>
                  <li><strong>Situation:</strong> Solve it using any valid approach (see below).</li>
                  <li><strong>Go Up A Level:</strong> Goes into your hand to play later.</li>
                </ul>
              </li>
              <li><strong>Resolve:</strong> If your total meets the modified difficulty, you win Levels and Experience.</li>
              <li><strong>Main phase:</strong> Equip cards, activate supports, then End your turn.</li>
            </ol>
          </section>

          <section>
            <h2>Situations & Barriers</h2>
            <p>
              Every Situation has a <strong>base difficulty</strong> and one or more <strong>barriers</strong> (for
              example: noise, crowding, time pressure, unclear instructions, sensory overload, social pressure).
              You are never asked to "just try harder." Each barrier has <strong>multiple valid solutions</strong>:
            </p>
            <ul>
              <li><strong>Relevant Strengths</strong>, a Strength that fits the Situation reduces the difficulty.</li>
              <li><strong>Active Supports</strong>, accommodations and environmental changes that remove barriers.</li>
              <li><strong>Self-Advocacy</strong>, asking for a support is an active skill, not a failure.</li>
              <li><strong>Friends & Clubs</strong>, co-regulation, collaboration, and community.</li>
              <li><strong>Environmental changes</strong>, "change the conditions" is a real solution.</li>
              <li><strong>Teamwork</strong>, combine strengths with another player when allowed.</li>
            </ul>
            <p>
              The screen shows <strong>your approach</strong> and the <strong>modified difficulty</strong>. These are
              <em> different valid solutions</em>, not a hidden correct answer.
            </p>
          </section>

          <section>
            <h2>Card Types</h2>
            <ul>
              <li>
                <strong>Character</strong>, permanent passive ability, one per player. Each reinforces the new
                model (contextual, collaborative, environmental).
              </li>
              <li>
                <strong>Strength</strong>, a modest base bonus plus a <strong>contextual</strong> effect: it shines
                when it fits the Situation. Strengths are consumed when you solve a Situation.
              </li>
              <li>
                <strong>Support / Accommodation</strong>, tools, accommodations, or environmental changes that
                remove barriers. Keep up to <strong>{MAX_SUPPORTS} active</strong>. They are not "power-ups" that
                imply you are deficient without them.
              </li>
              <li>
                <strong>Self-Advocacy</strong>, one-shot cards you play while facing a Situation to change the
                conditions or cancel a consequence.
              </li>
              <li>
                <strong>Friend</strong>, co-regulation and collaboration. Can clarify, calm, or help break tasks
                down. (Limit 1 equipped.)
              </li>
              <li>
                <strong>Club</strong>, a supportive community that shows how communities help people find
                environments where their strengths are useful. (Limit 1 equipped.)
              </li>
              <li>
                <strong>Go Up A Level</strong>, raises Well-Being, but can never be the winning level.
              </li>
            </ul>
          </section>

          <section>
            <h2>Mess-Ups & Barriers</h2>
            <p>
              A Mess-Up is an <strong>environmental or support barrier</strong>, not a personal failure. When one
              is drawn, you can usually <strong>mitigate</strong> it using an active Support, a Self-Advocacy card,
              a relevant Strength, or a Friend. If you cannot (or choose not to), you take only a{' '}
              <strong>small temporary penalty</strong> for the next Situation, never a permanent loss.
            </p>
            <ul>
              <li>Needing a break is not failing. <strong>Burnout</strong> is a recovery need, not a character flaw.</li>
              <li>Losing access to a support creates a barrier, the lesson is about <strong>access</strong>, not weakness.</li>
            </ul>
          </section>

          <section>
            <h2>Solving & Discovery</h2>
            <p>
              When you solve a Situation through a matched Strength, Support, or Self-Advocacy approach, you may{' '}
              <strong>discover</strong> a new approach (an extra Experience card). It is never a random
              "superpower". It is <em>"here is one thing that worked for me."</em>
            </p>
          </section>

          <section>
            <h2>Card Limits & Help</h2>
            <ul>
              <li><strong>Hand limit:</strong> {HAND_LIMIT} cards across both hands, over the limit you discard down.</li>
              <li><strong>Ask for Help:</strong> during combat, ask one other player to join you. Their strengths
                and supports can also change the conditions, and Experience rewards can be shared.</li>
            </ul>
          </section>

          <section>
            <h2>Learning Goals</h2>
            <ul>
              <li>You can have genuine strengths and genuine difficulties at the same time.</li>
              <li>A difficulty does not automatically mean a lack of ability.</li>
              <li>Changing the environment can remove a barrier.</li>
              <li>Accommodations provide access, not an unfair advantage.</li>
              <li>Self-advocacy is a useful skill.</li>
              <li>Different people can solve the same problem in different ways.</li>
              <li>There is no single correct way to learn, communicate, regulate, or solve problems.</li>
            </ul>
          </section>
        </div>

        <div className={styles.toggles}>
          <FontSelect />
          <button className={styles.paletteToggle} onClick={refreshPalette} aria-label="Change color palette">
            ✦ {palette.name}
          </button>
          <button
            className={styles.bgToggle}
            onClick={refreshBackground}
            aria-label="Randomize background"
            title="Randomize background"
          >
            🖼️
          </button>
        </div>
      </div>
    </div>
  );
}