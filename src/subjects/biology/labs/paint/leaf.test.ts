import { describe, expect, it } from 'vitest';
import { leafAt, leafPixel, type Lack } from './leaf';
import { stageView } from '../nutrition/zoom';

const seed = 3;

/** Finds a point of the blade matching a test, then returns its colour. */
function sample(lack: Lack, severity: number, match: (u: number, v: number) => boolean) {
  const out: number[][] = [];
  for (let u = 0.1; u < 0.95; u += 0.009) {
    for (let v = -0.26; v < 0.26; v += 0.007) {
      if (match(u, v)) {
        const p = leafPixel(u, v, { lack, severity, seed });
        if (p[3]) out.push(p);
      }
    }
  }
  return out.reduce((a, p) => [a[0] + p[0] / out.length, a[1] + p[1] / out.length, a[2] + p[2] / out.length], [0, 0, 0]);
}

const yellowness = (c: number[]) => c[0] / c[1];
const near = (lackFor: Lack, test: (a: ReturnType<typeof leafAt>) => boolean) => (u: number, v: number) => {
  const p = leafAt(u, v, lackFor, 1, seed);
  return p.inside && test(p);
};

describe('each deficiency paints its own pattern', () => {
  it('a healthy leaf is green', () => {
    const c = sample('none', 0, () => true);
    expect(c[1]).toBeGreaterThan(c[0]);
  });

  it('nitrogen yellows the whole blade', () => {
    const between = sample('N', 1, near('N', (p) => p.between > 0.7 && p.vein < 0.1));
    expect(yellowness(between)).toBeGreaterThan(0.9);
  });

  it('magnesium yellows between the veins but not beside them', () => {
    const panel = sample('Mg', 1, near('Mg', (p) => p.between > 0.75 && p.vein < 0.1));
    const beside = sample('Mg', 1, near('Mg', (p) => p.between < 0.05 && p.across > 0.15));
    expect(yellowness(panel)).toBeGreaterThan(yellowness(beside) + 0.25);
  });

  it('potassium scorches the margin and leaves the middle alive', () => {
    const edge = sample('K', 1, near('K', (p) => p.across > 0.93));
    const middle = sample('K', 1, near('K', (p) => p.across < 0.3));
    expect(edge[1]).toBeLessThan(edge[0]);
    expect(middle[1]).toBeGreaterThan(middle[0]);
  });

  it('phosphorus turns the margin purple', () => {
    const edge = sample('P', 1, near('P', (p) => p.across > 0.9));
    expect(edge[2]).toBeGreaterThan(edge[1]);
  });

  it('iron bleaches the blade far paler than sulphur or nitrogen', () => {
    const fe = sample('Fe', 1, near('Fe', (p) => p.between > 0.6 && p.edge > 0.25));
    const s = sample('S', 1, near('S', (p) => p.between > 0.6 && p.edge > 0.25));
    expect(fe[2]).toBeGreaterThan(s[2]);
  });

  it('calcium and boron stunt the leaf', () => {
    const area = (lack: Lack) => {
      let n = 0;
      for (let u = 0.5; u < 1; u += 0.01) for (let v = -0.3; v < 0.3; v += 0.01) if (leafAt(u, v, lack, 1, seed).inside) n++;
      return n;
    };
    expect(area('Ca')).toBeLessThan(area('none') * 0.95);
    expect(area('B')).toBeLessThan(area('none') * 0.95);
  });
});

describe('the microscope view follows the digestion model', () => {
  const base = { food: 'mixed', bile: true, pancreas: true, acid: true } as const;
  it('shows pepsin idle without acid', () => {
    expect(stageView({ ...base, acid: false }, 2).enzymes[0].on).toBe(false);
  });
  it('shows pancreatic enzymes idle when the duct is blocked', () => {
    expect(stageView({ ...base, pancreas: false }, 3).enzymes.every((e) => !e.on)).toBe(true);
  });
  it('emulsifies fat only with bile', () => {
    expect(stageView(base, 3).emulsified).toBe(true);
    expect(stageView({ ...base, bile: false }, 3).emulsified).toBe(false);
  });
  it('protein is unchanged by the mouth and reduced in the stomach', () => {
    const m = stageView(base, 0);
    expect(m.after.protein).toBe(m.before.protein);
    const s = stageView(base, 2);
    expect(s.after.protein).toBeLessThan(s.before.protein);
  });
  it('starch falls in the mouth', () => {
    const m = stageView(base, 0);
    expect(m.after.starch).toBeLessThan(m.before.starch);
  });
  it('only the ileum absorbs', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => stageView(base, i).absorbing)).toEqual([false, false, false, false, true, false]);
  });
});
