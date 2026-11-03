import { useMemo, useState } from 'react';
import { LabGrid, Meter, PredictBox, Range, Seg, Stage, Stat, StepNav, useSteps, useTick, type Scenario } from '../../../components/labkit';
import { bn, shuffle } from '../../../core/util';
import { ALL_GROUPS, BP_PATIENTS, HEART_PHASES, bpBand, canGive, clumps, groupName, transpiration, wilts, type BloodGroup, type TransState } from './models/body';
import { INIT, SCENARIOS } from './models/scenarios';

interface Osmo {
  left: number;
  right: number;
}

const OSMO_START: Osmo = { left: 2, right: 8 };
const shiftOf = (s: Osmo) => s.right - s.left;

const OSMO_SCENARIOS: Scenario<Osmo>[] = [
  { id: 'raisin', title: 'কিশমিশ পানিতে', set: { left: 0, right: 8 }, ask: 'ধরো ডান পাশ কিশমিশের ভেতরের ঘন রস, বাম পাশ বিশুদ্ধ পানি। পানি কোন দিকে যাবে?', options: ['কিশমিশের ভেতরে', 'কিশমিশ থেকে বাইরে', 'কোনো দিকেই না'], answer: 0, why: 'পানি কম ঘন দিক থেকে ঘন দিকে যায়। তাই কিশমিশ ফুলে ওঠে।', proves: (s) => shiftOf(s) > 0 },
  { id: 'syrup', title: 'ফোলা কিশমিশ ঘন শরবতে', set: { left: 10, right: 3 }, ask: 'এবার বাম পাশ ঘন চিনির শরবত, ডান পাশ ফোলা কিশমিশের রস। কী হবে?', options: ['আরও ফুলবে', 'আবার চুপসে যাবে', 'একই থাকবে'], answer: 1, why: 'এখন বাইরের দ্রবণ বেশি ঘন, তাই পানি বেরিয়ে যায়। দিক ঠিক করে ঘনত্বের পার্থক্য, বস্তু নয়।', proves: (s) => shiftOf(s) < 0 },
  { id: 'equal', title: 'দুই পাশে সমান', set: { left: 6, right: 6 }, ask: 'দুই পাশের ঘনত্ব সমান হলে পানি কি একেবারে থেমে যায়?', options: ['হ্যাঁ, অণু নড়ে না', 'না, দুই দিকেই সমান হারে যায়', 'সব পানি এক পাশে যায়'], answer: 1, why: 'অণুর চলাচল থামে না, তবে নিট প্রবাহ শূন্য, তাই উচ্চতা বদলায় না।', proves: (s) => shiftOf(s) === 0 },
];

export function OsmosisLab() {
  const [state, setState] = useState<Osmo>(OSMO_START);
  const { left, right } = state;
  const shift = shiftOf(state) * 9;
  const levelL = 170 + shift;
  const levelR = 170 - shift;

  const dots = (count: number, x0: number) =>
    Array.from({ length: count }, (_, i) => (
      <circle key={i} cx={x0 + ((i * 53) % 130)} cy={260 + ((i * 37) % 110)} r="8" fill="#ffd166" stroke="#7a5a10" strokeWidth="1.5" />
    ));

  const dir = Math.sign(right - left);
  const message =
    dir === 0
      ? 'দুই পাশের ঘনত্ব সমান। পানি দুই দিকেই সমান হারে যায়, উচ্চতা বদলায় না।'
      : `পানি কম ঘন দ্রবণ থেকে পর্দা পেরিয়ে ${dir > 0 ? 'ডান' : 'বাম'} পাশের ঘন দ্রবণে যাচ্ছে। চিনির অণু বড়, তাই পর্দা পেরোতে পারে না।`;

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 600 420" role="img" aria-label={message} style={{ background: '#16292c' }}>
            <rect x="110" y="60" width="380" height="330" rx="12" fill="none" stroke="#d6e8ef" strokeWidth="5" />
            <rect x="113" y={levelL} width="184" height={388 - levelL} fill="#4aa0cc" opacity="0.6" style={{ transition: 'all .7s ease' }} />
            <rect x="303" y={levelR} width="184" height={388 - levelR} fill="#4aa0cc" opacity="0.6" style={{ transition: 'all .7s ease' }} />
            <line x1="300" y1="60" x2="300" y2="390" stroke="#ffe08a" strokeWidth="5" strokeDasharray="10 6" />
            {dots(left, 135)}
            {dots(right, 325)}
            {dir !== 0 &&
              [230, 290, 350].map((y) => (
                <circle key={y} r="5" fill="#bfe9ff">
                  <animateMotion dur="1.5s" repeatCount="indefinite" begin={`${-y / 200}s`} path={`M${300 - dir * 60} ${y} L${300 + dir * 60} ${y}`} />
                </circle>
              ))}
            <text x="205" y="44" textAnchor="middle" className="svg-label">বাম পাশ</text>
            <text x="395" y="44" textAnchor="middle" className="svg-label">ডান পাশ</text>
            <text x="300" y="412" textAnchor="middle" className="svg-label" fontSize="13">বৈষম্যভেদ্য পর্দা</text>
          </svg>
        }
        side={
          <>
            <Range label="বাম পাশে চিনি" value={left} min={0} max={10} onChange={(v) => setState({ ...state, left: v })} />
            <Range label="ডান পাশে চিনি" value={right} min={0} max={10} onChange={(v) => setState({ ...state, right: v })} />
            <div className="panel" aria-live="polite"><p>{message}</p></div>
            <PredictBox scenarios={OSMO_SCENARIOS} onRun={(set) => setState({ ...OSMO_START, ...set })} />
            <p className="fb">ঘরে করে দেখো: আলু কেটে মাঝখানে গর্ত করো, চিনি দিয়ে পানির পাত্রে বসাও। কিছুক্ষণ পর গর্তে পানি জমবে। এটিই আলুর অসমোস্কোপ।</p>
          </>
        }
      />
    </Stage>
  );
}

export function TranspireLab() {
  const [s, setS] = useState<TransState>(INIT.trans);
  const rate = transpiration(s);
  const limp = wilts(s);
  const drops = Math.round(rate * 26);
  const set = (patch: Partial<TransState>) => setS({ ...s, ...patch });

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 560 400" role="img" aria-label={`প্রস্বেদন ${bn(Math.round(rate * 100))} শতাংশ, ${limp ? 'গাছ নেতিয়ে পড়েছে' : 'গাছ সতেজ'}`} style={{ background: s.light ? '#7cc4e8' : '#101c34' }}>
            <rect y="320" width="560" height="80" fill={s.soil > 40 ? '#5a3d28' : s.soil > 18 ? '#7d5a3a' : '#a78a62'} />
            <path d="M210 330L230 395H330L350 330Z" fill="#b5502f" />
            <path d="M280 330C280 280 280 230 280 170" stroke="#3f7a44" strokeWidth="9" fill="none" />
            {[250, 215, 180].map((y, i) => [-1, 1].map((d) => (
              <path
                key={`${y}${d}`}
                d={limp ? `M280 ${y}q${d * 26} 22 ${d * 56} 58q${d * -44} -12 ${d * -56} -58Z` : `M280 ${y}q${d * 36} -30 ${d * 84} -8q${d * -44} 26 ${d * -84} 8Z`}
                fill={limp ? '#88a553' : '#3f9f5e'}
                style={{ transition: 'all .6s' }}
                opacity={1 - i * 0.05}
              />
            )))}
            <path d="M170 300C120 200 200 100 280 90S440 200 390 300Z" fill="#fff" fillOpacity="0.14" stroke="#fff" strokeWidth="3" strokeDasharray="8 7" />
            <text x="280" y="78" textAnchor="middle" className="svg-label svg-label-dark" fontSize="13">পলিথিন ব্যাগ</text>
            {Array.from({ length: drops }, (_, i) => <circle key={i} cx={190 + ((i * 67) % 180)} cy={120 + ((i * 41) % 165)} r="4" fill="#d9f2ff" stroke="#3a8fb7" />)}
            {s.wind && [60, 110, 160].map((y) => <path key={y} d={`M10 ${y}q60 -20 120 0t120 0`} stroke="#fff" fill="none" strokeWidth="3" className="flow" />)}
          </svg>
        }
        side={
          <>
            <Meter label="প্রস্বেদনের হার" value={rate} color="#7fd2ff" />
            <div className="stats">
              <Stat label="ব্যাগের ফোঁটা" value={bn(drops)} />
              <Stat label="গাছ" value={<span style={{ fontSize: 17 }}>{limp ? 'নেতানো' : 'সতেজ'}</span>} />
            </div>
            <Range label="তাপমাত্রা" value={s.temp} min={5} max={42} display={`${bn(s.temp)}°C`} onChange={(temp) => set({ temp })} />
            <Range label="বাতাসের আর্দ্রতা" value={s.humidity} min={30} max={100} display={`${bn(s.humidity)}%`} onChange={(humidity) => set({ humidity })} />
            <Range label="মাটির পানি" value={s.soil} min={0} max={100} display={`${bn(s.soil)}%`} onChange={(soil) => set({ soil })} />
            <div className="toggle-row">
              <button type="button" className="chip-btn" aria-pressed={s.light} onClick={() => set({ light: !s.light })}>আলো</button>
              <button type="button" className="chip-btn" aria-pressed={s.wind} onClick={() => set({ wind: !s.wind })}>বাতাস</button>
              <button type="button" className="chip-btn" aria-pressed={s.sealed} onClick={() => set({ sealed: !s.sealed })}>পাতায় ভেসলিন</button>
            </div>
            <PredictBox scenarios={SCENARIOS.trans} onRun={(set2) => setS({ ...INIT.trans, ...set2 })} />
            <p className="fb">প্রস্বেদন গাছের জন্য একই সাথে প্রয়োজনীয় ও ক্ষতিকর: পানি টানে ও ঠান্ডা রাখে, আবার পানি হারায়। সংখ্যাগুলো শেখার মডেল।</p>
          </>
        }
      />
    </Stage>
  );
}

const HEART_STEPS = [
  { name: 'মহাশিরা', at: [170, 60], blue: true, text: 'দেহ থেকে অক্সিজেনহীন রক্ত মহাশিরা দিয়ে ফেরে।' },
  { name: 'ডান অলিন্দ', at: [205, 165], blue: true, text: 'রক্ত ডান অলিন্দে জমে। অলিন্দ সংকুচিত হলে ট্রাইকাসপিড কপাটিকা খোলে।' },
  { name: 'ডান নিলয়', at: [215, 305], blue: true, text: 'ডান নিলয় সংকুচিত হয়, ট্রাইকাসপিড বন্ধ হয়, পালমোনারি কপাটিকা খোলে।' },
  { name: 'ফুসফুসীয় ধমনি', at: [310, 55], blue: true, text: 'রক্ত ফুসফুসে যায়। এটি ধমনি হলেও এতে CO₂ সমৃদ্ধ রক্ত থাকে: ব্যতিক্রমটি মনে রাখো।' },
  { name: 'ফুসফুস', at: [520, 60], blue: false, text: 'বায়ুথলিতে CO₂ বেরিয়ে যায়, O₂ রক্তে আসে। রক্ত উজ্জ্বল লাল হয়।' },
  { name: 'বাম অলিন্দ', at: [395, 165], blue: false, text: 'ফুসফুসীয় শিরা দিয়ে অক্সিজেনযুক্ত রক্ত বাম অলিন্দে আসে।' },
  { name: 'বাম নিলয়', at: [385, 310], blue: false, text: 'হৃৎপিণ্ডের সবচেয়ে পুরু প্রাচীর, কারণ সারা দেহে রক্ত পাঠাতে হয়।' },
  { name: 'মহাধমনি', at: [300, 30], blue: false, text: 'প্রবল চাপে রক্ত মহাধমনি দিয়ে সারা দেহে ছড়ায়।' },
];

function HeartOutline({ phase, leaky }: { phase: number; leaky: boolean }) {
  const p = HEART_PHASES[phase];
  const ventricleSqueeze = p.ventricles === 'সংকুচিত';
  const atriaSqueeze = p.atria === 'সংকুচিত';
  const valve = (x: number, open: boolean, y: number, color: string) => (
    <g key={`${x}${y}`} stroke={color} strokeWidth="7" strokeLinecap="round">
      <line x1={x - 26} y1={y} x2={open ? x - 12 : x} y2={open ? y + 26 : y + 3} style={{ transition: 'all .4s' }} />
      <line x1={x + 26} y1={y} x2={open ? x + 12 : x} y2={open ? y + 26 : y + 3} style={{ transition: 'all .4s' }} />
    </g>
  );
  return (
    <>
      <path d="M300 410C150 340 110 240 120 170 130 95 235 95 300 130 365 95 470 95 480 170 490 240 450 340 300 410Z" fill="#f0b0a3" stroke="#a03a2c" strokeWidth="6" />
      <path d="M300 135V375" stroke="#a03a2c" strokeWidth="14" />
      <ellipse cx="205" cy="170" rx={atriaSqueeze ? 50 : 66} ry={atriaSqueeze ? 34 : 46} fill="#5a86dd" style={{ transition: 'all .4s' }} />
      <ellipse cx="395" cy="170" rx={atriaSqueeze ? 50 : 66} ry={atriaSqueeze ? 34 : 46} fill="#e0564e" style={{ transition: 'all .4s' }} />
      <ellipse cx="212" cy="295" rx={ventricleSqueeze ? 42 : 66} ry={ventricleSqueeze ? 50 : 72} fill="#5a86dd" style={{ transition: 'all .4s' }} />
      <ellipse cx="388" cy="295" rx={ventricleSqueeze ? 42 : 66} ry={ventricleSqueeze ? 50 : 72} fill="#e0564e" style={{ transition: 'all .4s' }} />
      {valve(205, p.av, 222, '#fff')}
      {valve(395, leaky && !p.av ? true : p.av, 222, leaky ? '#ffb199' : '#fff')}
      {leaky && !p.av && <text x="470" y="232" className="svg-label" fontSize="14">রক্ত ফিরে আসছে!</text>}
      <rect x="245" y="46" width="50" height="62" fill="#5a86dd" />
      <rect x="305" y="46" width="50" height="62" fill="#e0564e" />
      {[270, 330].map((x) => (
        <path key={x} d={p.semi ? `M${x - 18} 106L${x - 10} 82M${x + 18} 106L${x + 10} 82` : `M${x - 18} 106L${x} 96M${x + 18} 106L${x} 96`} stroke="#fff" strokeWidth="6" strokeLinecap="round" style={{ transition: 'all .4s' }} />
      ))}
      <text x="205" y="175" textAnchor="middle" className="svg-label" fontSize="14">ডান অলিন্দ</text>
      <text x="395" y="175" textAnchor="middle" className="svg-label" fontSize="14">বাম অলিন্দ</text>
      <text x="212" y="300" textAnchor="middle" className="svg-label" fontSize="14">ডান নিলয়</text>
      <text x="388" y="300" textAnchor="middle" className="svg-label" fontSize="14">বাম নিলয়</text>
    </>
  );
}

export function HeartLab() {
  const steps = useSteps(HEART_STEPS.length, 2400);
  const [mode, setMode] = useState<'path' | 'cycle'>('cycle');
  const [phase, setPhase] = useState(0);
  const [rate, setRate] = useState(72);
  const [leaky, setLeaky] = useState(false);
  const step = HEART_STEPS[steps.index];
  const blue = '#3f6fd1';
  const red = '#d9413a';

  useTick(() => setPhase((p) => (p + 1) % HEART_PHASES.length), Math.round(20000 / rate), mode === 'cycle');

  const p = HEART_PHASES[phase];

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="ল্যাবের ধরন" value={mode} onChange={setMode} options={[{ value: 'cycle', label: 'হৃৎস্পন্দন চক্র' }, { value: 'path', label: 'রক্তের পথ' }]} />
      </div>
      {mode === 'cycle' ? (
        <LabGrid
          view={
            <svg viewBox="0 0 600 440" role="img" aria-label={`হৃৎচক্র: ${p.name}`} style={{ background: '#16292c' }}>
              <HeartOutline phase={phase} leaky={leaky} />
            </svg>
          }
          side={
            <>
              <div className="panel" aria-live="polite">
                <h3>{p.name}</h3>
                <span className="tag">অলিন্দ: {p.atria}</span>
                <span className="tag">নিলয়: {p.ventricles}</span>
                <p>{p.text}</p>
              </div>
              <Range label="হৃৎস্পন্দন" value={rate} min={40} max={160} display={`${bn(rate)}/মিনিট`} onChange={setRate} />
              <div className="stats">
                <Stat label="এক চক্রের সময়" value={`${bn(60 / rate, 2)} সে.`} />
                <Stat label="দিনে স্পন্দন" value={bn(Math.round((rate * 1440) / 1000))} />
              </div>
              <p className="panel-note" style={{ color: 'var(--stage-soft)', fontSize: 14, margin: 0 }}>“দিনে স্পন্দন” হাজারের হিসাবে। বিশ্রামে নাড়িস্পন্দন মিনিটে ৬০–১০০।</p>
              <button type="button" className="btn btn-lab" aria-pressed={leaky} onClick={() => setLeaky(!leaky)}>
                {leaky ? 'কপাটিকা ঠিক করো' : 'বাতজ্বরে নষ্ট কপাটিকা দেখো'}
              </button>
              {leaky && <p className="fb fb-no">নিলয়ের সংকোচনে কপাটিকা পুরো বন্ধ হচ্ছে না, তাই রক্তের একাংশ অলিন্দে ফিরছে। রোগী অল্পতেই ক্লান্ত হন।</p>}
            </>
          }
        />
      ) : (
        <LabGrid
          view={
            <>
              <svg viewBox="0 0 600 440" role="img" aria-label={`রক্ত এখন ${step.name}`} style={{ background: '#16292c' }}>
                <path d="M150 20V110" stroke={blue} strokeWidth="34" />
                <path d="M290 40Q400 10 560 40" stroke={blue} strokeWidth="20" fill="none" opacity="0.7" />
                <path d="M300 110Q290 30 360 22" stroke={red} strokeWidth="28" fill="none" />
                <path d="M300 410C150 340 110 240 120 170 130 95 235 95 300 130 365 95 470 95 480 170 490 240 450 340 300 410Z" fill="#f0b0a3" stroke="#a03a2c" strokeWidth="6" />
                <path d="M300 135V375" stroke="#a03a2c" strokeWidth="14" />
                <path d="M135 225H465" stroke="#a03a2c" strokeWidth="7" strokeDasharray="42 26" />
                <text x="205" y="150" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">ডান অলিন্দ</text>
                <text x="395" y="150" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">বাম অলিন্দ</text>
                <text x="215" y="285" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">ডান নিলয়</text>
                <text x="385" y="285" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">বাম নিলয়</text>
                <ellipse cx="540" cy="85" rx="50" ry="62" fill="#e6a3b5" opacity="0.45" />
                <text x="540" y="160" textAnchor="middle" className="svg-label" fontSize="14">ফুসফুস</text>
                <g style={{ transform: `translate(${step.at[0]}px, ${step.at[1]}px)`, transition: 'transform 1.1s ease-in-out' }}>
                  <circle r="16" fill={step.blue ? blue : red} stroke="#fff" strokeWidth="3" style={{ transition: 'fill 1s' }} />
                </g>
              </svg>
              <StepNav steps={steps} />
            </>
          }
          side={
            <>
              <div className="panel" aria-live="polite">
                <h3>{step.name}</h3>
                <span className="tag">{step.blue ? 'অক্সিজেনহীন রক্ত' : 'অক্সিজেনযুক্ত রক্ত'}</span>
                <p>{step.text}</p>
              </div>
              <p className="fb">ছবিতে হৃৎপিণ্ড সামনে থেকে দেখা, তাই দেহের ডান পাশ ছবির বাম দিকে। নীল রঙ শুধু বোঝানোর জন্য, আসল রক্ত লালই।</p>
            </>
          }
        />
      )}
    </Stage>
  );
}

export function BpLab() {
  const [who, setWho] = useState(0);
  const [cuff, setCuff] = useState(190);
  const [running, setRunning] = useState(false);
  const [top, setTop] = useState<number | null>(null);
  const [bottom, setBottom] = useState<number | null>(null);
  const patient = BP_PATIENTS[who];
  const sounding = cuff <= patient.sys && cuff >= patient.dia;

  useTick(
    () =>
      setCuff((c) => {
        if (c <= 50) {
          setRunning(false);
          return c;
        }
        return c - 1;
      }),
    90,
    running,
  );

  const reset = (i = who) => {
    setWho(i);
    setCuff(190);
    setRunning(false);
    setTop(null);
    setBottom(null);
  };

  const done = top !== null && bottom !== null;
  const errorSmall = done && Math.abs(top - patient.sys) <= 4 && Math.abs(bottom - patient.dia) <= 4;

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 560 340" role="img" aria-label={`কাফের চাপ ${bn(cuff)} মিলিমিটার পারদ`} style={{ background: '#16292c' }}>
            <circle cx="280" cy="170" r="140" fill="#f7f3e6" stroke="#8f8b6d" strokeWidth="10" />
            {[60, 100, 140, 180].map((v) => {
              const a = ((v - 40) / 160) * 1.6 * Math.PI - 1.3 * Math.PI;
              return <text key={v} x={280 + Math.cos(a) * 108} y={170 + Math.sin(a) * 108 + 5} textAnchor="middle" fontSize="16" fill="#20302a">{bn(v)}</text>;
            })}
            <line x1="280" y1="170" x2={280 + Math.cos(((cuff - 40) / 160) * 1.6 * Math.PI - 1.3 * Math.PI) * 118} y2={170 + Math.sin(((cuff - 40) / 160) * 1.6 * Math.PI - 1.3 * Math.PI) * 118} stroke="#c9472f" strokeWidth="5" strokeLinecap="round" />
            <circle cx="280" cy="170" r="10" fill="#20302a" />
            <text x="280" y="240" textAnchor="middle" fontSize="28" fontWeight="700" fill="#20302a">{bn(cuff)}</text>
            {sounding && running && <text x="470" y="60" className="svg-label" fontSize="22">লাব...ডাব</text>}
          </svg>
        }
        side={
          <>
            <div className="toggle-row">
              {BP_PATIENTS.map((p, i) => (
                <button key={p.name} type="button" className="chip-btn" aria-pressed={i === who} onClick={() => reset(i)}>{p.name}, {bn(p.age)} বছর</button>
              ))}
            </div>
            <div className="panel">
              <h4>স্ফিগমোম্যানোমিটারে রক্তচাপ মাপো</h4>
              <p>চাপ কমতে থাকলে স্টেথোস্কোপে শব্দ শোনো। প্রথম শব্দে “সিস্টোলিক”, শব্দ মিলিয়ে গেলে “ডায়াস্টোলিক” চাপো।</p>
            </div>
            <div className="stepnav" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-hot" disabled={running} onClick={() => { reset(); setRunning(true); }}>▶ কাফ ফোলাও, চাপ ছাড়ো</button>
              <button type="button" className="btn btn-lab" disabled={!running || top !== null} onClick={() => setTop(cuff)}>সিস্টোলিক</button>
              <button type="button" className="btn btn-lab" disabled={!running || top === null || bottom !== null} onClick={() => { setBottom(cuff); setRunning(false); }}>ডায়াস্টোলিক</button>
            </div>
            {done && (
              <div className="panel" role="status">
                <h3>তোমার মাপ: {bn(top)}/{bn(bottom)} মি.মি. পারদ</h3>
                <p>{errorSmall ? 'মাপ প্রায় নির্ভুল।' : `প্রকৃত মান ${bn(patient.sys)}/${bn(patient.dia)}। শব্দ শুরু ও শেষের মুহূর্তটি ধরো।`}</p>
                <span className="tag">{bpBand(top, bottom)}</span>
              </div>
            )}
            <p className="fb">বইয়ের মতে আদর্শ চাপ প্রায় ১২০/৮০, আর ১৪০/৯০-এর বেশি হলে উচ্চ রক্তচাপ। মাপার আগে রোগীকে শান্তভাবে বসিয়ে রাখতে হয়।</p>
          </>
        }
      />
    </Stage>
  );
}

const SERA = [
  { id: 'A' as const, name: 'অ্যান্টি-A' },
  { id: 'B' as const, name: 'অ্যান্টি-B' },
  { id: 'D' as const, name: 'অ্যান্টি-D (Rh)' },
];

function Drop({ clumped, shown }: { clumped: boolean; shown: boolean }) {
  const cells = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ a: i * 2.4, r: 8 + ((i * 37) % 30) })), []);
  return (
    <svg viewBox="0 0 110 110" width="110" height="110" aria-label={shown ? (clumped ? 'দলা বেঁধেছে' : 'দলা বাঁধেনি') : 'রিএজেন্ট দেওয়া হয়নি'}>
      <circle cx="55" cy="55" r="50" fill="#f4e8d8" stroke="#a88a6a" />
      {cells.map((c, i) => {
        const spread = shown && clumped ? 0.45 : 1;
        const group = shown && clumped ? (i % 3) * 18 - 18 : 0;
        return <circle key={i} cx={55 + group + Math.cos(c.a) * c.r * spread} cy={55 + group * 0.5 + Math.sin(c.a) * c.r * spread} r="4.5" fill="#c93a32" style={{ transition: 'all .6s' }} />;
      })}
    </svg>
  );
}

export function BloodLab() {
  const [mode, setMode] = useState<'type' | 'chart'>('type');
  const [deck, setDeck] = useState<BloodGroup[]>(() => shuffle(ALL_GROUPS));
  const [i, setI] = useState(0);
  const [tested, setTested] = useState<Set<string>>(new Set());
  const [guess, setGuess] = useState<string | null>(null);
  const [donor, setDonor] = useState(ALL_GROUPS[0]);
  const [recipient, setRecipient] = useState(ALL_GROUPS[3]);
  const sample = deck[i % deck.length];
  const name = groupName(sample);
  const safe = canGive(donor, recipient);
  const allTested = tested.size === 3;

  const nextPatient = () => {
    if (i + 1 >= deck.length) setDeck(shuffle(ALL_GROUPS));
    setI(i + 1);
    setTested(new Set());
    setGuess(null);
  };

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="ল্যাবের ধরন" value={mode} onChange={setMode} options={[{ value: 'type', label: 'রক্তের গ্রুপ নির্ণয়' }, { value: 'chart', label: 'দাতা-গ্রহীতা ছক' }]} />
      </div>
      {mode === 'type' ? (
        <LabGrid
          view={
            <div className="panel">
              <h4>রোগী {bn(i + 1)}: স্লাইডে তিন ফোঁটা রক্ত, প্রতিটিতে একটি করে রিএজেন্ট দাও</h4>
              <div className="toggle-row" style={{ justifyContent: 'space-around' }}>
                {SERA.map((s) => (
                  <div key={s.id} style={{ textAlign: 'center' }}>
                    <Drop clumped={clumps(sample, s.id)} shown={tested.has(s.id)} />
                    <button type="button" className="chip-btn" aria-pressed={tested.has(s.id)} onClick={() => setTested(new Set(tested).add(s.id))}>{s.name}</button>
                  </div>
                ))}
              </div>
            </div>
          }
          side={
            <>
              <div className="panel">
                <p>রিএজেন্টের অ্যান্টিবডি মিলে গেলে লোহিত কণিকা দলা বাঁধে। দলা বাঁধা মানে ওই অ্যান্টিজেন আছে।</p>
              </div>
              <div className="chips">
                {ALL_GROUPS.map((g) => (
                  <button key={groupName(g)} type="button" className="chip-btn" disabled={!allTested || guess === name} onClick={() => setGuess(groupName(g))}>
                    {groupName(g)}
                  </button>
                ))}
              </div>
              {!allTested && <p className="fb">আগে তিনটি পরীক্ষাই শেষ করো।</p>}
              {guess && (
                <p className={guess === name ? 'fb fb-ok' : 'fb fb-no'} role="status">
                  {guess === name ? `ঠিক! এই রোগীর গ্রুপ ${name}।` : 'মেলেনি। কোন ফোঁটায় দলা বেঁধেছে আবার দেখো।'}
                </p>
              )}
              {guess === name && <button type="button" className="btn btn-hot" onClick={nextPatient}>পরের রোগী →</button>}
            </>
          }
        />
      ) : (
        <LabGrid
          view={
            <div className="table-wrap">
              <table className="matrix">
                <caption>দাতা (পাশে) ও গ্রহীতা (ওপরে)</caption>
                <thead>
                  <tr><th aria-hidden="true"></th>{ALL_GROUPS.map((g) => <th key={groupName(g)}>{groupName(g)}</th>)}</tr>
                </thead>
                <tbody>
                  {ALL_GROUPS.map((d) => (
                    <tr key={groupName(d)}>
                      <th>{groupName(d)}</th>
                      {ALL_GROUPS.map((r) => {
                        const ok = canGive(d, r);
                        const active = d === donor && r === recipient;
                        return (
                          <td key={groupName(r)}>
                            <button type="button" className={`${ok ? 'cell-ok' : 'cell-no'}${active ? ' active' : ''}`} aria-label={`${groupName(d)} থেকে ${groupName(r)}: ${ok ? 'দেওয়া যায়' : 'দেওয়া যায় না'}`} onClick={() => { setDonor(d); setRecipient(r); }}>
                              {ok ? '✓' : '✗'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
          side={
            <div className="panel" aria-live="polite">
              <h3>{groupName(donor)} থেকে {groupName(recipient)}: {safe ? 'দেওয়া যায়' : 'দেওয়া যায় না'}</h3>
              <p style={{ color: safe ? '#8fe3b1' : '#ffb199' }}>
                {safe ? 'দাতার কণিকার অ্যান্টিজেন গ্রহীতার দেহে অপরিচিত নয়।' : 'গ্রহীতার দেহ দাতার কণিকার অ্যান্টিজেনকে শত্রু ধরবে; কণিকা দলা বেঁধে প্রাণঘাতী হতে পারে।'}
              </p>
              <p className="panel-note">লক্ষ করো: O− সব ঘরে ✓, AB+ সব সারিতে ✓। তবে বাস্তবে সর্বজনীন দাতা বলে কিছু নেই: ক্রস ম্যাচিং ও জীবাণু স্ক্রিনিং ছাড়া রক্ত দেওয়া হয় না।</p>
            </div>
          }
        />
      )}
    </Stage>
  );
}
