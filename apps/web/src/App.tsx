import { useEffect } from 'react';
import { useStore } from './store.ts';
import { Lobby } from './components/Lobby.tsx';
import { Game } from './components/Game.tsx';
import styles from './App.module.css';

export function App() {
  const { init, room, view, error, clearError } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      {room && view && room.phase !== 'lobby' ? <Game view={view} /> : <Lobby />}
      {error && (
        <button className={styles.toast} onClick={clearError}>
          {error}
          <span className={styles.dismiss}>✕</span>
        </button>
      )}
    </>
  );
}
