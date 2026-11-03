import { useState } from 'react';
import { LabGrid, MiniChart, PredictBox, Range, Seg, Stage, Stat, StepNav, useSteps, useTick, type Scenario } from '../../../components/labkit';
import { bn, clamp, shuffle } from '../../../core/util';
import { DAY_PLANTS, REFLEX_ARC, flowers, glucoseDay, lowest, peak, reflex, signalMs, type DayPlant, type Lesion, type Pancreas, type SugarState } from './models/body';
import { INIT, SCENARIOS } from './models/scenarios';

interface Shoot {
  lightX: number;
  tip: boolean;
  capped: boolean;
}

const SHOOT: Shoot = { lightX: 80, tip: true, capped: false };
const bendTarget = (s: Shoot) => (s.tip && !s.capped ? clamp((s.lightX - 50) / 50, -1, 1) : 0);

const TROPISM: Scenario<Shoot>[] = [
  { id: 'cut', title: 'অগ্রভাগ কেটে ফেলা', set: { tip: false }, ask: 'কাণ্ডের অগ্রভাগ কেটে পাশ থেকে আলো দিলে কী হবে?', options: ['আলোর দিকে বাঁকবে', 'বাঁকবে না', 'আলোর উল্টো দিকে বাঁকবে'], answer: 1, why: 'অক্সিন তৈরি হয় অগ্রভাগে। উৎস নেই, তাই অসম বৃদ্ধিও নেই।', proves: (s) => bendTarget(s) === 0 },
  { id: 'cap', title: 'অগ্রভাগে কালো ঢাকনা', set: { capped: true }, ask: 'অগ্রভাগ কালো কাগজে ঢাকলে কী হবে?', options: ['আলোর দিকে বাঁকবে', 'বাঁকবে না', 'মরে যাবে'], answer: 1, why: 'আলোর সংকেত ধরে অগ্রভাগ। ডারউইনের কোলিওপটাইল পরীক্ষার মূল সিদ্ধান্ত এটিই।', proves: (s) => bendTarget(s) === 0 },
  { id: 'left', title: 'আলো বাম দিকে', set: { lightX: 10 }, ask: 'আলো বাম দিকে নিলে অক্সিন কোন পাশে জমবে?', options: ['বাম পাশে', 'ডান পাশে (ছায়ায়)', 'সমানভাবে'], answer: 1, why: 'অক্সিন ছায়ার দিকে জমে, ওই পাশের কোষ বেশি লম্বা হয়, তাই কাণ্ড আলোর দিকে ঝোঁকে।', proves: (s) => bendTarget(s) < 0 },
];

export function TropismLab() {
  const [s, setS] = useState<Shoot>(SHOOT);
  const [bend, setBend] = useState(0);
  const target = bendTarget(s);

  useTick(() => {
    setBend((b) => {
      const d = target - b;
      return Math.abs(d) < 0.01 ? target : b + d * 0.05;
    });
  }, 60);

  const topX = 300 + bend * 130;
  const topY = 170 + Math.abs(bend) * 22;
  const ctrlX = 300 + bend * 20;
  const sunX = 60 + (s.lightX / 100) * 480;
  const shadeSide = target > 0 ? -1 : 1;
  const on = (k: number) => ({
    x: (1 - k) ** 2 * 300 + 2 * (1 - k) * k * ctrlX + k ** 2 * topX,
    y: (1 - k) ** 2 * 380 + 2 * (1 - k) * k * 260 + k ** 2 * topY,
  });

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 600 440" role="img" aria-label="আলোর দিকে গাছের বেঁকে যাওয়া" style={{ background: '#16292c' }}>
            <circle cx={sunX} cy="46" r="30" fill="#f8c63f" />
            <rect y="380" width="600" height="60" fill="#6a4a2e" />
            <path d="M300 380C300 420 260 425 240 436M300 380C302 420 345 425 360 436M300 380V438" stroke="#e8d7b8" strokeWidth="6" fill="none" />
            <path d={`M300 380Q${ctrlX} 260 ${topX} ${topY}`} fill="none" stroke="#4fae72" strokeWidth="24" strokeLinecap={s.tip ? 'round' : 'butt'} />
            {s.tip && (
              <g transform={`translate(${topX} ${topY}) rotate(${bend * 40})`}>
                <path d="M0 0C28-20 74-18 92-4 66 12 26 14 0 0Z" fill="#3f9f5e" />
                <path d="M0 0C-28-20-74-18-92-4-66 12-26 14 0 0Z" fill="#3f9f5e" />
                {s.capped && <path d="M-22 6Q0-46 22 6Z" fill="#15171a" />}
              </g>
            )}
            {Math.abs(target) > 0.15 &&
              [0.25, 0.42, 0.6, 0.78].flatMap((k) => [0, 1].map((n) => {
                const p = on(k);
                return <circle key={`${k}${n}`} cx={p.x + shadeSide * (8 + n * 6)} cy={p.y + n * 8} r="5" fill="#ffd166" stroke="#7a5a10" strokeWidth="1" />;
              }))}
          </svg>
        }
        side={
          <>
            <Range label="আলোর অবস্থান" value={s.lightX} min={0} max={100} display={s.lightX < 45 ? 'বামে' : s.lightX > 55 ? 'ডানে' : 'ওপরে'} onChange={(lightX) => setS({ ...s, lightX })} />
            <div className="toggle-row">
              <button type="button" className="chip-btn" aria-pressed={!s.tip} onClick={() => setS({ ...s, tip: !s.tip })}>অগ্রভাগ কাটা</button>
              <button type="button" className="chip-btn" aria-pressed={s.capped} onClick={() => setS({ ...s, capped: !s.capped })}>অগ্রভাগ ঢাকা</button>
            </div>
            <div className="panel" aria-live="polite">
              <h3>{target ? 'অক্সিনের খেলা' : 'গাছ বাঁকছে না'}</h3>
              <p>{target ? 'হলুদ বিন্দু অক্সিন। অক্সিন অগ্রভাগে তৈরি হয়ে ছায়ার দিকে জমে, ওই পাশের কোষ বেশি লম্বা হয়।' : 'দুই পাশে বৃদ্ধি সমান, তাই কাণ্ড সোজা উঠছে।'}</p>
            </div>
            <PredictBox scenarios={TROPISM} onRun={(set) => setS({ ...SHOOT, ...set })} />
          </>
        }
      />
    </Stage>
  );
}

const REFLEX = [
  { name: 'উদ্দীপনা', at: [70, 340], text: 'আঙুলে সুচ বা গরম বস্তু লাগল। ত্বকের গ্রাহক তা শনাক্ত করল।' },
  { name: 'সংবেদী নিউরন', at: [240, 250], text: 'তাড়না সংবেদী নিউরন দিয়ে মেরুরজ্জুর ধূসর অংশে যায়।' },
  { name: 'সংযোগকারী নিউরন', at: [430, 190], text: 'মেরুরজ্জুর ভেতরের এই মধ্যবর্তী নিউরন তাড়নাকে আজ্ঞাবাহী নিউরনে দেয়। মস্তিষ্কের নির্দেশ লাগে না।' },
  { name: 'আজ্ঞাবাহী নিউরন', at: [280, 170], text: 'তাড়না আজ্ঞাবাহী নিউরন দিয়ে পেশিতে যায়।' },
  { name: 'কারক পেশি', at: [150, 165], text: 'পেশি সংকুচিত হয়ে হাত সরিয়ে নেয়, ব্যথা বোঝার আগেই।' },
  { name: 'মস্তিষ্কে খবর', at: [440, 50], text: 'এরপর তাড়না মস্তিষ্কে পৌঁছায়, তখন ব্যথা অনুভব হয়।' },
];

const LESION_TEXT: Record<Lesion, string> = {
  none: 'সব পথ ঠিক আছে।',
  sensory: 'সংবেদী নিউরন কাটা: খবর যায়ই না, তাই নড়ে না, ব্যথাও নেই।',
  relay: 'সংযোগকারী নিউরন কাটা: প্রতিবর্তী পথ ভাঙা, তবে অন্য পথে মস্তিষ্ক খবর পায়। ব্যথা আছে, হাত সরে না।',
  motor: 'আজ্ঞাবাহী নিউরন কাটা: ব্যথা টের পায়, কিন্তু পেশি নির্দেশ পায় না।',
  upward: 'মস্তিষ্কগামী পথ কাটা: হাত সরে যায়, কিন্তু ব্যথা বোঝে না। প্রতিবর্তী ক্রিয়ায় মস্তিষ্ক লাগে না, এটিই তার প্রমাণ।',
};

export function ReflexLab() {
  const [mode, setMode] = useState<'watch' | 'mystery'>('watch');
  const steps = useSteps(REFLEX.length, 1800);
  const [path, setPath] = useState(1.5);
  const step = REFLEX[steps.index];
  const withdrawn = steps.index >= 4;

  const [cases, setCases] = useState<Lesion[]>(() => shuffle(['sensory', 'relay', 'motor', 'upward', 'none'] as Lesion[]));
  const [i, setI] = useState(0);
  const [tested, setTested] = useState(false);
  const [answer, setAnswer] = useState<Lesion | null>(null);
  const hidden = cases[i % cases.length];
  const result = reflex(hidden);

  const nextCase = () => {
    if (i + 1 >= cases.length) setCases(shuffle(cases));
    setI(i + 1);
    setTested(false);
    setAnswer(null);
  };

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="ল্যাবের ধরন" value={mode} onChange={setMode} options={[{ value: 'watch', label: 'তাড়নার পথ দেখো' }, { value: 'mystery', label: 'কোন স্নায়ু কাটা?' }]} />
      </div>
      {mode === 'watch' ? (
        <LabGrid
          view={
            <>
              <svg viewBox="0 0 560 400" role="img" aria-label={`প্রতিবর্তী চক্র: ${step.name}`} style={{ background: '#16292c' }}>
                <rect x="30" y="360" width="90" height="26" rx="4" fill="#d9513c" />
                <text x="75" y="378" textAnchor="middle" className="svg-label" fontSize="13">গরম</text>
                <g style={{ transform: withdrawn ? 'translateY(-70px)' : 'none', transition: 'transform .4s ease' }}>
                  <path d="M70 345C100 300 170 280 240 260" stroke="#e7b48f" strokeWidth="30" strokeLinecap="round" fill="none" />
                </g>
                <rect x="412" y="120" width="36" height="240" rx="16" fill="#e6dfc5" opacity="0.6" />
                <path d="M240 250C290 240 380 230 424 200" stroke="#3a8fb7" strokeWidth="6" fill="none" />
                <path d="M424 200L436 180" stroke="#6fd09a" strokeWidth="8" strokeLinecap="round" />
                <path d="M436 180C380 160 260 150 150 165" stroke="#e4572e" strokeWidth="6" fill="none" />
                <path d="M430 190V60" stroke="#c9a14d" strokeWidth="6" strokeDasharray="8 6" fill="none" />
                <ellipse cx="440" cy="50" rx="70" ry="38" fill="#e6a3b5" />
                <text x="440" y="56" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">মস্তিষ্ক</text>
                <text x="505" y="270" textAnchor="middle" className="svg-label" fontSize="13">মেরুরজ্জু</text>
                <g style={{ transform: `translate(${step.at[0]}px, ${step.at[1]}px)`, transition: 'transform .9s ease-in-out' }}>
                  <circle className="pulse" r="12" fill="#ffd166" stroke="#fff" strokeWidth="3" />
                </g>
              </svg>
              <StepNav steps={steps} />
            </>
          }
          side={
            <>
              <div className="panel" aria-live="polite">
                <h4>ধাপ {bn(steps.index + 1)}</h4>
                <h3>{step.name}</h3>
                <p>{step.text}</p>
              </div>
              <Range label="পথের দৈর্ঘ্য" value={path} min={0.5} max={3} step={0.1} display={`${bn(path)} মিটার`} onChange={setPath} />
              <Stat label="তাড়না পৌঁছাতে সময়" value={`${bn(signalMs(path), 0)} মি.সে.`} />
              <p className="fb">বইয়ের হিসাবে স্নায়ু তাড়নার গতি সেকেন্ডে প্রায় ১০০ মিটার। ব্যথা বুঝে সিদ্ধান্ত নিতে অনেক বেশি সময় লাগত; প্রতিবর্তী ক্রিয়া সেই সময় বাঁচায়।</p>
            </>
          }
        />
      ) : (
        <div className="panel">
          <h3>রোগী {bn(i + 1)}: কোন স্নায়ু ক্ষতিগ্রস্ত?</h3>
          <p>আঙুলে হালকা উদ্দীপনা দাও, লক্ষণ দেখে ক্ষতির জায়গা ঠিক করো।</p>
          <button type="button" className="btn btn-hot" onClick={() => setTested(true)}>🖐 উদ্দীপনা দাও</button>
          {tested && (
            <>
              <p role="status">
                হাত সরল: <strong>{result.moves ? 'হ্যাঁ' : 'না'}</strong> &nbsp;·&nbsp; ব্যথা টের পেল: <strong>{result.feels ? 'হ্যাঁ' : 'না'}</strong>
              </p>
              <div className="chips">
                {[...REFLEX_ARC, { id: 'none' as Lesion, name: 'কোনো ক্ষতি নেই' }].map((a) => (
                  <button key={a.id} type="button" className="chip-btn" disabled={answer === hidden} onClick={() => setAnswer(a.id)}>{a.name}</button>
                ))}
              </div>
            </>
          )}
          {answer && (
            <p className={answer === hidden ? 'fb fb-ok' : 'fb fb-no'} role="status">
              {answer === hidden ? `ঠিক! ${LESION_TEXT[hidden]}` : 'মেলেনি। দুটি লক্ষণ একসাথে ভাবো: নড়াচড়া আর অনুভূতি কোন পথে যায়?'}
            </p>
          )}
          {answer === hidden && <button type="button" className="btn btn-lab" style={{ marginTop: 8 }} onClick={nextCase}>পরের রোগী →</button>}
        </div>
      )}
    </Stage>
  );
}

const PANCREAS: { value: Pancreas; label: string }[] = [
  { value: 'healthy', label: 'সুস্থ' },
  { value: 'type2', label: 'টাইপ-২' },
  { value: 'type1', label: 'টাইপ-১' },
];

export function SugarLab() {
  const [s, setS] = useState<SugarState>(INIT.sugar);
  const points = glucoseDay(s);
  const high = peak(points);
  const low = lowest(points);
  const flip = (key: 'meal' | 'walk' | 'injection', label: string) => (
    <button type="button" className="chip-btn" aria-pressed={s[key]} onClick={() => setS({ ...s, [key]: !s[key] })}>{label}</button>
  );

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="অগ্ন্যাশয়" value={s.pancreas} onChange={(pancreas) => setS({ ...s, pancreas })} options={PANCREAS} />
      </div>
      <LabGrid
        view={<MiniChart title="বারো ঘণ্টায় রক্তের গ্লুকোজ" points={points} xLabel="খাবারের পর ঘণ্টা" yUnit="মি.মোল/লি." yMax={25} zones={[{ from: 4, to: 7.8, label: 'স্বাভাবিকের কাছাকাছি', color: '#6fd09a' }, { from: 0, to: 4, label: 'খুব কম', color: '#ff6b5b' }]} />}
        side={
          <>
            <div className="toggle-row">
              {flip('meal', 'খাবার')}
              {flip('walk', 'হাঁটা')}
              {flip('injection', 'ইনসুলিন ইনজেকশন')}
            </div>
            <div className="stats">
              <Stat label="সর্বোচ্চ" value={bn(high, 1)} />
              <Stat label="সর্বনিম্ন" value={bn(low, 1)} />
            </div>
            <p className="fb" aria-live="polite">
              {low < 4 ? 'গ্লুকোজ বিপজ্জনকভাবে কম! রোগী সচেতন থাকলে চিনির পানি দিতে হয়।' : high > 11 ? 'গ্লুকোজ অনেক বেশি। ইনসুলিন ছাড়া গ্লুকোজ কোষে ঢুকতে পারছে না।' : 'ইনসুলিন গ্লুকোজ কমায়, গ্লুকাগন বাড়ায়: দুই হরমোন মিলে মাত্রা ঠিক রাখে।'}
            </p>
            <PredictBox scenarios={SCENARIOS.sugar} onRun={(set) => setS({ ...INIT.sugar, ...set })} />
            <p className="fb">লেখচিত্রটি শেখার মডেল, চিকিৎসার হিসাব নয়। ডাক্তারের পরামর্শ ছাড়া ঔষধ বদলানো যাবে না।</p>
          </>
        }
      />
    </Stage>
  );
}

const SEASONS = [
  { hours: 10.5, name: 'শীতের দিন' },
  { hours: 13.5, name: 'গরমের দিন' },
];

export function DayLab() {
  const [plant, setPlant] = useState<DayPlant>('short');
  const [hours, setHours] = useState(10.5);
  const p = DAY_PLANTS[plant];
  const blooms = flowers(plant, hours);

  return (
    <Stage>
      <div className="stage-bar">
        <Seg<DayPlant> label="উদ্ভিদ" value={plant} onChange={setPlant} options={(Object.keys(DAY_PLANTS) as DayPlant[]).map((k) => ({ value: k, label: DAY_PLANTS[k].plant }))} />
      </div>
      <LabGrid
        view={
          <svg viewBox="0 0 520 300" role="img" aria-label={`${p.plant}: ${blooms ? 'ফুল ফুটেছে' : 'ফুল ফোটেনি'}`} style={{ background: '#16292c' }}>
            <rect x="20" y="20" width="480" height="24" rx="6" fill="#101c34" />
            <rect x="20" y="20" width={(hours / 24) * 480} height="24" rx="6" fill="#f8c63f" />
            <text x="260" y="66" textAnchor="middle" className="svg-label" fontSize="14">{bn(hours)} ঘণ্টা আলো · {bn(24 - hours)} ঘণ্টা অন্ধকার</text>
            <rect y="260" width="520" height="40" fill="#5a3d28" />
            <path d="M260 260V120" stroke="#3f7a44" strokeWidth="9" />
            {[220, 180, 150].map((y) => [-1, 1].map((d) => <path key={`${y}${d}`} d={`M260 ${y}q${d * 30} -24 ${d * 70} -6q${d * -34} 22 ${d * -70} 6Z`} fill="#3f9f5e" />))}
            {blooms ? [0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={a} cx="260" cy="88" rx="11" ry="28" fill="#f3c33c" transform={`rotate(${a} 260 112)`} />) : <circle cx="260" cy="115" r="10" fill="#6a9a58" />}
            {blooms && <circle cx="260" cy="112" r="15" fill="#a8641f" />}
          </svg>
        }
        side={
          <>
            <Range label="দিনে আলোর ঘণ্টা" value={hours} min={4} max={18} step={0.5} display={`${bn(hours)} ঘণ্টা`} onChange={setHours} />
            <div className="toggle-row">
              {SEASONS.map((x) => <button key={x.name} type="button" className="chip-btn" aria-pressed={hours === x.hours} onClick={() => setHours(x.hours)}>{x.name}</button>)}
            </div>
            <div className="panel" aria-live="polite">
              <h3>{p.name}</h3>
              <span className="tag">{p.range}</span>
              <p style={{ color: blooms ? '#8fe3b1' : '#ffb199' }}>{blooms ? 'ফুল ফুটেছে।' : 'ফুল ফোটেনি।'}</p>
            </div>
            <p className="fb">চন্দ্রমল্লিকা শীতে ফোটে কেন, এখন বলতে পারবে? আলোর এই ছন্দে সাড়া দেওয়াকে ফটোপিরিয়ডিজম বলে।</p>
          </>
        }
      />
    </Stage>
  );
}
