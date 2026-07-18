import { GAME_NAME, TARGET_LEVEL } from '@school-days/shared';

export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>{GAME_NAME}</h1>
      <p>
        Scaffold ready. First to Well-Being Level {TARGET_LEVEL} wins. The lobby and
        game UI arrive in Phase 2.
      </p>
    </main>
  );
}
