import { useEffect, useRef, useState } from 'react';
import { LabGrid, Range, Seg, Stage, Stat } from '../../../components/labkit';
import { bn, clamp } from '../../../core/util';

type SlideId = 'onion' | 'cheek' | 'blood';
type View = 'prep' | 'scope' | 'limit';

interface Prep {
  thick: boolean;
  unstained: boolean;
  bubbles: boolean;
}

interface Pin {
  x: number;
  y: number;
  name: string;
  hint: string;
}

interface PrepStep {
  title: string;
  good: string;
  bad: string;
  effect: keyof Prep;
  lesson: string;
}

const SIZE = 1800;
const SHARP_AT = 62;
const EYEPIECE = 10;

const OBJECTIVES = [
  { x: 4, scale: 0.133, tolerance: 6, blur: 0.5 },
  { x: 10, scale: 0.33, tolerance: 3, blur: 0.9 },
  { x: 40, scale: 1.33, tolerance: 1, blur: 1.6 },
];

const SLIDES: Record<SlideId, { name: string; note: string; steps: PrepStep[] }> = {
  onion: {
    name: 'পেঁয়াজের কোষ',
    note: 'উদ্ভিদকোষ। স্যাফ্রানিনে রং করা।',
    steps: [
      { title: 'ত্বক নেওয়া', good: 'রসালো শল্কপত্রের ভেতর থেকে পাতলা স্বচ্ছ ত্বক তোলো', bad: 'ছুরি দিয়ে মোটা টুকরো কাটো', effect: 'thick', lesson: 'মোটা টুকরোয় আলো পেরোতে পারে না, কয়েক স্তর কোষ একসাথে দেখায়।' },
      { title: 'রং করা', good: 'স্যাফ্রানিন দ্রবণে প্রায় ৩০ সেকেন্ড রাখো', bad: 'রং না করে সরাসরি স্লাইডে রাখো', effect: 'unstained', lesson: 'রং ছাড়া কোষ প্রায় স্বচ্ছ; ডায়াফ্রাম কমিয়ে কিছুটা বোঝা যায়।' },
      { title: 'কভার স্লিপ বসানো', good: 'গ্লিসারিনে রেখে কভার স্লিপ এক পাশ থেকে ধীরে নামাও', bad: 'কভার স্লিপ ওপর থেকে ছেড়ে দাও', effect: 'bubbles', lesson: 'হঠাৎ নামালে বাতাস আটকে গোল বুদবুদ হয়, যা অনেকে কোষ ভেবে ভুল করে।' },
    ],
  },
  cheek: {
    name: 'গালের আবরণ কোষ',
    note: 'প্রাণিকোষ। মিথাইলিন ব্লুতে রং করা।',
    steps: [
      { title: 'নমুনা ছড়ানো', good: 'পরিষ্কার হাতে নমুনা নিয়ে স্লাইডের পানিতে সমানভাবে ছড়াও', bad: 'নমুনা এক জায়গায় জমিয়ে রাখো', effect: 'thick', lesson: 'কোষ জমে থাকলে একটির ওপর আরেকটি উঠে যায়, আলাদা করে চেনা যায় না।' },
      { title: 'রং করা', good: 'গ্লাভস পরে মিথাইলিন ব্লুর কয়েক ফোঁটা দাও', bad: 'রং না করে রাখো', effect: 'unstained', lesson: 'রং ছাড়াও দেখা যায়, তবে অনেক কষ্টসাধ্য।' },
      { title: 'কভার স্লিপ বসানো', good: 'গ্লিসারিন দিয়ে কভার স্লিপ ধীরে নামাও', bad: 'কভার স্লিপ ছেড়ে দাও', effect: 'bubbles', lesson: 'বুদবুদ কালো কিনারার গোল ফাঁকা বৃত্তের মতো দেখায়।' },
    ],
  },
  blood: { name: 'রক্তের স্মিয়ার', note: 'তৈরি স্লাইড। প্রস্তুতি লাগে না।', steps: [] },
};

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

function bubbles(ctx: CanvasRenderingContext2D, random: () => number) {
  for (let i = 0; i < 12; i++) {
    const x = 300 + random() * 1200;
    const y = 300 + random() * 1200;
    const r = 40 + random() * 120;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fill();
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#26221c';
    ctx.stroke();
  }
}

function drawOnion(ctx: CanvasRenderingContext2D, prep: Prep, random: () => number): Pin[] {
  const W = 236;
  const H = 92;
  const stain = prep.unstained ? 0.2 : 1;
  const pins: Pin[] = [];
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(900, 900, 800, 700, 0.15, 0, Math.PI * 2);
  ctx.clip();
  for (let row = 0; row < 22; row++) {
    const y = row * H;
    const shift = row % 2 ? W / 2 : 0;
    for (let col = -1; col < 10; col++) {
      const x = col * W + shift;
      const j = (random() - 0.5) * 12;
      ctx.fillStyle = `rgba(226,150,176,${0.5 * stain})`;
      ctx.fillRect(x, y + j, W, H);
      ctx.fillStyle = `rgba(252,232,238,${0.85 * stain})`;
      ctx.fillRect(x + 12, y + 14 + j, W - 24, H - 28);
      ctx.strokeStyle = `rgba(150,28,84,${0.9 * stain})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(x, y + j, W, H);
      const left = random() > 0.5;
      const nx = x + (left ? 42 : W - 42);
      const ny = y + H / 2 + j + (random() - 0.5) * 16;
      ctx.beginPath();
      ctx.arc(nx, ny, 19, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(122,20,74,${0.92 * stain})`;
      ctx.fill();
      if (row === 9 && col === 3) {
        pins.push(
          { x, y: y + H / 2 + 22, name: 'কোষপ্রাচীর', hint: 'দুই কোষের মাঝের গাঢ় রেখা; প্রাণিকোষে এটি থাকে না।' },
          { x: nx, y: ny, name: 'নিউক্লিয়াস', hint: 'গাঢ় গোল বস্তু; বড় কোষগহ্বরের চাপে এক পাশে সরে থাকে।' },
          { x: x + W / 2, y: y + H / 2, name: 'কোষগহ্বর', hint: 'কোষের মাঝের বড় হালকা অংশ।' },
        );
      }
    }
  }
  ctx.restore();
  return pins;
}

function drawCheek(ctx: CanvasRenderingContext2D, prep: Prep, random: () => number): Pin[] {
  const stain = prep.unstained ? 0.22 : 1;
  const cells: { x: number; y: number }[] = [{ x: 900, y: 900 }];
  const count = prep.thick ? 220 : 70;
  const spread = prep.thick ? 300 : 760;
  for (let i = 0; i < count; i++) {
    const a = random() * Math.PI * 2;
    const r = (0.25 + 0.75 * random()) * spread;
    const x = 900 + Math.cos(a) * r;
    const y = 900 + Math.sin(a) * r;
    if (prep.thick || cells.every((c) => Math.hypot(c.x - x, c.y - y) > 165)) cells.push({ x, y });
  }
  const pins: Pin[] = [];
  cells.forEach((c, i) => {
    const sides = 6 + Math.floor(random() * 3);
    ctx.beginPath();
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      const r = 118 + random() * 44;
      ctx[k ? 'lineTo' : 'moveTo'](c.x + Math.cos(a) * r, c.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(166,202,236,${0.72 * stain})`;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = `rgba(52,96,160,${0.85 * stain})`;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x, c.y, 26, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(32,68,132,${0.95 * stain})`;
    ctx.fill();
    if (i === 0) {
      pins.push(
        { x: c.x, y: c.y, name: 'নিউক্লিয়াস', hint: 'প্রায় মাঝখানের গাঢ় গোল বস্তু।' },
        { x: c.x + 68, y: c.y - 26, name: 'সাইটোপ্লাজম', hint: 'নিউক্লিয়াসের চারপাশের হালকা অংশ।' },
        { x: c.x - 126, y: c.y, name: 'কোষঝিল্লি', hint: 'পাতলা বাইরের সীমা। এখানে পুরু প্রাচীর নেই।' },
      );
    }
  });
  return pins;
}

function drawBlood(ctx: CanvasRenderingContext2D, random: () => number): Pin[] {
  const pins: Pin[] = [];
  // The first two seats are fixed so the labels always sit on a real cell.
  const placed: { x: number; y: number }[] = [{ x: 900, y: 900 }, { x: 1040, y: 790 }];
  for (let t = 0; t < 4000 && placed.length < 340; t++) {
    const x = 60 + random() * 1680;
    const y = 60 + random() * 1680;
    if (placed.every((p) => Math.hypot(p.x - x, p.y - y) > 74)) placed.push({ x, y });
  }
  placed.slice(1).forEach(({ x, y }) => {
    const g = ctx.createRadialGradient(x, y, 6, x, y, 36);
    g.addColorStop(0, '#f7cfc6');
    g.addColorStop(0.55, '#e58d80');
    g.addColorStop(1, '#c95048');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 36, 0, Math.PI * 2);
    ctx.fill();
  });
  const wbc = (x: number, y: number) => {
    ctx.fillStyle = '#e9dcef';
    ctx.beginPath();
    ctx.arc(x, y, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a2e91';
    [[-20, -12], [16, -18], [4, 20]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, 19, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  wbc(900, 900);
  wbc(420, 520);
  wbc(1320, 1260);
  ctx.fillStyle = '#7d5aa8';
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(100 + random() * 1600, 100 + random() * 1600, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  pins.push(
    { x: 900, y: 900, name: 'শ্বেত কণিকা', hint: 'বড় কোষ, বেগুনি খণ্ডিত নিউক্লিয়াস আছে।' },
    { x: 1040, y: 790, name: 'লোহিত কণিকা', hint: 'মাঝখান ফ্যাকাশে, নিউক্লিয়াস নেই।' },
  );
  return pins;
}

function paint(canvas: HTMLCanvasElement, slide: SlideId, prep: Prep): Pin[] {
  const ctx = canvas.getContext('2d')!;
  const random = seeded(slide.length * 7919);
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#f7f3e6';
  ctx.fillRect(0, 0, SIZE, SIZE);
  let pins: Pin[];
  if (slide === 'onion') pins = drawOnion(ctx, prep, random);
  else if (slide === 'cheek') pins = drawCheek(ctx, prep, random);
  else pins = drawBlood(ctx, random);
  if (prep.thick && slide === 'onion') {
    ctx.fillStyle = 'rgba(64,30,24,.62)';
    ctx.beginPath();
    ctx.ellipse(900, 900, 800, 700, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  if (prep.bubbles) bubbles(ctx, random);
  return pins;
}

const SCALE_ITEMS = [
  { name: 'গালের কোষ', nm: 60000 },
  { name: 'নিউক্লিয়াস', nm: 6000 },
  { name: 'মাইটোকন্ড্রিয়া', nm: 1000 },
  { name: 'ক্রিস্টির ভাঁজ', nm: 30 },
  { name: 'রাইবোজোম', nm: 25 },
];

function LimitPanel() {
  const [wave, setWave] = useState(550);
  const [electron, setElectron] = useState(false);
  const limit = electron ? 1 : Math.round(wave / 2);

  return (
    <div className="lab-grid">
      <div className="panel">
        <h3>কেন সব অঙ্গাণু দেখা যায় না?</h3>
        <p>যা আলাদা করে দেখা যায়, তার সীমা ব্যবহৃত তরঙ্গদৈর্ঘ্যের প্রায় অর্ধেক। নিচের আকারগুলো আনুমানিক।</p>
        {SCALE_ITEMS.map((item) => (
          <div key={item.name} className="res-row">
            <span>{item.name} (প্রায় {bn(item.nm.toLocaleString('en-IN'))} ন্যানোমিটার)</span>
            <strong style={{ color: item.nm >= limit ? '#8fe3b1' : '#ffb199' }}>{item.nm >= limit ? '✓ দেখা যাবে' : '✗ দেখা যাবে না'}</strong>
          </div>
        ))}
      </div>
      <aside className="lab-side">
        <Range label="আলোর তরঙ্গদৈর্ঘ্য" value={wave} min={400} max={700} step={10} display={`${bn(wave)} ন্যানোমিটার`} onChange={(v) => { setWave(v); setElectron(false); }} />
        <button type="button" className="btn btn-hot" aria-pressed={electron} onClick={() => setElectron(!electron)}>
          {electron ? 'আলোক অণুবীক্ষণে ফেরো' : 'ইলেকট্রন অণুবীক্ষণে যাও'}
        </button>
        <Stat label="দেখার সীমা" value={`${bn(limit)} ন্যানোমিটার`} />
        <p className="fb">
          {electron ? 'ইলেকট্রনের তরঙ্গদৈর্ঘ্য অনেক ছোট, তাই ক্রিস্টি ও রাইবোজোমও ধরা পড়ে। ছবি চোখে নয়, পর্দায় দেখা হয়।' : 'তরঙ্গদৈর্ঘ্য যতই কমাও, ২০০ ন্যানোমিটারের নিচে যাওয়া যায় না। শক্তিশালী লেন্স লাগালেও এই সীমা বদলায় না।'}
        </p>
      </aside>
    </div>
  );
}

export default function MicroscopeLab() {
  const [view, setView] = useState<View>('prep');
  const [slide, setSlide] = useState<SlideId>('onion');
  const [choices, setChoices] = useState<Record<number, boolean>>({});
  const [objective, setObjective] = useState(0);
  const [coarse, setCoarse] = useState(30);
  const [fine, setFine] = useState(0);
  const [light, setLight] = useState(60);
  const [pan, setPan] = useState({ x: 900, y: 900 });
  const [crashed, setCrashed] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [named, setNamed] = useState<Record<number, boolean>>({});
  const [activePin, setActivePin] = useState<number | null>(null);
  const [wrongName, setWrongName] = useState(false);
  const [everFocused, setEverFocused] = useState({ low: false, high: false });
  const canvas = useRef<HTMLCanvasElement>(null);

  const info = SLIDES[slide];
  const steps = info.steps;
  const prep: Prep = { thick: false, unstained: false, bubbles: false };
  steps.forEach((s, i) => {
    if (choices[i] === false) prep[s.effect] = true;
  });
  const prepared = steps.every((_, i) => choices[i] !== undefined);
  const prepKey = `${slide}${prep.thick}${prep.unstained}${prep.bubbles}`;

  useEffect(() => {
    if (view === 'scope' && canvas.current) setPins(paint(canvas.current, slide, prep));
    // The key already captures every field of prep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, prepKey]);

  const obj = OBJECTIVES[objective];
  const pos = coarse + fine;
  const error = Math.abs(pos - SHARP_AT);
  const inFocus = error <= obj.tolerance;
  const blur = Math.min(14, Math.max(0, error - obj.tolerance) * obj.blur);

  useEffect(() => {
    if (objective === 2 && pos >= SHARP_AT + 5) setCrashed(true);
    if (inFocus && !crashed) {
      setEverFocused((f) => ({ low: f.low || objective < 2, high: f.high || objective === 2 }));
    }
  }, [pos, objective, inFocus, crashed]);

  const changeSlide = (s: SlideId) => {
    setSlide(s);
    setChoices({});
    setNamed({});
    setActivePin(null);
    setObjective(0);
    setCoarse(30);
    setFine(0);
    setCrashed(false);
    setPan({ x: 900, y: 900 });
    setEverFocused({ low: false, high: false });
    // A slide that needs preparing must be prepared first; a ready-made one goes straight to the stage.
    setView((v) => (v === 'limit' ? v : SLIDES[s].steps.length ? 'prep' : 'scope'));
  };

  const changeView = (v: View) => setView(v === 'scope' && !prepared ? 'prep' : v);

  const resetSlide = () => {
    setCrashed(false);
    setObjective(0);
    setCoarse(30);
    setFine(0);
  };

  const pixels = (SIZE * obj.scale) / 420;
  const brightness = 0.45 + (light / 100) * 0.95;
  const contrast = prep.unstained ? 1 + (1 - light / 100) * 2.4 : 1;
  const filter = `${blur > 0 ? `blur(${blur.toFixed(1)}px) ` : ''}brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)})`;
  // Fine detail needs high power; at 10× the marked parts sit on top of each other.
  const canSeePins = objective === 2 && inFocus && !crashed && !prep.thick;
  const allNamed = pins.length > 0 && pins.every((_, i) => named[i]);

  // The image in a compound microscope is inverted, so it moves opposite to the slide.
  const moveSlide = (dx: number, dy: number) => {
    const stepBy = 160 / obj.scale / 4;
    setPan((p) => ({ x: clamp(p.x + dx * stepBy, 200, SIZE - 200), y: clamp(p.y + dy * stepBy, 200, SIZE - 200) }));
  };

  const problems = [
    prep.thick && steps.find((s) => s.effect === 'thick')?.lesson,
    prep.unstained && steps.find((s) => s.effect === 'unstained')?.lesson,
    prep.bubbles && steps.find((s) => s.effect === 'bubbles')?.lesson,
  ].filter(Boolean) as string[];

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="ল্যাবের অংশ" value={view} onChange={changeView} options={[{ value: 'prep', label: '১. স্লাইড বানাও' }, { value: 'scope', label: '২. অণুবীক্ষণে দেখো' }, { value: 'limit', label: '৩. দেখার সীমা' }]} />
      </div>

      {view !== 'limit' && (
        <div className="chips cell-types" role="group" aria-label="স্লাইড">
          {(Object.keys(SLIDES) as SlideId[]).map((s) => (
            <button key={s} type="button" className="chip-btn" aria-pressed={slide === s} onClick={() => changeSlide(s)}>
              {SLIDES[s].name}
            </button>
          ))}
        </div>
      )}

      {view === 'limit' && <LimitPanel />}

      {view === 'prep' && (
        <div className="panel">
          <h3>{info.name}</h3>
          <p>{info.note}</p>
          {steps.length === 0 && <p>এই স্লাইডটি তৈরি আছে। সরাসরি অণুবীক্ষণে যাও।</p>}
          {steps.map((s, i) => (
            <div key={s.title} style={{ marginTop: 10 }}>
              <h4>ধাপ {bn(i + 1)}: {s.title}</h4>
              <div className="option-stack">
                {[true, false].map((good) => (
                  <button key={String(good)} type="button" className="lab-option" aria-pressed={choices[i] === good} onClick={() => setChoices({ ...choices, [i]: good })}>
                    {good ? s.good : s.bad}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="panel-note">যেকোনো বিকল্প বেছে নিতে পারো। ভুল করলে অণুবীক্ষণেই তার ফল দেখবে।</p>
          <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} disabled={!prepared} onClick={() => setView('scope')}>
            {prepared ? 'অণুবীক্ষণে বসাও →' : 'আগে সব ধাপ শেষ করো'}
          </button>
        </div>
      )}

      {view === 'scope' && (
        <LabGrid
          view={
            <>
              <div className="scope" role="img" aria-label={`${info.name}, ${bn(EYEPIECE * obj.x)} গুণ বিবর্ধনে ${inFocus ? 'স্পষ্ট' : 'ঝাপসা'}`}>
                <div className="scope-field" style={{ filter: crashed ? 'blur(10px) brightness(.5)' : filter }}>
                  <canvas
                    ref={canvas}
                    width={SIZE}
                    height={SIZE}
                    style={{
                      width: `${pixels * 100}%`,
                      height: `${pixels * 100}%`,
                      left: `${50 + ((900 - pan.x) / SIZE) * pixels * 100}%`,
                      top: `${50 + ((900 - pan.y) / SIZE) * pixels * 100}%`,
                    }}
                  />
                </div>
                {canSeePins &&
                  pins.map((p, i) => {
                    const left = 50 + ((p.x - pan.x) / SIZE) * pixels * 100;
                    const top = 50 + ((p.y - pan.y) / SIZE) * pixels * 100;
                    if (left < 6 || left > 94 || top < 6 || top > 94) return null;
                    const cls = `scope-pin${named[i] ? ' named' : ''}${activePin === i ? ' active' : ''}`;
                    return (
                      <button key={p.name} type="button" className={cls} style={{ left: `${left}%`, top: `${top}%` }} aria-label={`চিহ্ন ${bn(i + 1)}`} onClick={() => { setActivePin(i); setWrongName(false); }}>
                        {bn(i + 1)}
                      </button>
                    );
                  })}
                <span className="scope-vignette" />
              </div>
              <div className="stepnav" style={{ justifyContent: 'center' }}>
                {OBJECTIVES.map((o, i) => (
                  <button key={o.x} type="button" className={i === objective ? 'btn btn-hot' : 'btn btn-lab'} aria-pressed={i === objective} onClick={() => setObjective(i)} disabled={crashed}>
                    {bn(o.x)}× লেন্স
                  </button>
                ))}
              </div>
            </>
          }
          side={
            <>
              <div className="stats">
                <Stat label="মোট বিবর্ধন" value={`${bn(EYEPIECE * obj.x)}×`} />
                <Stat label="ফোকাস" value={<span style={{ fontSize: 17 }}>{inFocus ? 'স্পষ্ট' : 'ঝাপসা'}</span>} />
              </div>
              <Range label="কোর্স নব" value={coarse} min={0} max={100} display={bn(coarse)} onChange={setCoarse} />
              <Range label="ফাইন নব" value={fine} min={-4} max={4} step={0.25} display={bn(fine)} onChange={setFine} />
              <Range label="ডায়াফ্রাম (আলো)" value={light} min={0} max={100} display={`${bn(light)}%`} onChange={setLight} />

              {crashed ? (
                <div className="panel" role="alert">
                  <h3>স্লাইড ভেঙে গেছে!</h3>
                  <p>উচ্চ ক্ষমতার লেন্স স্লাইডের খুব কাছে থাকে। এখানে কোর্স নব ঘোরালে লেন্স স্লাইডে ঠেকে যায়। উচ্চ ক্ষমতায় শুধু ফাইন নব ব্যবহার করো।</p>
                  <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} onClick={resetSlide}>নতুন স্লাইডে আবার শুরু করো</button>
                </div>
              ) : (
                <div className="panel">
                  <h4>কাজের তালিকা</h4>
                  <ul className="mission">
                    <li className={everFocused.low ? 'done' : ''}>{everFocused.low ? '✓' : '○'} কম ক্ষমতায় কোর্স নবে ফোকাস করো</li>
                    <li className={everFocused.high ? 'done' : ''}>{everFocused.high ? '✓' : '○'} ৪০× লেন্সে ফাইন নবে স্পষ্ট করো</li>
                    <li className={allNamed ? 'done' : ''}>{allNamed ? '✓' : '○'} ৪০× লেন্সে চিহ্নিত অংশগুলোর নাম দাও</li>
                  </ul>
                  {objective === 2 && !inFocus && <p style={{ color: '#ffd166' }}>সাবধান: এখন শুধু ফাইন নব ঘোরাও।</p>}
                </div>
              )}

              {activePin !== null && pins[activePin] && canSeePins && (
                <div className="panel" aria-live="polite">
                  {named[activePin] ? (
                    <>
                      <h3>{pins[activePin].name}</h3>
                      <p>{pins[activePin].hint}</p>
                    </>
                  ) : (
                    <>
                      <h4>চিহ্ন {bn(activePin + 1)}: এটি কী?</h4>
                      <div className="chips">
                        {pins.map((p, i) => (
                          <button
                            key={p.name}
                            type="button"
                            className="chip-btn"
                            onClick={() => {
                              if (i === activePin) {
                                setNamed({ ...named, [i]: true });
                                setWrongName(false);
                              } else {
                                setWrongName(true);
                              }
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                      {wrongName && <p style={{ color: '#ffb199' }}>হয়নি। অবস্থান ও রং আবার দেখো।</p>}
                    </>
                  )}
                </div>
              )}

              <div className="panel">
                <h4>স্লাইড সরাও</h4>
                <div className="stage-pad">
                  <span />
                  <button type="button" aria-label="স্লাইড ওপরে" onClick={() => moveSlide(0, 1)}>↑</button>
                  <span />
                  <button type="button" aria-label="স্লাইড বামে" onClick={() => moveSlide(1, 0)}>←</button>
                  <span />
                  <button type="button" aria-label="স্লাইড ডানে" onClick={() => moveSlide(-1, 0)}>→</button>
                  <span />
                  <button type="button" aria-label="স্লাইড নিচে" onClick={() => moveSlide(0, -1)}>↓</button>
                  <span />
                </div>
                <p className="panel-note">লক্ষ করো: স্লাইড যেদিকে সরে, ছবি যায় উল্টো দিকে। লেন্স ছবিকে উল্টে দেখায়।</p>
              </div>

              {problems.length > 0 && (
                <div className="panel">
                  <h4>ছবি খারাপ দেখাচ্ছে কেন?</h4>
                  {problems.map((p) => <p key={p}>{p}</p>)}
                  <button type="button" className="btn btn-lab" style={{ marginTop: 6 }} onClick={() => { setChoices({}); setNamed({}); setView('prep'); }}>
                    স্লাইড আবার বানাও
                  </button>
                </div>
              )}
              {prep.thick && <p className="fb">নমুনা ঘন হওয়ায় অংশ চিহ্নিত করা যাচ্ছে না।</p>}
            </>
          }
        />
      )}
    </Stage>
  );
}
