import { useEffect, useRef } from 'react';
import { fbm, inflate, layer, noise } from '../paint/paint';

const S = 520;

type Kind = 'rice' | 'roti' | 'grain' | 'chunk' | 'leaf' | 'fish' | 'meat' | 'egg' | 'milk' | 'oil';

const LOOK: Record<string, { kind: Kind; color: string; dark: string }> = {
  চাল: { kind: 'rice', color: '#fbf6e6', dark: '#cfc4a0' },
  আটা: { kind: 'roti', color: '#e6bd80', dark: '#8a5a2c' },
  ছোলা: { kind: 'grain', color: '#d9a85c', dark: '#8a5c26' },
  মসুর: { kind: 'grain', color: '#e88a4a', dark: '#a0481c' },
  'গোল আলু': { kind: 'chunk', color: '#e6c97a', dark: '#a8843c' },
  গাজর: { kind: 'chunk', color: '#f08a2c', dark: '#b0560e' },
  বেগুন: { kind: 'chunk', color: '#6a3a7a', dark: '#2e1436' },
  বাঁধাকপি: { kind: 'leaf', color: '#a8cf7a', dark: '#5c8a3c' },
  ইলিশ: { kind: 'fish', color: '#e6b89a', dark: '#b8c4ca' },
  কাতলা: { kind: 'fish', color: '#eed2b4', dark: '#a8a290' },
  'মুরগির মাংস': { kind: 'meat', color: '#c98a4e', dark: '#7a4a1e' },
  'গরুর মাংস': { kind: 'meat', color: '#7a3c26', dark: '#3a1a10' },
  ডিম: { kind: 'egg', color: '#fff8e8', dark: '#d8c8a8' },
  'গরুর দুধ': { kind: 'milk', color: '#fbf8f0', dark: '#d6cfbe' },
  'রান্নার তেল': { kind: 'oil', color: '#e9c23e', dark: '#a8801c' },
};

let table: HTMLCanvasElement | null = null;

function tableLayer() {
  if (table) return table;
  const t = layer(S, S);
  const c = t.getContext('2d')!;
  const img = c.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const grain = fbm(x / 170, y / 12, 61, 4);
      const ring = Math.sin((y + grain * 90) / 7) * 0.5 + 0.5;
      const v = 0.68 + grain * 0.3 + ring * 0.06;
      const j = (y * S + x) * 4;
      img.data[j] = 118 * v;
      img.data[j + 1] = 78 * v;
      img.data[j + 2] = 48 * v;
      img.data[j + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  const plate = inflate(S, S, (x) => {
    x.beginPath();
    x.arc(S / 2, S / 2, 232, 0, Math.PI * 2);
    x.fill();
  }, { color: [240, 240, 234], deep: [176, 178, 172], round: 38, grain: 0.05, gloss: 0.5, seed: 62 });
  c.save();
  c.shadowColor = 'rgba(20,10,4,.6)';
  c.shadowBlur = 24;
  c.shadowOffsetX = 8;
  c.shadowOffsetY = 12;
  c.drawImage(plate, 0, 0);
  c.restore();
  const well = c.createRadialGradient(S / 2 - 30, S / 2 - 40, 30, S / 2, S / 2, 180);
  well.addColorStop(0, '#fbfbf7');
  well.addColorStop(0.85, '#eeeee8');
  well.addColorStop(1, '#d4d5cd');
  c.fillStyle = well;
  c.beginPath();
  c.arc(S / 2, S / 2, 178, 0, Math.PI * 2);
  c.fill();
  table = t;
  return t;
}

function dab(c: CanvasRenderingContext2D, x: number, y: number, r: number, light: string, dark: string, squash = 1, turn = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.scale(1, squash);
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.08, 0, 0, r);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.2, light);
  g.addColorStop(1, dark);
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function serve(c: CanvasRenderingContext2D, name: string, cx: number, cy: number, r: number, grams: number) {
  const { kind, color, dark } = LOOK[name];
  const amount = Math.min(1.6, grams / 200);
  const place = (i: number, spread: number): [number, number] => {
    const a = i * 2.39996;
    const d = Math.sqrt(i + 0.5) * spread;
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.86];
  };

  c.save();
  c.shadowColor = 'rgba(40,24,10,.4)';
  c.shadowBlur = 6;
  c.shadowOffsetY = 3;

  if (kind === 'rice') {
    const n = Math.round(620 * amount);
    const reach = r * (0.72 + amount * 0.2);
    // Scattered at random, heaped towards the middle, so no tidy pattern shows.
    // Outer grains go down first, so the middle of the heap sits on top.
    for (let i = n - 1; i >= 0; i--) {
      const a = i * 2.39996 + noise(i * 3.1, 2, 71) * 2.4;
      const d = Math.sqrt((i + 0.5) / n) * reach * (0.86 + noise(i * 1.7, 9, 72) * 0.28);
      dab(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, 6, color, dark, 0.38, noise(i * 5.3, 4, 73) * 9);
    }
  } else if (kind === 'roti') {
    const n = Math.max(1, Math.round(amount * 2));
    for (let i = 0; i < n; i++) {
      dab(c, cx + i * 8, cy - i * 7, r * 0.82, color, dark, 0.94);
      for (let k = 0; k < 14; k++) dab(c, cx + i * 8 + Math.cos(k * 2.4) * r * 0.05 * k, cy - i * 7 + Math.sin(k * 2.4) * r * 0.05 * k, 3 + (k % 3), '#a8682c', '#5a3214');
    }
  } else if (kind === 'grain') {
    const n = Math.round(110 * amount);
    for (let i = 0; i < n; i++) {
      const [x, y] = place(i, r / Math.sqrt(n) * 0.96);
      dab(c, x, y, 6.5, color, dark, 0.84, i);
    }
  } else if (kind === 'chunk' || kind === 'meat') {
    const n = Math.max(2, Math.round(9 * amount));
    for (let i = 0; i < n; i++) {
      const [x, y] = place(i, r / Math.sqrt(n) * 0.82);
      dab(c, x, y, 17, color, dark, 0.76, i * 1.9);
    }
  } else if (kind === 'leaf') {
    const n = Math.max(6, Math.round(46 * amount));
    for (let i = 0; i < n; i++) {
      const [x, y] = place(i, r / Math.sqrt(n) * 0.9);
      dab(c, x, y, 20, color, dark, 0.26, i * 2.3);
    }
  } else if (kind === 'fish') {
    const n = Math.max(1, Math.round(amount * 3));
    for (let i = 0; i < n; i++) {
      const y = cy + (i - (n - 1) / 2) * 34;
      // A cross-cut steak: thin silver skin, pale flesh, the backbone at its centre.
      dab(c, cx, y, r * 0.7, dark, '#6f7f88', 0.62);
      dab(c, cx, y, r * 0.65, color, '#b98a68', 0.58);
      c.strokeStyle = 'rgba(150,100,70,.5)';
      c.lineWidth = 1.5;
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        c.beginPath();
        c.moveTo(cx, y);
        c.lineTo(cx + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.34);
        c.stroke();
      }
      dab(c, cx, y, 6, '#f6efe0', '#a89a7a');
    }
  } else if (kind === 'egg') {
    const n = Math.max(1, Math.round(grams / 50));
    for (let i = 0; i < Math.min(n, 4); i++) {
      const [x, y] = place(i, 22);
      dab(c, x, y, 26, color, dark, 0.8, i);
      dab(c, x, y, 12, '#ffc83c', '#d8881c');
    }
  } else {
    // Liquids sit in a small steel bowl beside the food.
    dab(c, cx, cy, r * 0.76, '#dfe4e6', '#7a8488');
    dab(c, cx, cy, r * 0.62, color, dark);
  }
  c.restore();
}

/** Food on a plate, in the amounts the student chose. */
export function Plate({ grams }: { grams: Record<string, number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    c.drawImage(tableLayer(), 0, 0);
    const list = Object.entries(grams).filter(([, g]) => g > 0);
    const n = list.length;
    list.forEach(([name, g], i) => {
      const a = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      const d = n === 1 ? 0 : n <= 3 ? 76 : 100;
      const r = n === 1 ? 118 : n <= 3 ? 80 : Math.max(46, 92 - n * 4);
      serve(c, name, S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, r, g);
    });
  }, [grams]);

  return <canvas ref={ref} width={S} height={S} className="real-canvas" role="img" aria-label="থালায় সাজানো খাবার" />;
}
