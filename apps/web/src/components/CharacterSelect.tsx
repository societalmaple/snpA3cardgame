import { cardOf, type PlayerView } from '@school-days/shared';
import { useStore } from '../store.ts';
import { PlaceholderCard } from './PlaceholderCard.tsx';
import styles from './CharacterSelect.module.css';

export function CharacterSelect({ view }: { view: PlayerView }) {
  const { sendAction } = useStore();
  const me = view.you;
  const self = view.players.find((p) => p.id === me);
  const chosen = self?.characterId ?? null;

  return (
    <div className={styles.wrap}>
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
