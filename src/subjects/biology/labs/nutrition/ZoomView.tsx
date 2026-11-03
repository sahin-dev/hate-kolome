import { useEffect, useRef } from 'react';
import { fbm, inflate, layer, mix, shape, tube, curve, type Pt } from '../paint/paint';
import type { DigestState } from '../models/body';
import { ZOOM_TITLES, stageView, type StageView } from './zoom';

const W = 560;
const H = 340;

type Backdrop = HTMLCanvasElement;
const cache: (Backdrop | undefined)[] = [];

function fluid(c: CanvasRenderingContext2D, inner: string, outer: string) {
  const g = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 380);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

const painters: ((c: CanvasRenderingContext2D) => void)[] = [
  // Mouth: a row of teeth above, the tongue below.
  (c) => {
    fluid(c, '#b24a56', '#57141f');
    c.drawImage(inflate(W, H, (x) => shape(x, [[-20, 300], [120, 268], [300, 276], [460, 262], [600, 296], [600, 380], [-20, 380]]), {
      color: [214, 96, 104], deep: [120, 36, 48], mottle: [232, 130, 130], mottleAmount: 0.5, round: 50, grain: 1.2, gloss: 0.7, seed: 31,
    }), 0, 0);
    c.drawImage(inflate(W, H, (x) => {
      for (let i = 0; i < 7; i++) {
        x.beginPath();
        x.roundRect(14 + i * 79, -30, 70, 96 + (i % 2) * 8, 22);
        x.fill();
      }
    }, { color: [244, 238, 216], deep: [176, 156, 118], round: 20, grain: 0.3, gloss: 0.8, seed: 32 }), 0, 0);
  },
  // Oesophagus: ringed muscle walls.
  (c) => {
    fluid(c, '#a84a48', '#4a1418');
    for (const top of [true, false]) {
      c.drawImage(inflate(W, H, (x) => {
        for (let i = -1; i < 12; i++) {
          const bx = i * 52;
          x.beginPath();
          x.ellipse(bx + 26, top ? 12 : H - 12, 32, 46, 0, 0, Math.PI * 2);
          x.fill();
        }
      }, { color: [214, 126, 110], deep: [126, 50, 46], round: 26, grain: 0.5, gloss: 0.62, seed: 33 }), 0, 0);
    }
  },
  // Stomach: deep folds lined with gastric pits, bathed in acid.
  (c) => {
    fluid(c, '#b86a54', '#54201c');
    c.drawImage(inflate(W, H, (x) => {
      for (let i = 0; i < 6; i++) {
        const line = curve([[-20, 26 + i * 18], [160, 6 + i * 16 + (i % 2) * 14], [340, 34 + i * 12], [580, 12 + i * 18]], 3);
        x.lineWidth = 24;
        x.beginPath();
        line.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b)));
        x.stroke();
      }
    }, {
      color: [226, 150, 132], deep: [132, 56, 52], mottle: [240, 180, 156], mottleAmount: 0.5, round: 13, grain: 1.1, gloss: 0.72, seed: 34,
      relief: (u, v) => (fbm(u / 7, v / 7, 3, 2) > 0.62 ? -2.6 : 0),
    }), 0, 0);
  },
  // Duodenum: fine folds; bile enters from one side.
  (c) => {
    fluid(c, '#b8934e', '#54381a');
    c.drawImage(inflate(W, H, (x) => {
      for (let i = 0; i < 16; i++) {
        x.beginPath();
        x.ellipse(i * 40, 312 + (i % 2) * 8, 30, 66, 0, 0, Math.PI * 2);
        x.fill();
      }
    }, { color: [228, 170, 134], deep: [140, 76, 58], round: 22, grain: 0.8, gloss: 0.7, seed: 35 }), 0, 0);
    c.drawImage(inflate(W, H, (x) => tube(x, curve([[590, 46], [510, 56], [470, 92]], 2), () => 26), {
      color: [116, 150, 66], deep: [46, 76, 30], round: 13, gloss: 0.8, seed: 36,
    }), 0, 0);
  },
  // Ileum: a forest of villi, each with its capillary network.
  (c) => {
    fluid(c, '#b78a58', '#4e2e18');
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 9; i++) {
        const x0 = 12 + i * 62 + row * 30;
        const top = row ? 126 : 92;
        const finger = inflate(W, H, (x) => tube(x, curve([[x0, H + 20], [x0 + 3, 240], [x0 - 2, top + 22]], 2), (s) => 50 - s * 0.05), {
          color: row ? [240, 176, 156] : [222, 144, 130], deep: [146, 66, 62], mottle: [246, 200, 176], mottleAmount: 0.45, round: 24, grain: 1, gloss: 0.72, seed: 40 + i + row * 10,
        });
        c.save();
        c.shadowColor = 'rgba(30,8,4,.55)';
        c.shadowBlur = 9;
        c.drawImage(finger, 0, 0);
        c.restore();
        c.strokeStyle = row ? 'rgba(170,30,36,.62)' : 'rgba(150,26,32,.32)';
        c.lineWidth = 2;
        for (const side of [-1, 1]) {
          c.beginPath();
          c.moveTo(x0 + side * 12, H);
          c.bezierCurveTo(x0 + side * 18, 240, x0 + side * 14, top + 44, x0, top + 26);
          c.stroke();
        }
      }
    }
  },
  // Colon: pouched wall with a mucus sheen.
  (c) => {
    fluid(c, '#9a6a44', '#3e2212');
    c.drawImage(inflate(W, H, (x) => {
      for (let i = -1; i < 6; i++) {
        x.beginPath();
        x.ellipse(i * 122 + 60, H + 10, 78, 110, 0, 0, Math.PI * 2);
        x.ellipse(i * 122 + 30, -10, 78, 74, 0, 0, Math.PI * 2);
        x.fill();
      }
    }, { color: [206, 146, 112], deep: [116, 64, 44], mottle: [224, 178, 140], mottleAmount: 0.5, round: 38, grain: 0.9, gloss: 0.6, seed: 37 }), 0, 0);
  },
];

function backdrop(stop: number) {
  if (!cache[stop]) {
    const out = layer(W, H);
    painters[stop](out.getContext('2d')!);
    cache[stop] = out;
  }
  return cache[stop]!;
}

interface Bead {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: 'starch' | 'protein';
}

interface Chain {
  kind: 'starch' | 'protein';
  x: number;
  y: number;
  phase: number;
  length: number;
  cutAt: number;
  cut: boolean;
}

interface Drop {
  x: number;
  y: number;
  r: number;
  phase: number;
}

const LOOP = 9000;

function buildScene(v: StageView) {
  const chains: Chain[] = [];
  const add = (kind: 'starch' | 'protein', amount: number, kept: number) => {
    const n = Math.round(amount * 6);
    const cutCount = Math.round(amount > 0 ? n * (1 - kept / amount) : 0);
    for (let i = 0; i < n; i++) {
      chains.push({
        kind,
        x: 70 + ((i * 97 + (kind === 'protein' ? 40 : 0)) % 420),
        y: 110 + ((i * 53 + (kind === 'protein' ? 70 : 0)) % 110),
        phase: i * 1.7,
        length: 7 + (i % 3),
        cutAt: i < cutCount ? 0.15 + (i / Math.max(1, cutCount)) * 0.6 : 2,
        cut: false,
      });
    }
  };
  add('starch', v.before.starch, v.after.starch);
  add('protein', v.before.protein, v.after.protein);

  const drops: Drop[] = [];
  const fat = v.before.fat;
  if (fat > 0.02) {
    if (v.emulsified) {
      const n = Math.round(14 * fat) + 3;
      for (let i = 0; i < n; i++) drops.push({ x: 60 + ((i * 71) % 440), y: 96 + ((i * 43) % 130), r: 8 + (i % 3) * 2, phase: i });
    } else {
      drops.push({ x: 180, y: 160, r: 40 * Math.sqrt(fat), phase: 0 }, { x: 390, y: 150, r: 30 * Math.sqrt(fat), phase: 2 });
    }
  }
  return { chains, drops };
}

const COLORS = { starch: ['#ffe9a0', '#b48a2c'], protein: ['#ff9d7a', '#a84a2c'] } as const;

function ball(c: CanvasRenderingContext2D, x: number, y: number, r: number, light: string, dark: string) {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.25, light);
  g.addColorStop(1, dark);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

/** A close view of the food itself. What the molecules do comes from the digestion model. */
export function ZoomView({ state, stop }: { state: DigestState; stop: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current?.getContext('2d');
    if (!c) return;
    const view = stageView(state, stop);
    const { chains, drops } = buildScene(view);
    const back = backdrop(stop);
    const freed: Bead[] = [];
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = ((now - start) % LOOP) / LOOP;
      if (t < 0.02) {
        freed.length = 0;
        chains.forEach((ch) => {
          ch.cut = false;
        });
      }
      c.drawImage(back, 0, 0);

      if (stop === 1) {
        // A wave of muscle squeezing the food along.
        const bx = ((now - start) / 22) % (W + 200) - 100;
        c.fillStyle = 'rgba(255,220,150,.32)';
        c.beginPath();
        c.ellipse(bx, H / 2, 64, 46, 0, 0, Math.PI * 2);
        c.fill();
        ball(c, bx, H / 2, 40, '#ecc98a', '#8a5a2c');
      }

      if (stop === 2) {
        c.fillStyle = 'rgba(255,240,180,.7)';
        c.font = '700 13px sans-serif';
        for (let i = 0; i < 12; i++) {
          const x = (i * 83 + now / 30) % W;
          c.fillText('H⁺', x, 130 + ((i * 47) % 150) + Math.sin(now / 500 + i) * 8);
        }
      }

      if (stop === 3 && state.bile) {
        const k = (now / 18) % 200;
        for (let i = 0; i < 6; i++) ball(c, 470 - ((k + i * 33) % 200) * 0.9, 100 + ((k + i * 33) % 200) * 0.28 + Math.sin(i * 3) * 18, 4, '#b6d27c', '#55802c');
      }

      for (const ch of chains) {
        if (!ch.cut && t > ch.cutAt) {
          ch.cut = true;
          for (let i = 0; i < ch.length; i++) {
            const a = (i / ch.length) * Math.PI * 2;
            freed.push({ x: ch.x + i * 11, y: ch.y, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.4, kind: ch.kind });
          }
          ball(c, ch.x + ch.length * 5, ch.y, 18, '#ffffff', 'rgba(255,255,255,.1)');
        }
        if (ch.cut) continue;
        for (let i = 0; i < ch.length; i++) {
          const x = ch.x + i * 11;
          const y = ch.y + Math.sin(i * 0.9 + now / 700 + ch.phase) * 7;
          ball(c, x, y, 6.5, COLORS[ch.kind][0], COLORS[ch.kind][1]);
        }
      }

      for (const b of freed) {
        if (!still) {
          b.x += b.vx;
          b.y += b.vy + (view.absorbing ? 0.55 : 0);
          if (!view.absorbing) {
            b.vx *= 0.995;
            b.vy *= 0.995;
          }
        }
        if (view.absorbing && b.y > 250) continue;
        ball(c, b.x, b.y, 4.5, COLORS[b.kind][0], COLORS[b.kind][1]);
      }

      const fading = view.after.fat < view.before.fat ? 1 - (t * (1 - view.after.fat / Math.max(0.01, view.before.fat))) : 1;
      for (const d of drops) {
        const r = d.r * Math.max(0.05, fading);
        const x = d.x + Math.sin(now / 900 + d.phase) * 5;
        const y = d.y + Math.cos(now / 1100 + d.phase) * 4;
        c.globalAlpha = 0.88;
        ball(c, x, y, r, '#fff1b0', '#d9a22c');
        c.globalAlpha = 1;
      }

      if (stop === 5) {
        for (let i = 0; i < 14; i++) {
          const x = (i * 71 + now / 60) % W;
          const y = 120 + ((i * 37) % 110);
          c.save();
          c.translate(x, y);
          c.rotate(i + now / 1600);
          c.fillStyle = 'rgba(120,180,110,.85)';
          c.beginPath();
          c.roundRect(-9, -3.5, 18, 7, 3.5);
          c.fill();
          c.restore();
        }
        c.fillStyle = 'rgba(150,214,244,.85)';
        for (let i = 0; i < 16; i++) {
          const k = (now / 1200 + i * 0.19) % 1;
          c.beginPath();
          c.arc(30 + i * 34, mix(170, i % 2 ? 40 : 300, k), 3, 0, Math.PI * 2);
          c.fill();
        }
      }

      view.enzymes.forEach((e, i) => {
        const x = 90 + i * 170 + Math.sin(now / 800 + i) * 24;
        const y = 92 + Math.cos(now / 620 + i * 2) * 14;
        // An enzyme is a folded protein: a knobbly mass with a groove where the food fits.
        const flex = e.on ? Math.sin(now / 300 + i) * 0.12 : 0;
        const [light, dark] = e.on ? ['#9fe8d0', '#1f7a66'] : ['#8a9692', '#3c4644'];
        for (let k = 0; k < 11; k++) {
          const a = 0.62 + flex + (k / 10) * (Math.PI * 2 - 1.24 - flex * 2);
          const r = 11 + ((k * 5) % 3) * 2.4;
          ball(c, x + Math.cos(a) * r, y + Math.sin(a) * r, 6.4 + (k % 3), light, dark);
        }
        ball(c, x - 4, y, 8, light, dark);
        c.fillStyle = '#fff';
        c.strokeStyle = 'rgba(10,20,20,.8)';
        c.lineWidth = 3;
        c.font = '600 14px "Hind Siliguri", sans-serif';
        c.textAlign = 'center';
        const tag = e.on ? e.name : `${e.name} নেই`;
        c.strokeText(tag, x, y - 22);
        c.fillText(tag, x, y - 22);
        c.textAlign = 'left';
      });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [state, stop]);

  return (
    <figure className="zoom-view">
      <figcaption>🔬 {ZOOM_TITLES[stop]}</figcaption>
      <canvas ref={canvas} width={W} height={H} role="img" aria-label={ZOOM_TITLES[stop]} />
      <div className="zoom-key" aria-hidden="true">
        <span><i style={{ background: '#ffe9a0' }} />শ্বেতসার</span>
        <span><i style={{ background: '#ff9d7a' }} />আমিষ</span>
        <span><i style={{ background: '#f2c14e' }} />স্নেহ</span>
        <span><i style={{ background: '#7fe0c0' }} />উৎসেচক</span>
      </div>
    </figure>
  );
}

export type { Pt };
