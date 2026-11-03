import { useMemo, useState } from 'react';
import { Range, Seg, Stage, Stat } from '../../../../components/labkit';
import { bn, shuffle } from '../../../../core/util';
import { mix } from '../paint/paint';
import { SAMPLES, foodTest, starchLeft, type FoodTest, type SalivaTube } from '../models/body';

function Defs() {
  return (
    <defs>
      <linearGradient id="bench-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d8dcd2" />
        <stop offset="1" stopColor="#aeb5a8" />
      </linearGradient>
      <linearGradient id="bench-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6d4b30" />
        <stop offset="1" stopColor="#3f2a1a" />
      </linearGradient>
      <linearGradient id="rack" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c99a66" />
        <stop offset="1" stopColor="#8a5f38" />
      </linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="0.16" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="0.72" stopColor="#fff" stopOpacity="0.03" />
        <stop offset="0.86" stopColor="#fff" stopOpacity="0.3" />
        <stop offset="1" stopColor="#233" stopOpacity="0.32" />
      </linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.32" />
        <stop offset="0.3" stopColor="#000" stopOpacity="0" />
        <stop offset="0.72" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.4" />
      </linearGradient>
    </defs>
  );
}

function Tube({ x, liquid, cloudy, label, level = 150 }: { x: number; liquid: string; cloudy?: boolean; label: string; level?: number }) {
  const top = 60;
  const bottom = 300;
  const r = 24;
  const body = `M${x - r} ${top}V${bottom - r}a${r} ${r} 0 0 0 ${r * 2} 0V${top}`;
  const fluidTop = bottom - level;
  return (
    <g>
      <ellipse cx={x + 8} cy={bottom + 34} rx={38} ry={6} fill="#000" opacity="0.28" />
      <path d={`M${x - r + 2} ${fluidTop}V${bottom - r}a${r - 2} ${r - 2} 0 0 0 ${(r - 2) * 2} 0V${fluidTop}Z`} fill={liquid} style={{ transition: 'fill 1.2s ease' }} />
      {cloudy && <path d={`M${x - r + 2} ${fluidTop}V${bottom - r}a${r - 2} ${r - 2} 0 0 0 ${(r - 2) * 2} 0V${fluidTop}Z`} fill="#fff" opacity="0.2" />}
      <path d={`M${x - r + 2} ${fluidTop}V${bottom - r}a${r - 2} ${r - 2} 0 0 0 ${(r - 2) * 2} 0V${fluidTop}Z`} fill="url(#shade)" />
      <ellipse cx={x} cy={fluidTop} rx={r - 2} ry={4} fill={liquid} stroke="#fff" strokeOpacity="0.5" />
      <path d={`${body}Z`} fill="url(#glass)" stroke="#e9f0ee" strokeOpacity="0.8" strokeWidth="1.6" />
      <ellipse cx={x} cy={top} rx={r + 2} ry={4.5} fill="none" stroke="#f4f8f6" strokeWidth="2.4" />
      <path d={`M${x - r + 8} ${top + 12}V${bottom - 40}`} stroke="#fff" strokeOpacity="0.7" strokeWidth="3.5" strokeLinecap="round" />
      <text x={x} y={bottom + 62} textAnchor="middle" fontSize="15" fontWeight="600" fill="#f4efe2">{label}</text>
    </g>
  );
}

function BenchFrame({ width, children }: { width: number; children: React.ReactNode }) {
  return (
    <div className="bench">
      <svg viewBox={`0 0 ${width} 390`} role="img" aria-label="পরীক্ষাগারের টেবিলে টেস্টটিউব">
        <Defs />
        <rect width={width} height="300" fill="url(#bench-wall)" />
        <rect y="300" width={width} height="90" fill="url(#bench-top)" />
        <rect x="24" y="118" width={width - 48} height="14" rx="3" fill="url(#rack)" />
        {children}
        <rect x="24" y="306" width={width - 48} height="22" rx="4" fill="url(#rack)" />
      </svg>
    </div>
  );
}

function FilterPaper({ marked }: { marked: boolean | null }) {
  return (
    <svg viewBox="0 0 220 220" width="100%" style={{ maxWidth: 220, display: 'block', margin: '0 auto' }} role="img" aria-label={marked === null ? 'সাদা কাগজ' : marked ? 'কাগজে স্বচ্ছ দাগ' : 'কাগজ শুকিয়ে গেছে'}>
      <defs>
        <radialGradient id="spot">
          <stop offset="0" stopColor="#cfbf8a" stopOpacity="0.9" />
          <stop offset="0.8" stopColor="#d6c896" stopOpacity="0.75" />
          <stop offset="1" stopColor="#d6c896" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="14" y="14" width="192" height="192" rx="3" fill="#f6f3e8" stroke="#c8c2ae" />
      {marked && <ellipse cx="112" cy="110" rx="52" ry="46" fill="url(#spot)" />}
      {marked === false && <ellipse cx="112" cy="110" rx="40" ry="36" fill="none" stroke="#e4dfcd" strokeWidth="2" />}
    </svg>
  );
}

const TESTS: { id: FoodTest; name: string; reagent: string; how: string }[] = [
  { id: 'iodine', name: 'শ্বেতসার পরীক্ষা', reagent: 'আয়োডিন দ্রবণ', how: 'নীলচে-কালো হলে শ্বেতসার আছে; বাদামি থাকলে নেই।' },
  { id: 'biuret', name: 'আমিষ পরীক্ষা', reagent: 'বাইইউরেট দ্রবণ', how: 'বেগুনি হলে আমিষ আছে; নীল থাকলে নেই।' },
  { id: 'paper', name: 'স্নেহ পরীক্ষা', reagent: 'সাদা কাগজ', how: 'শুকানোর পর স্বচ্ছ দাগ থাকলে স্নেহ আছে।' },
];

/** Three unknown samples, tested the way a school laboratory does it. */
function Unknowns() {
  const [deck, setDeck] = useState(() => shuffle(SAMPLES).slice(0, 3));
  const [at, setAt] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [test, setTest] = useState<FoodTest>('iodine');
  const [guess, setGuess] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const sample = deck[at];
  const key = (i: number, t: FoodTest) => `${i}${t}`;
  const info = TESTS.find((t) => t.id === test)!;
  const run = (i: number) => setDone(new Set(done).add(key(i, test)));
  const start = { iodine: '#e9d6a8', biuret: '#b9d4ee', paper: '#e9e4d2' }[test];

  return (
    <>
      <div className="stage-bar">
        <Seg<FoodTest> label="পরীক্ষা" value={test} onChange={setTest} options={TESTS.map((t) => ({ value: t.id, label: t.name }))} />
      </div>
      {test === 'paper' ? (
        <div className="digest-pair">
          {deck.map((s, i) => (
            <div key={s.name} className="panel">
              <h4>নমুনা {['ক', 'খ', 'গ'][i]}</h4>
              <FilterPaper marked={done.has(key(i, 'paper')) ? foodTest(s, 'paper').positive : null} />
              <button type="button" className="btn btn-lab" style={{ marginTop: 6 }} onClick={() => run(i)}>ফোঁটা দিয়ে শুকাও</button>
            </div>
          ))}
        </div>
      ) : (
        <>
          <BenchFrame width={560}>
            {deck.map((s, i) => (
              <Tube key={s.name} x={120 + i * 160} label={`নমুনা ${['ক', 'খ', 'গ'][i]}`} liquid={done.has(key(i, test)) ? foodTest(s, test).color : start} cloudy={s.fat} />
            ))}
          </BenchFrame>
          <div className="stepnav">
            {deck.map((_, i) => (
              <button key={i} type="button" className="btn btn-lab" onClick={() => run(i)}>নমুনা {['ক', 'খ', 'গ'][i]}-তে {info.reagent}</button>
            ))}
          </div>
        </>
      )}
      <p className="fb" style={{ marginTop: 8 }}>{info.how}</p>
      <div className="panel" style={{ marginTop: 8 }}>
        <h4>ফল দেখে শনাক্ত করো: নমুনা {['ক', 'খ', 'গ'][at]} কোনটি?</h4>
        <div className="toggle-row">
          {['ক', 'খ', 'গ'].map((n, i) => <button key={n} type="button" className="chip-btn" aria-pressed={at === i} onClick={() => { setAt(i); setGuess(null); }}>নমুনা {n}</button>)}
        </div>
        <div className="chips">
          {SAMPLES.map((s) => <button key={s.name} type="button" className="chip-btn" onClick={() => { setGuess(s.name); if (s.name === sample.name) setSolved(new Set(solved).add(at)); }}>{s.name}</button>)}
        </div>
        {guess && <p className={guess === sample.name ? 'fb fb-ok' : 'fb fb-no'} role="status">{guess === sample.name ? `ঠিক! নমুনাটি ${sample.name}।` : 'মিলছে না। তিনটি পরীক্ষার ফল মিলিয়ে ভাবো।'}</p>}
        {solved.size === 3 && <button type="button" className="btn btn-hot" style={{ marginTop: 6 }} onClick={() => { setDeck(shuffle(SAMPLES).slice(0, 3)); setDone(new Set()); setSolved(new Set()); setGuess(null); setAt(0); }}>নতুন নমুনা নাও</button>}
      </div>
    </>
  );
}

const TUBES: { label: string; tube: SalivaTube }[] = [
  { label: '৫°C, লালা', tube: { temp: 5, boiled: false, saliva: true } },
  { label: '৩৭°C, লালা', tube: { temp: 37, boiled: false, saliva: true } },
  { label: '৩৭°C, ফোটানো লালা', tube: { temp: 37, boiled: true, saliva: true } },
  { label: '৩৭°C, লালা নেই', tube: { temp: 37, boiled: false, saliva: false } },
];

/** Iodine colour for a given share of starch: blue-black, through violet, to amber. */
function iodineColor(left: number) {
  const k = Math.min(1, left * 1.6);
  return `rgb(${mix(204, 30, k)},${mix(140, 26, k)},${mix(50, 66, k)})`;
}

function SalivaBench() {
  const [minutes, setMinutes] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const left = useMemo(() => TUBES.map((t) => starchLeft(t.tube, minutes)), [minutes]);
  const fastest = left.indexOf(Math.min(...left));

  return (
    <>
      <div className="panel">
        <h4>চারটি টিউবে একই শ্বেতসার দ্রবণ ও আয়োডিন। আগে অনুমান করো: কোনটির রং আগে চলে যাবে?</h4>
        <div className="chips">
          {TUBES.map((t, i) => <button key={t.label} type="button" className="chip-btn" aria-pressed={guess === i} disabled={minutes > 0} onClick={() => setGuess(i)}>{t.label}</button>)}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <BenchFrame width={640}>
          {TUBES.map((t, i) => <Tube key={t.label} x={95 + i * 150} label={t.label} liquid={iodineColor(left[i])} />)}
        </BenchFrame>
      </div>
      <Range label="সময়" value={minutes} min={0} max={15} display={`${bn(minutes)} মিনিট`} onChange={(v) => { if (guess !== null) setMinutes(v); }} />
      {guess === null && <p className="fb">সময় এগোতে আগে একটি টিউব বেছে নাও।</p>}
      {minutes >= 10 && (
        <div className="panel" role="status">
          <h3>{guess === fastest ? 'তোমার অনুমান ঠিক!' : 'অনুমান মেলেনি'}</h3>
          <p>টায়ালিন দেহের তাপে সবচেয়ে ভালো কাজ করে। ঠান্ডায় ধীর হয়, ফোটালে উৎসেচক চিরতরে নষ্ট হয়। শ্বেতসার ভাঙলে আয়োডিনের নীল রং থাকে না।</p>
          <p style={{ color: '#ffd166' }}>এবার ভাবো: লালা ছাড়া টিউবটি কেন রাখা হলো? এটি বাদ দিলে কী প্রমাণ করা যেত না?</p>
        </div>
      )}
    </>
  );
}

export function FoodTestLab() {
  const [mode, setMode] = useState<'unknown' | 'saliva'>('unknown');
  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="পরীক্ষা" value={mode} onChange={setMode} options={[{ value: 'unknown', label: 'অজানা খাদ্য শনাক্ত করো' }, { value: 'saliva', label: 'লালার উৎসেচক' }]} />
      </div>
      {mode === 'unknown' ? <Unknowns /> : <SalivaBench />}
      <Stat label="নিরাপত্তা" value={<span style={{ fontSize: 15 }}>পরীক্ষাগারের খাবার বা রাসায়নিক কখনো মুখে দেবে না।</span>} />
      <p className="panel-note" style={{ color: 'var(--stage-soft)', fontSize: 14, marginBottom: 0 }}>এই পরীক্ষাগুলো স্কুল পরীক্ষাগারের প্রচলিত পদ্ধতি, বইয়ের পরিপাক অধ্যায়ের ধারণা হাতে-কলমে বোঝার জন্য যোগ করা হয়েছে।</p>
    </Stage>
  );
}
