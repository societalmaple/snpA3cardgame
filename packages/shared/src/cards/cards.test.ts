import { describe, it, expect } from 'vitest';
import { SITUATIONS, SUPPORTS, SELF_ADVOCACY } from './index.ts';

describe('situation card data', () => {
  it('keeps every base difficulty within 1-15', () => {
    for (const s of SITUATIONS) {
      const d = s.baseDifficulty;
      expect(d, `${s.id} difficulty ${d} out of range`).toBeGreaterThanOrEqual(1);
      expect(d, `${s.id} difficulty ${d} out of range`).toBeLessThanOrEqual(15);
    }
  });

  it('declares barriers and at least one valid approach per situation', () => {
    for (const s of SITUATIONS) {
      expect(s.barriers && s.barriers.length > 0, `${s.id} should declare barriers`).toBe(true);
      const approaches =
        (s.validStrengths?.length ?? 0) +
        (s.validSupports?.length ?? 0) +
        (s.validSelfAdvocacy?.length ?? 0);
      expect(approaches, `${s.id} should have at least one valid approach`).toBeGreaterThan(0);
    }
  });
});

describe('support card data', () => {
  it('has 10 Supports with teaching text and effects', () => {
    expect(SUPPORTS).toHaveLength(10);
    for (const s of SUPPORTS) {
      expect(s.effects.length, `${s.id} has no effects`).toBeGreaterThan(0);
      expect(s.teachingText && s.teachingText.length > 0, `${s.id} missing teaching text`).toBe(true);
    }
  });
});

describe('self-advocacy card data', () => {
  it('has 6 Self-Advocacy cards with teaching text and effects', () => {
    expect(SELF_ADVOCACY).toHaveLength(6);
    for (const s of SELF_ADVOCACY) {
      expect(s.effects.length, `${s.id} has no effects`).toBeGreaterThan(0);
      expect(s.teachingText && s.teachingText.length > 0, `${s.id} missing teaching text`).toBe(true);
    }
  });
});