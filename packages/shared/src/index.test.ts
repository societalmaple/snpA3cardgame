import { describe, it, expect } from 'vitest';
import { GAME_NAME, TARGET_LEVEL } from './index';

describe('shared scaffold', () => {
  it('exposes game constants', () => {
    expect(GAME_NAME).toBe('Solve It!');
    expect(TARGET_LEVEL).toBe(15);
  });
});
