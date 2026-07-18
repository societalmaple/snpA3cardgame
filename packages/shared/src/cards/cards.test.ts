import { describe, it, expect } from 'vitest';
import { SITUATIONS } from './index.ts';

describe('situation card data', () => {
  it('keeps every difficulty within 2-10', () => {
    for (const s of SITUATIONS) {
      expect(s.difficulty, `${s.id} difficulty ${s.difficulty} out of range`).toBeGreaterThanOrEqual(2);
      expect(s.difficulty, `${s.id} difficulty ${s.difficulty} out of range`).toBeLessThanOrEqual(10);
    }
  });

  it('spans the full 2-10 range (min 2, max 10)', () => {
    const diffs = SITUATIONS.map((s) => s.difficulty);
    expect(Math.min(...diffs)).toBe(2);
    expect(Math.max(...diffs)).toBe(10);
  });
});
