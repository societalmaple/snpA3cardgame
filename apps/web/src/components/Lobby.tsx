import { useState } from 'react';
import { MIN_PLAYERS, MAX_PLAYERS } from '@school-days/shared';
import { useStore } from '../store.ts';
import styles from './Lobby.module.css';

export function Lobby() {
  const { room, session, connected, createRoom, joinRoom, setReady, startGame, leave } = useStore();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  // Not in a room yet → create / join form.
  if (!room || !session) {
    return (
      <div className={styles.wrap}>
        <div className={styles.panel}>
          <h1 className={styles.title}>School Days</h1>
          <p className={styles.sub}>Online card game for {MIN_PLAYERS}–{MAX_PLAYERS} players</p>

          <label className={styles.label}>Your name</label>
          <input
            className={styles.input}
            value={name}
            maxLength={16}
            placeholder="e.g. Alex"
            onChange={(e) => setName(e.target.value)}
          />

          <button className={styles.primary} disabled={!connected || !name.trim()} onClick={() => createRoom(name)}>
            Create a room
          </button>

          <div className={styles.divider}>or join with a code</div>

          <div className={styles.row}>
            <input
              className={styles.input}
              value={code}
              maxLength={6}
              placeholder="CODE"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button className={styles.secondary} disabled={!connected || !name.trim() || !code.trim()} onClick={() => joinRoom(code, name)}>
              Join
            </button>
          </div>

          {!connected && <p className={styles.warn}>Connecting to server…</p>}
        </div>
      </div>
    );
  }

  // In a room lobby.
  const me = room.players.find((p) => p.id === session.playerId);
  const isHost = !!me?.isHost;
  const canStart = isHost && room.players.length >= MIN_PLAYERS && room.players.every((p) => p.ready);

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <h1 className={styles.title}>Room {room.code}</h1>
        <p className={styles.sub}>Share this code so friends can join.</p>

        <ul className={styles.players}>
          {room.players.map((p) => (
            <li key={p.id} className={styles.player}>
              <span className={styles.pname}>
                {p.name}
                {p.isHost && <span className={styles.host}> host</span>}
                {p.id === session.playerId && <span className={styles.you}> you</span>}
              </span>
              <span className={p.ready ? styles.ready : styles.notReady}>{p.ready ? 'Ready' : 'Not ready'}</span>
            </li>
          ))}
        </ul>

        <button className={me?.ready ? styles.secondary : styles.primary} onClick={() => setReady(!me?.ready)}>
          {me?.ready ? 'Cancel ready' : "I'm ready"}
        </button>

        {isHost && (
          <button className={styles.primary} disabled={!canStart} onClick={startGame}>
            Start game
          </button>
        )}
        {isHost && !canStart && (
          <p className={styles.hint}>Need {MIN_PLAYERS}–{MAX_PLAYERS} players, everyone ready.</p>
        )}

        <button className={styles.ghost} onClick={leave}>
          Leave room
        </button>
      </div>
    </div>
  );
}
