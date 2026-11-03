import { describe, expect, it } from 'vitest';
import { NORMAL_ENV, PROFILES, freshCell, step } from './cellSim';

function offThenOn(offTicks: number, afterTicks: number) {
  const p = PROFILES.animal;
  let s = freshCell();
  const off = new Set(['mito']);
  const on = new Set<string>();
  for (let i = 0; i < offTicks; i++) s = step(s, p, off, NORMAL_ENV);
  for (let i = 0; i < afterTicks; i++) s = step(s, p, on, NORMAL_ENV);
  return s;
}

describe('rescuing a cell', () => {
  it('recovers if mitochondria return quickly', () => {
    const s = offThenOn(15, 60);
    expect(s.dead).toBe(false);
    expect(s.atp).toBeGreaterThan(0.9);
  });

  it('cannot be saved once lysosomes have ruptured', () => {
    const s = offThenOn(60, 60);
    expect(s.ruptured).toBe(true);
    expect(s.dead).toBe(true);
  });
});
