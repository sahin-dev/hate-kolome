import { fbm, mix, noise, smooth, type RGB } from './paint';

/** Nutrient problems shown by the leaf, following the signs listed in the book. */
export type Lack = 'none' | 'N' | 'P' | 'K' | 'Mg' | 'Fe' | 'S' | 'Ca' | 'B';

export interface LeafSpec {
  lack: Lack;
  /** 0 is healthy, 1 is the full sign. */
  severity: number;
  seed?: number;
}

const HEALTHY: RGB = [46, 112, 52];
const HEALTHY_LIGHT: RGB = [78, 148, 66];
const YELLOW: RGB = [222, 206, 86];
const PALE: RGB = [238, 232, 158];
const BROWN: RGB = [112, 74, 38];
const PURPLE: RGB = [108, 48, 112];

const lerp = (a: RGB, b: RGB, k: number): RGB => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];

/** Half the width of the blade at a point along the midrib, as a share of its length. */
export function halfWidth(u: number, lack: Lack, severity: number) {
  if (u <= 0 || u >= 1) return 0;
  const body = Math.sin(Math.PI * u ** 0.72) ** 0.8 * 0.27;
  const tip = u > 0.8 ? 1 - ((u - 0.8) / 0.2) ** 2 * 0.25 : 1;
  const stunted = lack === 'Ca' || lack === 'B' ? 1 - severity * 0.2 * smooth(0.45, 1, u) : 1;
  return body * tip * stunted;
}

/** Nearest and second-nearest cell points: their gap traces the fine net of small veins. */
function cells(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 9;
  let f2 = 9;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const px = xi + i + noise((xi + i) * 3.17, (yi + j) * 1.13, seed) * 1.6 - 0.3;
      const py = yi + j + noise((xi + i) * 1.71, (yi + j) * 2.93, seed + 7) * 1.6 - 0.3;
      const d = Math.hypot(px - x, py - y);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return { f1, edge: f2 - f1 };
}

export interface LeafPoint {
  inside: boolean;
  /** 0 at the midrib, 1 at the margin. */
  across: number;
  /** 0 on a side vein, 1 half-way between two. */
  between: number;
  vein: number;
  edge: number;
  f1: number;
}

/** Geometry of the blade at (u along the midrib, v across it). */
export function leafAt(u: number, v: number, lack: Lack, severity: number, seed: number): LeafPoint {
  const axis = 0.03 * Math.sin(Math.PI * u);
  const y = v - axis;
  const wobble = (fbm(u * 9, v > 0 ? 1 : 4, seed, 2) - 0.5) * 0.022;
  const crinkle = lack === 'Ca' || lack === 'B' ? (fbm(u * 18, y * 18, seed + 2, 2) - 0.5) * 0.05 * severity : 0;
  const w = halfWidth(u, lack, severity) + wobble + crinkle;
  if (w <= 0 || Math.abs(y) > w) return { inside: false, across: 1, between: 1, vein: 0, edge: 0, f1: 0 };

  const across = Math.abs(y) / w;
  const side = y >= 0 ? 0 : 0.5;
  const spacing = 0.098;
  // Side veins leave the midrib and sweep forward towards the margin.
  const s = u - 0.05 - 0.2 * across ** 1.25;
  const f = s / spacing + side;
  const gap = Math.abs(f - Math.round(f));
  const between = gap * 2;
  const sideWidth = mix(0.05, 0.016, across);
  const sideVein = 1 - smooth(sideWidth * 0.5, sideWidth * 1.8, gap);
  const midWidth = mix(0.012, 0.0028, u);
  const midrib = 1 - smooth(midWidth * 0.6, midWidth * 1.6, Math.abs(y));
  const { f1, edge } = cells(u * 44, y * 44, seed);
  const net = 1 - smooth(0.02, 0.11, edge);

  return { inside: true, across, between, vein: Math.max(midrib, sideVein * 0.9, net * 0.4), edge, f1 };
}

/** The colour of the blade: this is where each deficiency shows its own pattern. */
function blade(p: LeafPoint, u: number, v: number, spec: LeafSpec, seed: number): RGB {
  const { lack, severity: k } = spec;
  const patch = fbm(u * 7, v * 7, seed + 3, 3);
  let c = lerp(HEALTHY, HEALTHY_LIGHT, smooth(0.3, 0.75, patch));
  const veinKeep = 1 - p.between;

  switch (lack) {
    case 'N': {
      // Yellowing is even across the blade, strongest from the tip.
      const amount = k * mix(0.68, 1, smooth(0.3, 0.95, u + (patch - 0.5) * 0.2));
      c = lerp(c, YELLOW, amount);
      break;
    }
    case 'P': {
      c = lerp(c, [32, 78, 62], k * 0.7);
      const edge = smooth(0.5, 0.95, p.across + (patch - 0.5) * 0.5);
      c = lerp(c, PURPLE, k * edge * 0.9);
      break;
    }
    case 'K': {
      // Scorch creeps in from the margin and tip, with a yellow halo ahead of it.
      const m = p.across + smooth(0.75, 1, u) * 0.4 + (patch - 0.5) * 0.28;
      c = lerp(c, YELLOW, k * smooth(0.52, 0.72, m));
      c = lerp(c, BROWN, k * smooth(0.76, 0.84, m));
      break;
    }
    case 'Mg': {
      // Veins stay green while the panels between them turn yellow.
      const panel = smooth(0.08, 0.42, p.between + (patch - 0.5) * 0.42);
      c = lerp(c, YELLOW, k * panel);
      if (u > 0.72) c = lerp(c, [196, 96, 44], k * panel * smooth(0.72, 1, u) * 0.7);
      break;
    }
    case 'Fe': {
      // Young leaves turn almost white, with only a fine green net left.
      const netKeep = 1 - smooth(0.01, 0.1, p.edge);
      c = lerp(c, PALE, k * (1 - Math.max(netKeep * 0.3, (1 - smooth(0, 0.22, p.between)) * 0.62)));
      break;
    }
    case 'S': {
      c = lerp(c, [176, 196, 96], k * 0.92);
      break;
    }
    case 'Ca': {
      const m = p.across + smooth(0.6, 1, u) * 0.5 + (patch - 0.5) * 0.3;
      c = lerp(c, [150, 170, 84], k * 0.5);
      c = lerp(c, BROWN, k * smooth(0.86, 0.94, m));
      break;
    }
    case 'B': {
      c = lerp(c, [120, 136, 64], k * 0.65);
      c = lerp(c, BROWN, k * smooth(0.7, 0.76, fbm(u * 13, v * 13, seed + 8, 2)) * 0.8);
      break;
    }
    default:
  }

  // Small necrotic flecks mark the worst of potassium and magnesium shortage.
  if ((lack === 'K' || lack === 'Mg') && k > 0.5 && noise(u * 70, v * 70, seed + 11) > 0.84) c = lerp(c, BROWN, (k - 0.5) * 1.4);

  const veinColor = lerp(c, lerp(HEALTHY_LIGHT, [170, 192, 112], 0.6), lack === 'Mg' || lack === 'Fe' ? 0.2 : 0.55);
  if (lack === 'Mg' || lack === 'Fe') c = lerp(c, HEALTHY, k * 0.85 * veinKeep * (1 - smooth(0.02, 0.1, p.between)));
  return lerp(c, veinColor, p.vein);
}

/** RGBA for one point of the leaf. Pure, so the patterns can be tested without a screen. */
export function leafPixel(u: number, v: number, spec: LeafSpec): [number, number, number, number] {
  const seed = spec.seed ?? 3;
  const p = leafAt(u, v, spec.lack, spec.severity, seed);
  if (!p.inside) return [0, 0, 0, 0];
  const c = blade(p, u, v, spec, seed);

  // Quilted relief: the blade bulges between the veins and catches the light.
  const quilt = Math.sin(p.between * Math.PI) * 0.13;
  const cell = smooth(0, 0.55, p.f1) * 0.05;
  const grain = (noise(u * 240, v * 240, seed) - 0.5) * 0.05;
  const lit = 0.84 + quilt + cell + grain + (v < 0 ? 0.05 : -0.05) + (1 - p.across) * 0.08;
  const sheen = smooth(0.66, 0.95, fbm(u * 5 + 2, v * 15, seed + 5, 3)) * 20 * (1 - p.across * 0.5);
  return [Math.min(255, c[0] * lit + sheen), Math.min(255, c[1] * lit + sheen), Math.min(255, c[2] * lit + sheen * 0.8), 255];
}

const leaves = new Map<string, HTMLCanvasElement>();

/** Paints a leaf pointing right, with its stalk attached at the left. Results are kept. */
export function renderLeaf(spec: LeafSpec, width: number) {
  const key = `${spec.lack}${spec.severity}${spec.seed ?? 3}${width}`;
  const found = leaves.get(key);
  if (found) return found;

  const height = Math.round(width * 0.66);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(width, height);
  const inner = width * 0.92;
  const left = width * 0.06;
  // Large leaves take a second sample per pixel for a smooth margin; small ones are not worth it.
  const fine = width >= 300;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = (y - height / 2) / inner;
      const u = (x - left) / inner;
      const a = leafPixel(u, v, spec);
      const b = fine ? leafPixel(u + 0.5 / inner, v + 0.5 / inner, spec) : a;
      const j = (y * width + x) * 4;
      const n = (a[3] ? 1 : 0) + (b[3] ? 1 : 0);
      if (!n) continue;
      const pick = a[3] ? a : b;
      img.data[j] = pick[0];
      img.data[j + 1] = pick[1];
      img.data[j + 2] = pick[2];
      img.data[j + 3] = n === 2 ? 255 : 128;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalCompositeOperation = 'destination-over';
  ctx.strokeStyle = '#6f8a44';
  ctx.lineWidth = width * 0.012;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(left + 8, height / 2);
  ctx.stroke();
  leaves.set(key, c);
  return c;
}
