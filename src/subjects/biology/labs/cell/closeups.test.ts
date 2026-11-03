import { describe, expect, it } from 'vitest';
import { CLOSEUPS, MOLS, simulate } from './closeups';
import { ORG } from './organelles';

const all = Object.values(CLOSEUPS);
const none = new Set<string>();

describe('every cell part has a working close-up', () => {
  it('covers each organelle in the lab', () => {
    expect(Object.keys(CLOSEUPS).sort()).toEqual(Object.keys(ORG).sort());
  });

  it.each(all.map((c) => [c.id, c] as const))('%s runs to the end when nothing is removed', (_, c) => {
    const run = simulate(c, none);
    expect(run.blockedAt).toBe(-1);
    const end = run.stocks[run.stocks.length - 1];
    const made = c.outputs.filter((m) => (end[m] ?? 0) > 0);
    expect(made.length).toBeGreaterThan(0);
  });

  it.each(all.map((c) => [c.id, c] as const))('%s only names known molecules', (_, c) => {
    const ids = [...c.inputs, ...c.outputs, ...c.steps.flatMap((s) => [...Object.keys(s.uses ?? {}), ...Object.keys(s.makes ?? {}), ...s.moves.map((m) => m.m)])];
    for (const id of ids) expect(MOLS[id], id).toBeTruthy();
    for (const m of c.inputs) expect((c.start[m] ?? 0), m).toBeGreaterThan(0);
  });

  it.each(all.flatMap((c) => c.inputs.filter((m) => !c.soft?.includes(m)).map((m) => [c.id, m, c] as const)))(
    '%s stops without %s, and says why',
    (_, m, c) => {
      const run = simulate(c, new Set([m]));
      expect(run.blockedAt).toBeGreaterThanOrEqual(0);
      expect(run.missing).toBe(m);
      expect(c.why?.[m]).toBeTruthy();
    },
  );

  it.each(all.map((c) => [c.id, c] as const))('%s has a valid check question', (_, c) => {
    expect(c.check.options[c.check.answer]).toBeTruthy();
  });
});

describe('the books balance', () => {
  const end = (id: string, off = none) => {
    const r = simulate(CLOSEUPS[id], off);
    return r.stocks[r.stocks.length - 1];
  };

  it('one glucose gives 38 ATP, 6 CO₂ and 6 H₂O in total', () => {
    const cyto = end('cytoplasm');
    const mito = end('mito');
    const netCytoplasm = cyto.atp - CLOSEUPS.cytoplasm.start.atp;
    expect(netCytoplasm).toBe(2);
    expect(cyto.pyruvate).toBe(CLOSEUPS.mito.start.pyruvate);
    expect(cyto.nadh).toBe(CLOSEUPS.mito.start.nadh);
    expect(mito.atp).toBe(36);
    expect(netCytoplasm + mito.atp).toBe(38);
    expect(mito.co2).toBe(6);
    expect(mito.h2o).toBe(6);
    expect(mito.o2).toBe(0);
  });

  it('without oxygen the same glucose yields only 2 ATP', () => {
    const r = end('cytoplasm', new Set(['o2']));
    expect(r.atp - CLOSEUPS.cytoplasm.start.atp).toBe(2);
    expect(r.ethanol).toBe(2);
    expect(r.co2).toBe(2);
    expect(r.pyruvate).toBe(0);
  });

  it('photosynthesis matches the book equation and recycles its carriers', () => {
    const c = end('chloro');
    expect(c.co2).toBe(0);
    expect(c.h2o).toBe(6);
    expect(c.glucose).toBe(1);
    expect(c.o2).toBe(6);
    expect(c.adp).toBe(CLOSEUPS.chloro.start.adp);
    expect(c.nadp).toBe(CLOSEUPS.chloro.start.nadp);
    expect(c.atp).toBe(0);
    expect(c.nadph).toBe(0);
  });

  it('haemoglobin gives back all the oxygen it took', () => {
    const c = end('hb');
    expect(c.o2).toBe(4);
    expect(c.hb).toBe(1);
    expect(c.hbo2).toBe(0);
  });

  it('the produced panel never counts what was merely supplied', () => {
    const run = simulate(CLOSEUPS.chloro, none);
    expect(run.made[0].h2o ?? 0).toBe(0);
    expect(run.made[run.made.length - 1].h2o).toBe(6);
    expect(run.stocks[3].light).toBe(1);
    expect(simulate(CLOSEUPS.mito, none).made.at(-1)!.atp).toBe(36);
    expect(simulate(CLOSEUPS.cytoplasm, new Set(['o2'])).made.at(-1)!.ethanol).toBe(2);
  });

  it('light stops food making at the first step', () => {
    expect(simulate(CLOSEUPS.chloro, new Set(['light'])).blockedAt).toBe(0);
  });

  it('losing CO₂ still lets the light stage finish', () => {
    const r = simulate(CLOSEUPS.chloro, new Set(['co2']));
    expect(r.blockedAt).toBe(3);
    expect(r.stocks[2].atp).toBe(18);
  });
});
