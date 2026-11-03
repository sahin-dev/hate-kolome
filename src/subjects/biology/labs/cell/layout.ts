import type { CellType } from './cellSim';

export type Pt = [number, number];
export type Shape = 'blob' | 'box' | 'long' | 'disc';

export interface Layout {
  shape: Shape;
  nucleus?: Pt;
  nucleusScale: number;
  /** Mitochondria lie in lines along the fibre, as they do in muscle. */
  mitoFlat: boolean;
  rer: Pt[];
  ser: Pt[];
  golgi: Pt[];
  mito: Pt[];
  chloro: Pt[];
  lyso: Pt[];
  smallVac: Pt[];
  bigVac?: { x: number; y: number; rx: number; ry: number };
  centro?: Pt;
  ribosomes: Pt[];
  fibres: string[];
}

export const BLOB_OUTLINE = 'M120 100C220 18 560 8 685 96 795 185 772 420 662 492 520 566 250 562 130 472 28 392 36 186 120 100Z';
export const LONG_OUTLINE = 'M40 280C70 150 240 118 400 118S730 150 760 280C730 410 560 442 400 442S70 410 40 280Z';

/** Small seeded generator, so a cell looks the same every time it is opened. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const INSIDE: Record<Shape, (x: number, y: number) => boolean> = {
  blob: (x, y) => ((x - 400) / 310) ** 2 + ((y - 282) / 215) ** 2 < 1,
  box: (x, y) => x > 55 && x < 745 && y > 50 && y < 510,
  long: (x, y) => ((x - 400) / 335) ** 2 + ((y - 280) / 138) ** 2 < 1,
  disc: () => false,
};

interface Spec {
  shape: Shape;
  nucleus?: Pt;
  rer?: Pt[];
  ser?: Pt[];
  golgi?: Pt[];
  centro?: Pt;
  bigVac?: Layout['bigVac'];
  nucleusScale?: number;
  mitoFlat?: boolean;
  /** Hand-placed parts, for cells where accuracy matters more than a natural scatter. */
  fixed?: { mito?: Pt[]; chloro?: Pt[]; lyso?: Pt[] };
  counts: { mito: number; chloro: number; lyso: number; smallVac: number; ribosomes: number };
}

const SPECS: Record<CellType, Spec> = {
  animal: {
    shape: 'blob', nucleus: [245, 240], rer: [[375, 215]], ser: [[365, 400]], golgi: [[525, 170]], centro: [395, 85],
    counts: { mito: 4, chloro: 0, lyso: 3, smallVac: 1, ribosomes: 16 },
  },
  plant: {
    shape: 'box', nucleus: [170, 170], rer: [[305, 110]], ser: [[315, 222]], golgi: [[445, 95]], bigVac: { x: 450, y: 330, rx: 150, ry: 112 },
    fixed: {
      chloro: [[600, 90], [700, 175], [690, 395], [480, 498], [620, 490], [665, 285], [100, 440]],
      mito: [[120, 325], [215, 402], [335, 490]],
      lyso: [[232, 298]],
    },
    counts: { mito: 0, chloro: 0, lyso: 0, smallVac: 0, ribosomes: 12 },
  },
  root: {
    shape: 'box', nucleus: [170, 170], rer: [[305, 110]], ser: [[315, 222]], golgi: [[445, 95]], bigVac: { x: 490, y: 345, rx: 205, ry: 132 },
    counts: { mito: 4, chloro: 0, lyso: 1, smallVac: 0, ribosomes: 12 },
  },
  muscle: {
    shape: 'long', nucleus: [165, 280], nucleusScale: 0.62, ser: [[285, 205]], golgi: [[285, 345]], mitoFlat: true,
    fixed: { mito: [[405, 195], [525, 195], [405, 280], [525, 280], [405, 365], [525, 365], [640, 228], [640, 332]] },
    counts: { mito: 0, chloro: 0, lyso: 0, smallVac: 0, ribosomes: 8 },
  },
  gland: {
    shape: 'blob', nucleus: [175, 285], rer: [[300, 170], [305, 400]], ser: [[450, 300]], golgi: [[470, 150], [470, 430]], centro: [640, 280],
    fixed: { mito: [[195, 130], [605, 175], [612, 398]] },
    counts: { mito: 0, chloro: 0, lyso: 1, smallVac: 0, ribosomes: 14 },
  },
  wbc: {
    shape: 'blob', nucleus: [245, 240], rer: [[375, 215]], golgi: [[525, 170]], centro: [395, 85],
    counts: { mito: 3, chloro: 0, lyso: 9, smallVac: 1, ribosomes: 12 },
  },
  rbc: { shape: 'disc', counts: { mito: 0, chloro: 0, lyso: 0, smallVac: 0, ribosomes: 0 } },
};

const keepOut: Record<string, number> = { nucleus: 118, rer: 112, ser: 75, golgi: 95, centro: 50 };

function buildLayout(type: CellType, seed: number): Layout {
  const spec = SPECS[type];
  const random = rng(seed);
  const inside = INSIDE[spec.shape];
  const taken: { x: number; y: number; r: number }[] = [];

  const block = ([x, y]: Pt, r: number) => taken.push({ x, y, r });
  if (spec.nucleus) block(spec.nucleus, keepOut.nucleus);
  spec.rer?.forEach((p) => block(p, keepOut.rer));
  spec.ser?.forEach((p) => block(p, keepOut.ser));
  spec.golgi?.forEach((p) => block(p, keepOut.golgi));
  if (spec.centro) block(spec.centro, keepOut.centro);
  spec.fixed?.mito?.forEach((p) => block(p, 44));
  spec.fixed?.chloro?.forEach((p) => block(p, 44));
  spec.fixed?.lyso?.forEach((p) => block(p, 26));

  const inBigVac = (x: number, y: number, pad: number) =>
    !!spec.bigVac && ((x - spec.bigVac.x) / (spec.bigVac.rx + pad)) ** 2 + ((y - spec.bigVac.y) / (spec.bigVac.ry + pad)) ** 2 < 1;

  const scatter = (count: number, radius: number) => {
    const out: Pt[] = [];
    for (let tries = 0; out.length < count && tries < 6000; tries++) {
      const x = 60 + random() * 680;
      const y = 50 + random() * 460;
      if (!inside(x, y) || inBigVac(x, y, radius)) continue;
      // Also keep the whole organelle inside the outline, not just its centre.
      if (!inside(x - radius * 0.8, y) || !inside(x + radius * 0.8, y) || !inside(x, y - radius * 0.6) || !inside(x, y + radius * 0.6)) continue;
      if (taken.some((t) => Math.hypot(t.x - x, t.y - y) < t.r + radius)) continue;
      taken.push({ x, y, r: radius });
      out.push([Math.round(x), Math.round(y)]);
    }
    return out;
  };

  const c = spec.counts;
  // Largest parts go first; otherwise small ones can use up the room they need.
  const smallVac = scatter(c.smallVac, 44);
  const chloro = [...(spec.fixed?.chloro ?? []), ...scatter(c.chloro, 50)];
  const mito = [...(spec.fixed?.mito ?? []), ...scatter(c.mito, 54)];
  const lyso = [...(spec.fixed?.lyso ?? []), ...scatter(c.lyso, 26)];
  const ribosomes = scatter(c.ribosomes, 11);

  const fibres: string[] = [];
  if (spec.shape !== 'disc') {
    for (let i = 0; i < 7; i++) {
      // A long cell is narrow, so its fibres keep to the middle and run with the cell.
      const narrow = spec.shape === 'long';
      const y = narrow ? 215 + random() * 130 : 90 + random() * 380;
      const dy = (random() - 0.5) * (narrow ? 30 : 120);
      fibres.push(`M${(narrow ? 110 : 70) + random() * 60} ${y.toFixed(0)}Q400 ${(y + dy).toFixed(0)} ${(narrow ? 630 : 660) + random() * 60} ${(y - dy * 0.4).toFixed(0)}`);
    }
  }

  return {
    shape: spec.shape, nucleus: spec.nucleus, nucleusScale: spec.nucleusScale ?? 1, mitoFlat: !!spec.mitoFlat, rer: spec.rer ?? [], ser: spec.ser ?? [], golgi: spec.golgi ?? [],
    mito, chloro, lyso, smallVac, bigVac: spec.bigVac, centro: spec.centro, ribosomes, fibres,
  };
}

const cache = new Map<CellType, Layout>();

export function layoutFor(type: CellType): Layout {
  let found = cache.get(type);
  if (!found) {
    found = buildLayout(type, type.length * 97 + type.charCodeAt(0));
    cache.set(type, found);
  }
  return found;
}
