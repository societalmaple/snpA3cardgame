import { useState } from 'react';
import { HAND_LIMIT, type Action, type CardInstanceId, type PlayerView, PALETTES } from '@school-days/shared';
import { useStore } from '../store.ts';
import { PlaceholderCard } from './PlaceholderCard.tsx';
import { CharacterSelect } from './CharacterSelect.tsx';
import { HelpScreen } from './HelpScreen.tsx';
import { Tutorial } from './Tutorial.tsx';
import { cardName } from '../cardDisplay.ts';
import styles from './Game.module.css';

export function Game({ view }: { view: PlayerView }) {
  const { room, sendAction, leave, palette, refreshPalette, setPalette } = useStore();
  const { legal } = view;
  const [helpTarget, setHelpTarget] = useState('');
  const [offer, setOffer] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Character selection happens before the board is shown.
  if (view.phase === 'character_select') return <CharacterSelect view={view} />;

  const act = (action: Action) => sendAction(action);
  const me = view.you;
  const isMyTurn = view.currentPlayerId === me;
  const nameOf = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;
  const myName = nameOf(me);

  const opponents = view.players.filter((p) => p.id !== me);
  const self = view.players.find((p) => p.id === me);
  const equipped = self
    ? [
        ...self.strengths,
        ...(self.friendId ? [self.friendId] : []),
        ...(self.clubId ? [self.clubId] : []),
        ...self.supports,
      ]
    : [];

  const clickable = (id: CardInstanceId) =>
    legal.playableSituations.includes(id) ||
    legal.playableCards.includes(id) ||
    legal.mitigations.includes(id) ||
    (legal.mustDiscard && legal.discardable.includes(id));
  const onCardClick = (id: CardInstanceId) => {
    if (legal.mustDiscard && legal.discardable.includes(id)) act({ type: 'DISCARD_CARD', playerId: me, cardId: id });
    else if (legal.playableSituations.includes(id)) act({ type: 'PLAY_SITUATION_FROM_HAND', playerId: me, cardId: id });
    else if (legal.playableCards.includes(id)) act({ type: 'PLAY_CARD', playerId: me, cardId: id });
  };

  const prompt = getPrompt(view);
  const winner = view.winnerId ? nameOf(view.winnerId) : null;

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

  return (
    <div className={styles.page} style={cssVars}>
      <div className={styles.overlay} />
      <header className={styles.topbar}>
        <div>
          <strong>Solve It!</strong> · Room {room?.code} · Turn {view.turn}
        </div>
        <div className={isMyTurn ? styles.myTurn : styles.turn}>
          {winner ? `${winner} wins!` : isMyTurn ? 'Your turn' : `${nameOf(view.currentPlayerId)}'s turn`}
        </div>
        <div className={styles.rightBar}>
          <span className={styles.meName}>{myName}</span>
          <button className={styles.tutorialBtn} onClick={() => setShowTutorial(true)} aria-label="Interactive tutorial" title="Interactive tutorial">
            Tutorial
          </button>
          <button className={styles.helpBtn} onClick={() => setShowHelp(true)} aria-label="How to play" title="How to play">
            ?
          </button>
          <button className={styles.leave} onClick={leave}>
            Leave
          </button>
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
            <button className={styles.randomizeBtn} onClick={refreshPalette} aria-label="Randomize palette">
              🎲
            </button>
          </div>
        </div>
      </header>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      {showHelp && <HelpScreen onClose={() => setShowHelp(false)} />}

      {winner && (
        <div className={styles.banner}>
          🎉 {winner} reached the top and wins the game!
          <button className={styles.primary} onClick={leave}>
            Back to lobby
          </button>
        </div>
      )}

      <section className={styles.opponents}>
        {opponents.map((p) => (
          <div key={p.id} className={`${styles.opponent} ${p.id === view.currentPlayerId ? styles.active : ''}`}>
            <div className={styles.oHead}>
              <span className={styles.oName}>{p.name}</span>
              <span className={styles.level}>Lv {p.level}</span>
            </div>
            <div className={styles.oMeta}>
              {!p.connected && <span className={styles.offline}>offline</span>}
              <span>✋ {p.situationHandCount + p.experienceHandCount} cards</span>
              <span>💪 {p.strengths.length}</span>
              <span>{p.friendId ? '🤝 1' : '🤝 0'}</span>
              <span>{p.clubId ? '🏫 1' : '🏫 0'}</span>
              <span>🧰 {p.supports.length}</span>
            </div>
          </div>
        ))}
      </section>

      <main className={styles.board}>
        <div className={styles.center}>
          <p className={styles.prompt}>{prompt}</p>

          {view.activeSituation && (
            <div className={styles.combat}>
              <PlaceholderCard id={view.activeSituation.cardId} animated />
              {view.activeSituation.math && (
                <div className={styles.math}>
                  <div className={styles.mathRow}>
                    <span>Base difficulty</span>
                    <strong>{view.activeSituation.math.baseDifficulty}</strong>
                  </div>
                  {view.activeSituation.math.tempPenalty > 0 && (
                    <div className={styles.mathRow}>
                      <span>Temporary penalty</span>
                      <strong>+{view.activeSituation.math.tempPenalty}</strong>
                    </div>
                  )}
                  {view.activeSituation.math.reductions.map((r, i) => (
                    <div className={styles.mathRow} key={i}>
                      <span className={styles.approach}>
                        {r.amount < 0 ? '−' : '+'}
                        {Math.abs(r.amount)} · {r.label}
                      </span>
                      <strong>{r.amount < 0 ? '−' : '+'}
                        {Math.abs(r.amount)}</strong>
                    </div>
                  ))}
                  <div className={styles.mathRow}>
                    <span>Modified difficulty</span>
                    <strong>{view.activeSituation.math.difficulty}</strong>
                  </div>
                  <div className={styles.mathRow}>
                    <span>Your total</span>
                    <strong>{view.activeSituation.math.total}</strong>
                  </div>
                  {view.activeSituation.math.teamBonus > 0 && (
                    <div className={styles.mathRow}>
                      <span>Team bonus</span>
                      <strong>+{view.activeSituation.math.teamBonus}</strong>
                    </div>
                  )}
                  {view.activeSituation.helperId && (
                    <div className={styles.mathRow}>
                      <span>incl. {nameOf(view.activeSituation.helperId)}</span>
                      <span>+{view.activeSituation.math.helperPower}</span>
                    </div>
                  )}
                  <div className={view.activeSituation.math.wins ? styles.willWin : styles.willLose}>
                    {view.activeSituation.math.wins ? 'Winning! Resolve!' : 'Not enough yet'}
                  </div>
                  <div className={styles.altNote}>
                    {view.activeSituation.math.reductions.length > 0 && (
                      <span>✓ Using {view.activeSituation.math.reductions.length} valid approach(es).</span>
                    )}
                    {view.activeSituation.math.reductions.some((r) => r.kind !== 'strength') && (
                      <span>Change the conditions, not just power.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {view.activeMessUp && (
            <div className={styles.combat}>
              <PlaceholderCard id={view.activeMessUp} animated />
              <div className={styles.messupPanel}>
                {legal.mitigations.length > 0 && (
                  <>
                    <strong>Choose how to remove this barrier:</strong>
                    <div className={styles.controls}>
                      {legal.mitigations.map((id) => (
                        <button
                          key={id}
                          className={styles.secondary}
                          onClick={() => act({ type: 'RESOLVE_MESS_UP', playerId: me, cardId: id })}
                        >
                          Use {cardName(id)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {legal.canAcceptMessUp && (
                  <button
                    className={styles.secondary}
                    onClick={() => act({ type: 'RESOLVE_MESS_UP', playerId: me, cardId: null })}
                  >
                    Endure a temporary penalty
                  </button>
                )}
              </div>
            </div>
          )}

          {view.pendingHelp && (
            <p className={styles.pending}>
              {nameOf(view.pendingHelp.requesterId)} asked {nameOf(view.pendingHelp.helperId)} for help, offering{' '}
              {view.pendingHelp.offeredExperience} Experience.
            </p>
          )}

          {/* ── Controls ── */}
          <div className={styles.controls}>
            {legal.canDraw && (
              <button className={styles.primary} onClick={() => act({ type: 'DRAW_SITUATION', playerId: me })}>
                Draw Situation
              </button>
            )}
            {legal.canResolveCombat && (
              <button className={styles.primary} onClick={() => act({ type: 'RESOLVE_COMBAT', playerId: me })}>
                Resolve
              </button>
            )}
            {legal.canEndTurn && (
              <button className={styles.secondary} onClick={() => act({ type: 'END_TURN', playerId: me })}>
                End turn
              </button>
            )}
            {legal.canRespondToHelp && (
              <>
                <button className={styles.primary} onClick={() => act({ type: 'RESPOND_TO_HELP', playerId: me, accept: true })}>
                  Help them
                </button>
                <button className={styles.secondary} onClick={() => act({ type: 'RESPOND_TO_HELP', playerId: me, accept: false })}>
                  Decline
                </button>
              </>
            )}
          </div>

          {legal.canAskForHelp && (
            <div className={styles.helpBox}>
              <span>Ask for help:</span>
              <select value={helpTarget} onChange={(e) => setHelpTarget(e.target.value)}>
                <option value="">choose player</option>
                {legal.helpTargets.map((id) => (
                  <option key={id} value={id}>
                    {nameOf(id)}
                  </option>
                ))}
              </select>
              <label>
                offer exp
                <input type="number" min={0} max={9} value={offer} onChange={(e) => setOffer(Math.max(0, Number(e.target.value)))} />
              </label>
              <button
                className={styles.secondary}
                disabled={!helpTarget}
                onClick={() => helpTarget && act({ type: 'ASK_FOR_HELP', playerId: me, helperId: helpTarget, offeredExperience: offer })}
              >
                Ask
              </button>
            </div>
          )}
        </div>

        <aside className={styles.log}>
          <h3>Game log</h3>
          <ul>
            {view.log.slice(-5).map((e) => (
              <li key={e.id}>{e.message}</li>
            ))}
          </ul>
        </aside>
      </main>

      {/* ── Your area ── */}
      <section className={styles.self}>
        <div className={styles.selfHead}>
          <span className={styles.oName}>{self?.name} (you)</span>
          <span className={styles.level}>Lv {self?.level}</span>
          {self?.characterId && <span className={styles.charChip}>{cardName(self.characterId)}</span>}
          <span className={styles.level}>
            Hand {view.yourSituationHand.length + view.yourExperienceHand.length}/{HAND_LIMIT}
          </span>
        </div>

        <div className={styles.equipped}>
          <span className={styles.zoneLabel}>
            Equipped
            {legal.mustDiscard ? (
              <em className={styles.hintInline}> · click to discard</em>
            ) : (
              legal.unequippable.length > 0 && <em className={styles.hintInline}> · click to unequip</em>
            )}
          </span>
          <div className={styles.cardRow}>
            {equipped.map((id) => (
              <PlaceholderCard
                key={id}
                id={id}
                size="sm"
                animated
                onClick={
                  legal.mustDiscard && legal.discardable.includes(id)
                    ? () => act({ type: 'DISCARD_CARD', playerId: me, cardId: id })
                    : legal.unequippable.includes(id)
                      ? () => act({ type: 'UNEQUIP_CARD', playerId: me, cardId: id })
                      : undefined
                }
              />
            ))}
            {!equipped.length && <span className={styles.empty}>nothing equipped</span>}
          </div>
        </div>

        <div className={styles.hands}>
          <div>
            <span className={styles.zoneLabel}>Situation hand</span>
            <div className={styles.cardRow}>
              {view.yourSituationHand.map((id) => (
                <PlaceholderCard key={id} id={id} size="sm" onClick={() => onCardClick(id)} disabled={!clickable(id)} selected={clickable(id)} />
              ))}
              {!view.yourSituationHand.length && <span className={styles.empty}>empty</span>}
            </div>
          </div>
          <div>
            <span className={styles.zoneLabel}>Experience hand</span>
            <div className={styles.cardRow}>
              {view.yourExperienceHand.map((id) => (
                <PlaceholderCard key={id} id={id} size="sm" onClick={() => onCardClick(id)} disabled={!clickable(id)} selected={clickable(id)} />
              ))}
              {!view.yourExperienceHand.length && <span className={styles.empty}>empty</span>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function getPrompt(view: PlayerView): string {
  if (view.winnerId) return 'Game over.';
  if (view.legal.mustDiscard) {
    if (view.discardTask?.kind === 'count') {
      return `You didn't fully succeed. Discard ${view.discardTask.remaining} card(s). You may discard from your hand or your equipped cards.`;
    }
    return `Your hand is over ${HAND_LIMIT}. Discard a card (toss the new one, or an old one to keep it).`;
  }
  const isMyTurn = view.currentPlayerId === view.you;
  const isHelper = view.activeSituation?.helperId === view.you;
  if (view.phase === 'messup') {
    return view.legal.canAcceptMessUp
      ? 'A Mess-Up created a barrier. Use a Support, Self-Advocacy, Strength, or Friend to remove it, or endure a temporary penalty.'
      : 'No mitigation available, enduring the temporary penalty.';
  }
  if (view.phase === 'await_help') {
    return view.legal.canRespondToHelp ? "You've been asked to help. Accept or decline." : 'Waiting for the helper to respond…';
  }
  if (!isMyTurn && !isHelper) return `Waiting for ${view.players.find((p) => p.id === view.currentPlayerId)?.name ?? 'the current player'}…`;
  if (isHelper && view.phase === 'combat') return 'You are helping! Equip cards to boost the team, then the active player will Resolve.';
  switch (view.phase) {
    case 'await_action':
      return 'Draw a Situation, or play a Situation from your hand.';
    case 'combat':
      return 'Use your strengths, supports, friends, clubs, or self-advocacy to change the conditions, then Resolve.';
    case 'main':
      return 'Play or equip cards, then End your turn.';
    default:
      return '';
  }
}