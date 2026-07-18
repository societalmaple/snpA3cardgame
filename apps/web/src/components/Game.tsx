import { useState } from 'react';
import { HAND_LIMIT, type Action, type CardInstanceId, type PlayerView } from '@school-days/shared';
import { useStore } from '../store.ts';
import { PlaceholderCard } from './PlaceholderCard.tsx';
import { cardName } from '../cardDisplay.ts';
import styles from './Game.module.css';

export function Game({ view }: { view: PlayerView }) {
  const { room, sendAction, leave } = useStore();
  const { legal } = view;
  const [helpTarget, setHelpTarget] = useState('');
  const [offer, setOffer] = useState(0);

  const act = (action: Action) => sendAction(action);
  const me = view.you;
  const isMyTurn = view.currentPlayerId === me;
  const nameOf = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;

  const opponents = view.players.filter((p) => p.id !== me);
  const self = view.players.find((p) => p.id === me);
  const equipped = self
    ? [...self.strengths, ...(self.friendId ? [self.friendId] : []), ...(self.clubId ? [self.clubId] : [])]
    : [];

  const clickable = (id: CardInstanceId) =>
    legal.playableSituations.includes(id) ||
    legal.playableCards.includes(id) ||
    (legal.mustDiscard && legal.discardable.includes(id));
  const onCardClick = (id: CardInstanceId) => {
    if (legal.mustDiscard && legal.discardable.includes(id)) act({ type: 'DISCARD_CARD', playerId: me, cardId: id });
    else if (legal.playableSituations.includes(id)) act({ type: 'PLAY_SITUATION_FROM_HAND', playerId: me, cardId: id });
    else if (legal.playableCards.includes(id)) act({ type: 'PLAY_CARD', playerId: me, cardId: id });
  };

  const prompt = getPrompt(view);
  const winner = view.winnerId ? nameOf(view.winnerId) : null;

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <strong>School Days</strong> · Room {room?.code} · Turn {view.turn}
        </div>
        <div className={isMyTurn ? styles.myTurn : styles.turn}>
          {winner ? `${winner} wins!` : isMyTurn ? 'Your turn' : `${nameOf(view.currentPlayerId)}'s turn`}
        </div>
        <button className={styles.leave} onClick={leave}>
          Leave
        </button>
      </header>

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
            </div>
          </div>
        ))}
      </section>

      <main className={styles.board}>
        <div className={styles.center}>
          <p className={styles.prompt}>{prompt}</p>

          {view.activeSituation && (
            <div className={styles.combat}>
              <PlaceholderCard id={view.activeSituation.cardId} />
              {view.activeSituation.math && (
                <div className={styles.math}>
                  <div className={styles.mathRow}>
                    <span>Your total</span>
                    <strong>{view.activeSituation.math.total}</strong>
                  </div>
                  {view.activeSituation.helperId && (
                    <div className={styles.mathRow}>
                      <span>incl. {nameOf(view.activeSituation.helperId)}</span>
                      <span>+{view.activeSituation.math.helperPower}</span>
                    </div>
                  )}
                  <div className={styles.mathRow}>
                    <span>Difficulty</span>
                    <strong>{view.activeSituation.math.difficulty}</strong>
                  </div>
                  <div className={view.activeSituation.math.wins ? styles.willWin : styles.willLose}>
                    {view.activeSituation.math.wins ? 'Winning' : 'Not enough yet'}
                  </div>
                </div>
              )}
            </div>
          )}

          {view.pendingHelp && (
            <p className={styles.pending}>
              {nameOf(view.pendingHelp.requesterId)} asked {nameOf(view.pendingHelp.helperId)} for help — offering{' '}
              {view.pendingHelp.offeredExperience} Experience.
            </p>
          )}

          {/* ── Controls ── */}
          <div className={styles.controls}>
            {legal.canDraw && (
              <button className={styles.primary} onClick={() => act({ type: 'DRAW_SITUATION', playerId: me })}>
                Draw Situation ({view.situationDeckCount})
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
            {view.log.slice(-40).map((e) => (
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
          {self && <span className={styles.charChip}>{cardName(self.characterId)}</span>}
          <span className={styles.level}>
            Hand {view.yourSituationHand.length + view.yourExperienceHand.length}/{HAND_LIMIT}
          </span>
        </div>

        <div className={styles.equipped}>
          <span className={styles.zoneLabel}>
            Equipped{legal.unequippable.length > 0 && <em className={styles.hintInline}> · click to unequip</em>}
          </span>
          <div className={styles.cardRow}>
            {equipped.map((id) => (
              <PlaceholderCard
                key={id}
                id={id}
                size="sm"
                onClick={legal.unequippable.includes(id) ? () => act({ type: 'UNEQUIP_CARD', playerId: me, cardId: id }) : undefined}
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
    return `Your hand is over ${HAND_LIMIT} — discard a card (toss the new one, or an old one to keep it).`;
  }
  const isMyTurn = view.currentPlayerId === view.you;
  if (view.phase === 'await_help') {
    return view.legal.canRespondToHelp ? "You've been asked to help — accept or decline." : 'Waiting for the helper to respond…';
  }
  if (!isMyTurn) return `Waiting for ${view.players.find((p) => p.id === view.currentPlayerId)?.name ?? 'the current player'}…`;
  switch (view.phase) {
    case 'await_action':
      return 'Draw a Situation, or play a Situation from your hand.';
    case 'combat':
      return 'Play cards to boost your total, ask for help, then Resolve.';
    case 'main':
      return 'Play or equip cards, then End your turn.';
    default:
      return '';
  }
}
