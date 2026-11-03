import { describe, expect, it } from 'vitest';
import { run } from './cellSim';
import { CHALLENGES, envFor } from './challenges';
import { layoutFor } from './layout';
import { PROFILES, type CellType } from './cellSim';

describe('challenges', () => {
  it.each(CHALLENGES.map((c) => [c.id, c] as const))('%s: the simulation shows the stated answer', (_, c) => {
    expect(c.proves(run(c.type, c.off, envFor(c), c.ticks))).toBe(true);
    expect(c.options[c.answer]).toBeTruthy();
  });
});

describe('layouts', () => {
  const types = Object.keys(PROFILES) as CellType[];

  it.each(types)('%s: placed organelles do not overlap', (type) => {
    const L = layoutFor(type);
    // Muscle mitochondria lie flat in rows, so their spacing is measured across the short side.
    const mitoR = L.mitoFlat ? 30 : 50;
    const big = [...L.mito.map((p) => ({ p, r: mitoR })), ...L.chloro.map((p) => ({ p, r: 45 })), ...L.lyso.map((p) => ({ p, r: 23 }))];
    for (let i = 0; i < big.length; i++) {
      for (let j = i + 1; j < big.length; j++) {
        const d = Math.hypot(big[i].p[0] - big[j].p[0], big[i].p[1] - big[j].p[1]);
        expect(d).toBeGreaterThan(big[i].r + big[j].r);
      }
    }
  });

  it('specialised cells have more of the organelle their job needs', () => {
    expect(layoutFor('muscle').mito.length).toBeGreaterThan(layoutFor('animal').mito.length * 1.5);
    expect(layoutFor('wbc').lyso.length).toBeGreaterThan(layoutFor('animal').lyso.length * 1.5);
    expect(layoutFor('gland').golgi.length).toBeGreaterThan(layoutFor('animal').golgi.length);
    expect(layoutFor('plant').chloro.length).toBeGreaterThanOrEqual(6);
    expect(layoutFor('plant').mito.length).toBeGreaterThanOrEqual(3);
    expect(layoutFor('gland').mito.length).toBeGreaterThanOrEqual(3);
    expect(layoutFor('animal').mito.length).toBeGreaterThanOrEqual(3);
    expect(layoutFor('root').mito.length).toBeGreaterThanOrEqual(3);
    expect(layoutFor('muscle').mito.length).toBeGreaterThanOrEqual(8);
    expect(layoutFor('root').chloro.length).toBe(0);
  });
});
