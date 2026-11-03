import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage } from '../../../../components/labkit';
import { bn, shuffle } from '../../../../core/util';
import { fbm, inflate, layer, shape, tube, curve } from '../paint/paint';
import { renderLeaf, type Lack } from '../paint/leaf';

interface Patient {
  element: string;
  lack: Lack;
  /** Mobile nutrients move to new growth, so old leaves show the sign first. */
  oldFirst: boolean;
  deadTip?: boolean;
  sign: string;
  note: string;
  remedy: string;
}

export const PATIENTS: Patient[] = [
  { element: 'নাইট্রোজেন', lack: 'N', oldFirst: true, sign: 'নিচের পাতা ফ্যাকাশে হলুদ, গাছ খাটো ও দুর্বল।', note: 'নাইট্রোজেন ক্লোরোফিল ও প্রোটিনের উপাদান। অভাবে ক্লোরোসিস হয়।', remedy: 'ইউরিয়া' },
  { element: 'ফসফরাস', lack: 'P', oldFirst: true, sign: 'পাতা গাঢ় সবুজ, কিনারায় বেগুনি আভা, বৃদ্ধি কম।', note: 'DNA, RNA ও ATP-র উপাদান; মূলের বৃদ্ধিতে জরুরি।', remedy: 'ট্রিপল সুপার ফসফেট' },
  { element: 'পটাশিয়াম', lack: 'K', oldFirst: true, sign: 'পুরোনো পাতার শীর্ষ ও কিনারা হলুদ হয়ে পুড়ে যাওয়ার মতো।', note: 'পত্ররন্ধ্রের কাজ ও পানি শোষণে সাহায্য করে।', remedy: 'মিউরেট অব পটাশ' },
  { element: 'ম্যাগনেসিয়াম', lack: 'Mg', oldFirst: true, sign: 'পুরোনো পাতায় শিরা সবুজ, শিরার মাঝের অংশ হলুদ।', note: 'ক্লোরোফিল অণুর কেন্দ্রীয় উপাদান।', remedy: 'ম্যাগনেসিয়ামযুক্ত সার' },
  { element: 'লৌহ', lack: 'Fe', oldFirst: false, sign: 'কচি পাতা প্রায় সাদাটে হলুদ, পুরোনো পাতা সবুজ।', note: 'ক্লোরোফিল তৈরিতে লাগে, আর গাছে সহজে সরে না, তাই কচি পাতায় আগে লক্ষণ।', remedy: 'আয়রনযুক্ত সার' },
  { element: 'সালফার', lack: 'S', oldFirst: false, sign: 'কচি পাতা হালকা সবুজ-হলুদ, শিরাও ফ্যাকাশে।', note: 'প্রোটিন ও ভিটামিনের উপাদান। তীব্র অভাবে ডাইব্যাক হয়।', remedy: 'সালফারযুক্ত সার' },
  { element: 'ক্যালসিয়াম', lack: 'Ca', oldFirst: false, deadTip: true, sign: 'বর্ধনশীল শীর্ষ ক্ষতিগ্রস্ত, কচি পাতার কিনারা বাদামি ও কোঁকড়ানো।', note: 'কোষপ্রাচীর ও বর্ধনশীল অঞ্চলের জন্য জরুরি।', remedy: 'ক্যালসিয়ামযুক্ত সার' },
  { element: 'বোরন', lack: 'B', oldFirst: false, deadTip: true, sign: 'শীর্ষ মুকুল মরে গেছে, কচি পাতা ভঙ্গুর ও ছোপযুক্ত।', note: 'কোষপ্রাচীরের দৃঢ়তা ও ফুল-ফলে দরকার।', remedy: 'বোরনযুক্ত সার' },
];

const W = 460;
const H = 560;
const SPOTS = [
  { y: 410, side: -1, tilt: 22, size: 170 },
  { y: 372, side: 1, tilt: -20, size: 170 },
  { y: 332, side: -1, tilt: 8, size: 160 },
  { y: 294, side: 1, tilt: -8, size: 156 },
  { y: 254, side: -1, tilt: -6, size: 142 },
  { y: 216, side: 1, tilt: 8, size: 130 },
  { y: 180, side: -1, tilt: -22, size: 112 },
  { y: 150, side: 1, tilt: 24, size: 92 },
];

/** How strongly each leaf shows the sign, from the oldest (0) to the youngest (7). */
export function severityAt(index: number, oldFirst: boolean) {
  const age = oldFirst ? 7 - index : index;
  return age >= 5 ? 1 : age >= 3 ? 0.55 : 0;
}

/** All plant leaves share one size, scaled when drawn, so far fewer have to be painted. */
const LEAF_SIZE = 170;

let scenery: { back: HTMLCanvasElement; pot: HTMLCanvasElement } | null = null;
const stems = new Map<number, HTMLCanvasElement>();

function stemFor(tipY: number) {
  let stem = stems.get(tipY);
  if (!stem) {
    stem = inflate(W, H, (x) => tube(x, curve([[230, 442], [226, 340], [233, 240], [229, tipY]], 2), (s) => Math.max(5, 15 - s * 0.03)), {
      color: [104, 138, 66], deep: [52, 76, 34], round: 7, grain: 0.3, gloss: 0.22, seed: 54,
    });
    stems.set(tipY, stem);
  }
  return stem;
}

function sceneryLayers() {
  if (scenery) return scenery;
  const back = layer(W, H);
  const c = back.getContext('2d')!;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#cfe3c8');
  sky.addColorStop(0.62, '#8fb486');
  sky.addColorStop(0.63, '#7a6248');
  sky.addColorStop(1, '#55432f');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  // Distant foliage, out of focus, gives the eye a sense of a real garden.
  c.filter = 'blur(14px)';
  for (let i = 0; i < 26; i++) {
    c.fillStyle = `hsla(${96 + (i * 37) % 40}, 34%, ${34 + (i * 13) % 24}%, .75)`;
    c.beginPath();
    c.arc((i * 83) % W, 200 + (i * 47) % 150, 34 + (i % 4) * 12, 0, Math.PI * 2);
    c.fill();
  }
  c.filter = 'none';
  const img = c.getImageData(0, 350, W, H - 350);
  for (let i = 0; i < img.data.length; i += 4) {
    const x = (i / 4) % W;
    const y = Math.floor(i / 4 / W);
    const n = (fbm(x / 5, y / 3, 4, 3) - 0.5) * 42;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  c.putImageData(img, 0, 350);

  const pot = inflate(W, H, (x) => shape(x, [[150, 450], [310, 450], [296, 552], [164, 552]]), {
    color: [188, 100, 62], deep: [104, 44, 26], mottle: [204, 124, 84], mottleAmount: 0.5, round: 46, grain: 0.9, gloss: 0.1, seed: 51,
  });
  const p = pot.getContext('2d')!;
  p.drawImage(inflate(W, H, (x) => {
    x.beginPath();
    x.roundRect(138, 434, 184, 34, 8);
    x.fill();
  }, { color: [196, 108, 68], deep: [110, 48, 28], round: 13, grain: 0.8, gloss: 0.12, seed: 52 }), 0, 0);
  p.drawImage(inflate(W, H, (x) => {
    x.beginPath();
    x.ellipse(230, 436, 84, 9, 0, 0, Math.PI * 2);
    x.fill();
  }, { color: [66, 46, 30], deep: [30, 20, 14], round: 8, grain: 2.4, gloss: 0, seed: 53 }), 0, 0);

  scenery = { back, pot };
  return scenery;
}

function paintPlant(ctx: CanvasRenderingContext2D, p: Patient, cured: boolean) {
  const { back, pot } = sceneryLayers();
  ctx.drawImage(back, 0, 0);
  ctx.save();
  ctx.shadowColor = 'rgba(20,20,10,.5)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(pot, 0, 0);
  ctx.restore();

  const tipY = p.deadTip && !cured ? 150 : 128;
  ctx.drawImage(stemFor(tipY), 0, 0);

  SPOTS.forEach((s, i) => {
    // After treatment the damaged leaves stay damaged; only new growth comes up healthy.
    const severity = cured && i >= 5 ? 0 : severityAt(i, p.oldFirst);
    const leaf = renderLeaf({ lack: severity ? p.lack : 'none', severity, seed: 3 + (i % 2) }, LEAF_SIZE);
    const scale = s.size / LEAF_SIZE;
    ctx.save();
    ctx.translate(230, s.y);
    ctx.rotate((s.tilt * Math.PI) / 180);
    ctx.scale(s.side * scale, scale);
    ctx.shadowColor = 'rgba(16,26,14,.5)';
    ctx.shadowBlur = 9;
    ctx.shadowOffsetY = 5 * 1;
    ctx.drawImage(leaf, 0, -leaf.height / 2);
    ctx.restore();
  });

  if (p.deadTip && !cured) {
    ctx.drawImage(inflate(W, H, (x) => {
      x.beginPath();
      x.ellipse(229, 146, 7, 12, 0.1, 0, Math.PI * 2);
      x.fill();
    }, { color: [76, 50, 28], deep: [36, 22, 12], round: 5, grain: 0.6, gloss: 0.05, seed: 55 }), 0, 0);
  }
}

function LeafPicture({ lack, severity, seed }: { lack: Lack; severity: number; seed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const leaf = renderLeaf({ lack, severity, seed }, 420);
    c.width = leaf.width;
    c.height = leaf.height;
    c.getContext('2d')!.drawImage(leaf, 0, 0);
  }, [lack, severity, seed]);
  return <canvas ref={ref} className="real-canvas" role="img" aria-label="পাতার কাছের ছবি" />;
}

export function MineralLab() {
  const [deck, setDeck] = useState(() => shuffle(PATIENTS));
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [cured, setCured] = useState(false);
  const [score, setScore] = useState(0);
  const [looked, setLooked] = useState<'old' | 'young'>('old');
  const [painting, setPainting] = useState(true);
  const plant = useRef<HTMLCanvasElement>(null);
  const p = deck[i];
  const options = useMemo(() => PATIENTS.map((x) => x.element), []);

  useEffect(() => {
    const ctx = plant.current?.getContext('2d');
    if (!ctx || !p) return;
    setPainting(true);
    // Let the page show its message first: painting a plant can take seconds on a cheap phone.
    const id = window.setTimeout(() => {
      paintPlant(ctx, p, cured);
      setPainting(false);
    }, 30);
    return () => window.clearTimeout(id);
  }, [p, cured]);

  if (!p) {
    return (
      <Stage>
        <div className="panel" role="status">
          <h3>চিকিৎসা শেষ: {bn(PATIENTS.length)}টির মধ্যে প্রথম চেষ্টায় {bn(score)}টি ঠিক</h3>
          <button type="button" className="btn btn-lab" onClick={() => { setDeck(shuffle(PATIENTS)); setI(0); setScore(0); }}>আবার খেলো</button>
        </div>
      </Stage>
    );
  }

  const pick = (element: string) => {
    if (cured) return;
    if (element === p.element) {
      if (!wrong) setScore(score + 1);
      setCured(true);
    } else {
      setWrong(element);
    }
  };

  const oldSeverity = severityAt(0, p.oldFirst);
  const youngSeverity = cured ? 0 : severityAt(7, p.oldFirst);

  return (
    <Stage>
      <div className="lab-grid">
        <div className="lab-view gut-view" style={{ aspectRatio: `${W} / ${H}` }}>
          <canvas ref={plant} width={W} height={H} className="real-canvas" data-element={p.element} role="img" aria-label={`গাছ, লক্ষণ: ${p.sign}`} />
          {painting && <span className="render-wait">গাছ তৈরি হচ্ছে…</span>}
        </div>
        <aside className="lab-side">
          <div className="panel" aria-live="polite">
            <h4>গাছের ডাক্তার: রোগী {bn(i + 1)}/{bn(PATIENTS.length)}</h4>
            <p>{p.sign}</p>
          </div>
          <div className="panel">
            <h4>হাতে পাতা নিয়ে পরীক্ষা করো: লক্ষণ কোন বয়সের পাতায়?</h4>
            <LeafPicture lack={(looked === 'old' ? oldSeverity : youngSeverity) ? p.lack : 'none'} severity={looked === 'old' ? oldSeverity : youngSeverity} seed={4} />
            <div className="toggle-row" style={{ marginTop: 6 }}>
              <button type="button" className="chip-btn" aria-pressed={looked === 'old'} onClick={() => setLooked('old')}>নিচের পুরোনো পাতা</button>
              <button type="button" className="chip-btn" aria-pressed={looked === 'young'} onClick={() => setLooked('young')}>ওপরের কচি পাতা</button>
            </div>
          </div>
          <div className="chips">
            {options.map((x) => (
              <button key={x} type="button" className="chip-btn" disabled={cured} onClick={() => pick(x)}>{x}</button>
            ))}
          </div>
          {wrong && !cured && <p className="fb fb-no">{wrong} নয়। পাতার কোন অংশে ও কোন বয়সের পাতায় লক্ষণ, আবার দেখো।</p>}
          {cured && (
            <div className="panel" role="status">
              <h3>ঠিক: {p.element}</h3>
              <p>{p.note}</p>
              <p>{p.oldFirst ? 'এই উপাদান গাছের ভেতরে সরতে পারে: পুরোনো পাতা থেকে কচি পাতায় চলে যায়, তাই লক্ষণ আগে নিচে দেখা দেয়।' : 'এই উপাদান গাছের ভেতরে সহজে সরে না, তাই নতুন বৃদ্ধিই আগে ভোগে।'}</p>
              <p className="panel-note">সার দেওয়ার পর লক্ষ করো: ওপরের নতুন পাতা সুস্থ হয়েছে, কিন্তু ক্ষতিগ্রস্ত পুরোনো পাতা আগের মতোই আছে।</p>
              <span className="tag">প্রতিকার: {p.remedy}</span>
              <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} onClick={() => { setI(i + 1); setWrong(null); setCured(false); setLooked('old'); }}>পরের রোগী →</button>
            </div>
          )}
        </aside>
      </div>
    </Stage>
  );
}
