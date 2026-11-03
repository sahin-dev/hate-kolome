import { curve, fbm, inflate, layer, shape, tube, type Pt } from '../paint/paint';

export const W = 640;
export const H = 860;

export type OrganId = 'mouth' | 'oesophagus' | 'stomach' | 'liver' | 'gall' | 'pancreas' | 'duodenum' | 'ileum' | 'colon';

export interface GutLayers {
  base: HTMLCanvasElement;
  organs: Record<OrganId, HTMLCanvasElement>;
  path: Pt[];
  /** Fraction along `path` for each stop of the journey. */
  stops: number[];
}

const OESOPHAGUS: Pt[] = [[320, 138], [319, 190], [322, 250], [334, 296], [352, 322]];
const STOMACH_AXIS: Pt[] = [[352, 322], [398, 352], [420, 402], [396, 452], [346, 474]];
const DUODENUM: Pt[] = [[346, 474], [306, 478], [272, 498], [268, 540], [296, 566], [340, 562]];

/** Small intestine: a long tube packed tightly into the lower abdomen, row upon row. */
function ileumPath(): Pt[] {
  const pts: Pt[] = [[340, 562]];
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    const y = 580 + r * 25;
    const right = r % 2 === 0;
    const x0 = right ? 226 : 436;
    const x1 = right ? 436 : 226;
    for (let k = 0; k <= 4; k++) {
      const x = x0 + ((x1 - x0) * k) / 4;
      pts.push([x, y + Math.sin(k * 2.1 + r * 1.7) * 10]);
    }
  }
  pts.push([240, 762], [214, 744]);
  return pts;
}

const ILEUM = ileumPath();

/** Large intestine: up the person's right side, across, and down the left. */
const COLON: Pt[] = [
  [206, 738], [176, 730], [160, 680], [156, 610], [162, 548], [188, 516], [250, 506], [320, 514], [400, 506], [456, 516],
  [484, 556], [488, 620], [486, 690], [474, 748], [430, 784], [372, 780], [336, 800], [322, 836],
];

function silhouette(c: CanvasRenderingContext2D) {
  const right: Pt[] = [[320, 16], [362, 30], [380, 74], [372, 118], [352, 150], [348, 176], [362, 196], [430, 216], [484, 244], [504, 296], [500, 380], [486, 470], [486, 540], [504, 620], [526, 710], [536, 800], [536, 870]];
  const left = right.slice(1).reverse().map(([x, y]) => [640 - x, y] as Pt);
  const line = curve([...right, ...left], 2);
  c.beginPath();
  line.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
}

/** A soft outline of the body: it frames the organs without competing with them. */
function bodyLayer() {
  const out = layer(W, H);
  const c = out.getContext('2d')!;
  const fill = c.createRadialGradient(300, 430, 40, 320, 470, 470);
  fill.addColorStop(0, '#3d5052');
  fill.addColorStop(0.6, '#2b3d40');
  fill.addColorStop(1, '#1b2b2e');
  silhouette(c);
  c.fillStyle = fill;
  c.fill();
  c.save();
  silhouette(c);
  c.clip();
  c.lineWidth = 34;
  c.filter = 'blur(16px)';
  c.strokeStyle = 'rgba(8,16,18,.85)';
  silhouette(c);
  c.stroke();
  c.restore();
  c.filter = 'none';
  c.lineWidth = 1.5;
  c.strokeStyle = 'rgba(190,214,208,.22)';
  silhouette(c);
  c.stroke();
  return out;
}

/** Runs on an idle moment: the shading is per pixel, so it is done once and kept. */
function build(): GutLayers {
  const spine = inflate(W, H, (c) => {
    for (let y = 190; y < 812; y += 25) {
      c.beginPath();
      c.roundRect(300, y, 40, 19, 7);
      c.fill();
    }
  }, { color: [214, 200, 170], deep: [120, 104, 84], round: 8, grain: 0.5, gloss: 0.18, seed: 4 });

  const ribs = inflate(W, H, (c) => {
    for (let i = 0; i < 7; i++) {
      const y = 214 + i * 30;
      const reach = 182 - Math.abs(i - 3) * 8;
      for (const side of [-1, 1]) {
        const line = curve([[320 + side * 16, y], [320 + side * reach * 0.68, y - 16 + i * 2], [320 + side * reach, y + 34 + i * 2], [320 + side * (reach - 14), y + 92]], 3);
        tube(c, line, () => 11 - i * 0.5);
      }
    }
  }, { color: [226, 214, 188], deep: [130, 116, 96], round: 6, grain: 0.35, gloss: 0.22, seed: 5 });

  const pelvis = inflate(W, H, (c) => {
    shape(c, [[320, 742], [392, 716], [478, 690], [508, 742], [474, 800], [392, 812], [362, 840], [278, 840], [248, 812], [166, 800], [132, 742], [162, 690], [248, 716]]);
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.ellipse(320, 806, 42, 30, 0, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  }, { color: [218, 204, 176], deep: [120, 106, 86], round: 22, grain: 0.6, lumps: 3, gloss: 0.12, seed: 6 });

  const salivary = inflate(W, H, (c) => {
    for (const x of [262, 378]) {
      c.beginPath();
      c.ellipse(x, 118, 17, 25, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.ellipse(282, 142, 15, 8, 0.3, 0, Math.PI * 2);
    c.ellipse(358, 142, 15, 8, -0.3, 0, Math.PI * 2);
    c.fill();
  }, { color: [226, 182, 138], deep: [160, 96, 66], round: 9, lumps: 5, lumpScale: 6, grain: 0.6, gloss: 0.26, seed: 7 });

  const mouth = inflate(W, H, (c) => {
    c.beginPath();
    c.ellipse(320, 112, 36, 15, 0, 0, Math.PI * 2);
    c.fill();
  }, { color: [190, 84, 90], deep: [96, 28, 38], round: 11, grain: 0.3, gloss: 0.6, seed: 8 });

  const oesophagus = inflate(W, H, (c) => tube(c, curve([...OESOPHAGUS.map(([x, y]) => [x, y] as Pt), [362, 330]], 2), (s) => 22 + Math.sin(s / 11) * 1.2), {
    color: [216, 130, 112], deep: [132, 56, 50], round: 11, grain: 0.3, gloss: 0.5, seed: 9,
    relief: (x, y) => Math.sin(y / 3.4 + x / 90) * 0.38,
  });

  const pancreas = inflate(W, H, (c) => tube(c, curve([[292, 502], [344, 494], [402, 484], [456, 462]], 3), (s) => 46 - s * 0.14), {
    color: [233, 196, 132], deep: [168, 112, 66], mottle: [242, 216, 160], mottleAmount: 0.4, round: 20, lumps: 12, lumpScale: 7, grain: 0.9, gloss: 0.3, seed: 10,
  });

  const duodenum = inflate(W, H, (c) => tube(c, curve(DUODENUM, 2), () => 30), {
    color: [226, 150, 120], deep: [146, 72, 58], round: 15, grain: 0.3, gloss: 0.52, seed: 11,
    relief: (x, y) => Math.sin((x + y) / 4) * 0.3,
  });

  // Coils are drawn in short runs, so that each run sits over the last, like a real folded gut.
  const ileumLine = curve(ILEUM, 2);
  const runs = 22;
  const ileum = layer(W, H);
  const ileumCtx = ileum.getContext('2d')!;
  for (let i = 0; i < runs; i++) {
    const from = Math.floor((i / runs) * ileumLine.length);
    const to = Math.min(ileumLine.length, Math.floor(((i + 1.2) / runs) * ileumLine.length));
    const run = ileumLine.slice(from, to);
    ileumCtx.save();
    ileumCtx.shadowColor = 'rgba(40,6,8,.62)';
    ileumCtx.shadowBlur = 8;
    ileumCtx.shadowOffsetY = 3;
    ileumCtx.drawImage(
      inflate(W, H, (c) => tube(c, run, (s) => 31 + Math.sin(s / 17 + i) * 2.5), {
        color: [232, 158, 142], deep: [150, 66, 66], mottle: [240, 182, 158], mottleAmount: 0.45, round: 15, grain: 0.3, gloss: 0.62, seed: 20 + i,
        relief: (x, y) => Math.sin((x * 0.8 + y) / 3) * 0.22,
      }),
      0, 0,
    );
    ileumCtx.restore();
  }

  const colon = inflate(W, H, (c) => tube(c, curve(COLON, 2), (s) => 44 + Math.sin(s / 11) * 10 - Math.max(0, s - 880) * 0.07), {
    color: [198, 142, 104], deep: [116, 66, 44], mottle: [214, 166, 124], mottleAmount: 0.5, round: 20, grain: 0.4, gloss: 0.42, seed: 12,
    // A pale muscle band runs along the colon; pouches bulge between its contractions.
    relief: (x, y) => Math.sin((x + y) / 11) * 2.4,
  });

  const stomach = inflate(W, H, (c) => {
    shape(c, [[346, 322], [392, 306], [440, 330], [470, 390], [464, 444], [420, 486], [362, 496], [320, 492], [312, 466], [348, 448], [376, 424], [362, 372], [342, 344]]);
  }, {
    color: [222, 140, 126], deep: [136, 54, 56], mottle: [236, 170, 150], mottleAmount: 0.5, round: 42, grain: 0.35, gloss: 0.56, seed: 13,
    // Rugae: the long folds of the stomach wall.
    relief: (x, y) => Math.sin(x / 8 + y / 15 + 2.2 * fbm(x / 40, y / 40, 2, 2)) * 1.1,
  });

  const liver = inflate(W, H, (c) => {
    shape(c, [[132, 300], [196, 268], [292, 272], [372, 292], [404, 322], [352, 362], [300, 392], [244, 434], [170, 442], [134, 400], [122, 346]]);
  }, {
    color: [136, 48, 44], deep: [58, 14, 18], mottle: [158, 66, 54], mottleAmount: 0.6, round: 44, grain: 0.4, lumps: 3, lumpScale: 42, gloss: 0.72, seed: 14,
  });

  const gall = inflate(W, H, (c) => {
    shape(c, [[252, 404], [278, 410], [290, 440], [278, 464], [258, 462], [246, 436]]);
    tube(c, curve([[276, 446], [292, 466], [296, 482]], 2), () => 7);
  }, { color: [116, 150, 66], deep: [46, 76, 30], mottle: [146, 170, 80], mottleAmount: 0.4, round: 13, grain: 0.2, gloss: 0.8, seed: 15 });

  const organs: GutLayers['organs'] = { mouth, oesophagus, stomach, liver, gall, pancreas, duodenum, ileum, colon };

  const base = layer(W, H);
  const b = base.getContext('2d')!;
  b.drawImage(bodyLayer(), 0, 0);
  b.globalAlpha = 0.5;
  b.drawImage(spine, 0, 0);
  b.drawImage(ribs, 0, 0);
  b.drawImage(pelvis, 0, 0);
  b.globalAlpha = 1;

  const lay = (image: HTMLCanvasElement, blur = 12) => {
    b.save();
    b.shadowColor = 'rgba(8,10,14,.6)';
    b.shadowBlur = blur;
    b.shadowOffsetX = 3;
    b.shadowOffsetY = 5;
    b.drawImage(image, 0, 0);
    b.restore();
  };

  lay(salivary, 5);
  lay(mouth, 4);
  lay(oesophagus, 8);
  lay(pancreas);
  lay(duodenum);
  lay(ileum, 10);
  lay(colon);
  lay(stomach, 16);
  lay(gall, 7);
  lay(liver, 18);

  const line = [...OESOPHAGUS, ...STOMACH_AXIS.slice(1), ...DUODENUM.slice(1), ...ILEUM.slice(1), ...COLON];
  const start: Pt[] = [[320, 112], ...line];
  const path = curve(start, 3);
  const nearest = (p: Pt) => {
    let best = 0;
    let bestD = Infinity;
    path.forEach(([x, y], i) => {
      const d = Math.hypot(x - p[0], y - p[1]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best / (path.length - 1);
  };

  return { base, organs, path, stops: [0, nearest([322, 250]), nearest([420, 402]), nearest([268, 540]), nearest([392, 690]), nearest([488, 620])] };
}

let cached: Promise<GutLayers> | null = null;

export function gutLayers() {
  if (!cached) cached = new Promise((resolve) => setTimeout(() => resolve(build()), 30));
  return cached;
}

/** Which organs light up at each stop of the journey, in the order of the lab's steps. */
export const STOP_ORGANS: OrganId[][] = [['mouth'], ['oesophagus'], ['stomach'], ['duodenum', 'gall', 'liver', 'pancreas'], ['ileum'], ['colon']];
