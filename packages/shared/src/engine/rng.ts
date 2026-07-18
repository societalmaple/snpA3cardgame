// Pure, seeded PRNG (mulberry32). State is a single uint32 threaded through the
// engine so the whole game is deterministic and reproducible for tests. The seed
// lives server-side and is never sent to clients (prevents predicting draws).

export function nextFloat(state: number): { value: number; state: number } {
  const a = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a };
}

/** Uniform integer in [0, maxExclusive). */
export function nextInt(state: number, maxExclusive: number): { value: number; state: number } {
  const r = nextFloat(state);
  return { value: Math.floor(r.value * maxExclusive), state: r.state };
}

/** Immutable Fisher-Yates shuffle returning a new array and advanced rng state. */
export function shuffle<T>(items: readonly T[], state: number): { items: T[]; state: number } {
  const arr = items.slice();
  let s = state;
  for (let i = arr.length - 1; i > 0; i--) {
    const r = nextInt(s, i + 1);
    s = r.state;
    const j = r.value;
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return { items: arr, state: s };
}
