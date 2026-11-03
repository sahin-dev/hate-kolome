import { describe, expect, it } from 'vitest';
import { CASES, scoreReasons } from './cases';
import { CHALLENGES } from './challenges';

describe('creative question cases', () => {
  it.each(CASES.map((c) => [c.id, c] as const))('%s is well formed', (_, c) => {
    expect(c.ka.options[c.ka.answer]).toBeTruthy();
    expect(c.kha.good).toHaveLength(2);
    expect(c.ga.good).toHaveLength(3);
    expect(c.gha.good).toHaveLength(3);
    expect(c.gha.claims[c.gha.claim]).toBeTruthy();
    if (c.labTry) expect(CHALLENGES.some((x) => x.id === c.labTry)).toBe(true);
  });

  it('marks cannot be gained by choosing everything', () => {
    expect(scoreReasons(['a', 'b'], ['a', 'b'], 2)).toBe(2);
    expect(scoreReasons(['a', 'x'], ['a', 'b'], 2)).toBe(0);
    expect(scoreReasons(['x', 'y'], ['a', 'b'], 2)).toBe(0);
  });
});
