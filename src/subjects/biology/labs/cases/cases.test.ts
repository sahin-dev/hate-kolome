import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SET_A } from './setA';
import { SET_B } from './setB';
import { SET_C } from './setC';

const all = { ...SET_A, ...SET_B, ...SET_C };
const registry = readFileSync(join(__dirname, '../../index.ts'), 'utf8');

describe('chapter CQ sets', () => {
  it('covers every chapter except 2, which has its own', () => {
    expect(Object.keys(all).map(Number).sort((a, b) => a - b)).toEqual([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  const sets = Object.entries(all).flatMap(([ch, list]) => list.map((c) => [`${ch}/${c.id}`, c] as const));

  it.each(sets)('%s is well formed', (_, c) => {
    expect(c.ka.options[c.ka.answer]).toBeTruthy();
    expect(c.kha.good).toHaveLength(2);
    expect(c.kha.bad.length).toBeGreaterThanOrEqual(2);
    expect(c.ga.good).toHaveLength(3);
    expect(c.gha.good).toHaveLength(3);
    expect(c.gha.claims[c.gha.claim]).toBeTruthy();
    for (const p of [c.kha, c.ga, c.gha]) {
      expect(new Set([...p.good, ...p.bad]).size).toBe(p.good.length + p.bad.length);
      expect(p.model.length).toBeGreaterThan(40);
    }
  });

  it.each(sets.filter(([, c]) => c.labTry))('%s links to a lab that exists', (_, c) => {
    const id = c.labTry!.split('/').pop()!;
    expect(registry).toContain(`id: '${id}'`);
  });
});
