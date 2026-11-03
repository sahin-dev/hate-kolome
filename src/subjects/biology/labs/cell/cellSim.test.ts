import { describe, expect, it } from 'vitest';
import { NORMAL_ENV, PROFILES, freshCell, isPlasmolysed, run, step, type CellType } from './cellSim';

describe('healthy cells', () => {
  it.each(Object.keys(PROFILES) as CellType[])('%s stays alive in normal conditions', (type) => {
    const s = run(type, [], NORMAL_ENV, 400);
    expect(s.dead).toBe(false);
    expect(s.atp).toBeGreaterThan(0.9);
  });
});

describe('energy', () => {
  it('without mitochondria ATP falls to the anaerobic share, 2 of 38', () => {
    const s = run('animal', ['mito'], NORMAL_ENV, 45);
    expect(s.atp).toBeCloseTo(2 / 38, 1);
  });

  it('oxygen shortage ruptures lysosomes and kills the cell', () => {
    const s = run('animal', [], { ...NORMAL_ENV, oxygen: false }, 300);
    expect(s.ruptured).toBe(true);
    expect(s.cause).toBe('rupture');
  });

  it('a red blood cell carries oxygen but does not need it', () => {
    const s = run('rbc', [], { ...NORMAL_ENV, oxygen: false }, 300);
    expect(s.dead).toBe(false);
    expect(s.atp).toBeGreaterThan(0.9);
  });

  it('a red blood cell still dies without glucose', () => {
    expect(run('rbc', [], { ...NORMAL_ENV, glucose: false }, 800).dead).toBe(true);
  });

  it('a muscle cell runs out of ATP faster than an ordinary cell', () => {
    const env = { ...NORMAL_ENV, oxygen: false };
    expect(run('muscle', [], env, 6).atp).toBeLessThan(run('animal', [], env, 6).atp);
  });

  it('a leaf cell feeds itself in light, a root cell cannot', () => {
    const env = { ...NORMAL_ENV, glucose: false };
    expect(run('plant', [], env, 400).dead).toBe(false);
    expect(run('root', [], env, 400).dead).toBe(true);
  });

  it('a leaf cell in the dark lives on stored food, then starves', () => {
    const dark = { ...NORMAL_ENV, glucose: false, light: false };
    expect(run('plant', [], dark, 40).atp).toBeGreaterThan(0.9);
    expect(run('plant', [], dark, 400).dead).toBe(true);
  });
});

describe('protein route', () => {
  it('without ribosomes protein making stops', () => {
    expect(run('animal', ['ribosome'], NORMAL_ENV, 100).protein).toBeLessThan(0.05);
  });

  it('without Golgi the protein is made but never secreted', () => {
    const s = run('gland', ['golgi'], NORMAL_ENV, 80);
    expect(s.protein).toBeGreaterThan(0.9);
    expect(s.secretion).toBeLessThan(0.02);
    expect(s.dead).toBe(false);
  });
});

describe('cleaning', () => {
  it('without lysosomes waste builds up', () => {
    expect(run('animal', ['lyso'], NORMAL_ENV, 60).waste).toBeGreaterThan(0.7);
  });
});

describe('water', () => {
  const pure = { ...NORMAL_ENV, solution: 'hypo' as const };
  const salt = { ...NORMAL_ENV, solution: 'hyper' as const };

  it('an animal cell bursts in pure water', () => {
    expect(run('animal', [], pure, 100).cause).toBe('burst');
  });

  it('the wall stops a plant cell bursting', () => {
    const s = run('plant', [], pure, 200);
    expect(s.dead).toBe(false);
    expect(s.water).toBeGreaterThan(1.05);
  });

  it('a plant cell without its wall bursts', () => {
    expect(run('plant', ['wall'], pure, 100).cause).toBe('burst');
  });

  it('a plant cell plasmolyses in salt water', () => {
    expect(isPlasmolysed(PROFILES.plant, run('plant', [], salt, 60))).toBe(true);
  });

  it('losing the vacuole makes a plant cell go limp', () => {
    expect(run('plant', ['vacuole'], NORMAL_ENV, 60).water).toBeLessThan(0.9);
  });
});

it('a dead cell stops changing', () => {
  const dead = { ...freshCell(), dead: true };
  expect(step(dead, PROFILES.animal, new Set(), NORMAL_ENV)).toBe(dead);
});

it('removing the membrane is immediately fatal', () => {
  expect(run('animal', ['membrane'], NORMAL_ENV, 1).cause).toBe('membrane');
});
