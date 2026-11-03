import { useState } from 'react';
import { LabGrid, Meter, MiniChart, PredictBox, Range, Seg, Stage, Stat, StepNav, useSteps, useTick, type Scenario } from '../../../components/labkit';
import { bn, lerp } from '../../../core/util';
import { FRACTURE_RISK, JOINTS, SOLUTES, boneAt, dialysis, nephron, oxygenCarried, type BoneState, type DialysisState, type GasState, type Joint, type KidneyState } from './models/body';
import { gasBalance, type GasDayState } from './models/life';
import { INIT, SCENARIOS } from './models/scenarios';

export function BreathLab() {
  const [breath, setBreath] = useState(0.2);
  const [auto, setAuto] = useState(false);
  const [phase, setPhase] = useState(1);
  const [asthma, setAsthma] = useState(false);
  const pace = asthma ? 0.009 : 0.022;

  useTick(() => {
    setBreath((b) => {
      const next = b + phase * pace;
      if (next >= 1) setPhase(-1);
      if (next <= 0) setPhase(1);
      return Math.min(1, Math.max(0, next));
    });
  }, 40, auto);

  const inhaling = breath > 0.5;
  const lungScale = lerp(0.82, 1.14, asthma ? 0.25 + breath * 0.5 : breath);
  const diaphragmY = lerp(350, 400, breath);
  const curve = lerp(305, 395, breath);
  const airway = asthma ? 6 : 14;

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 600 460" role="img" aria-label="শ্বাসক্রিয়ার মডেল" style={{ background: '#16292c' }}>
            <path d="M300 10V110" stroke="#c9dbe0" strokeWidth="22" strokeLinecap="round" />
            <path d="M300 10V110" stroke="#16292c" strokeWidth="12" strokeLinecap="round" />
            <path d="M300 105L225 165M300 105L375 165" stroke="#c9dbe0" strokeWidth={airway + 6} strokeLinecap="round" />
            <path d="M300 105L225 165M300 105L375 165" stroke="#16292c" strokeWidth={airway - 2} strokeLinecap="round" />
            <g transform="translate(300 225)">
              {[-1, 1].map((side) => (
                <path key={side} d="M14-110C60-110 120-60 130 20 136 80 110 100 70 86 40 76 18 60 14 40Z" fill="#e88f9e" stroke="#a33c55" strokeWidth="4" transform={`scale(${side * lungScale} ${lungScale})`} />
              ))}
            </g>
            <path d={`M90 ${diaphragmY}Q300 ${curve} 510 ${diaphragmY}`} fill="none" stroke="#d1913b" strokeWidth="13" strokeLinecap="round" />
            {[-1, 1].map((side) => (
              <g key={side} stroke="#e6dfc5" strokeWidth="9" fill="none" strokeLinecap="round">
                {[120, 170, 220, 270, 320].map((y) => (
                  <path key={y} d={`M300 ${y - 40}Q${300 + side * (lerp(175, 215, breath) + 12)} ${y - 26} ${300 + side * lerp(195, 225, breath)} ${y + 20}`} opacity="0.55" />
                ))}
              </g>
            ))}
            {[285, 300, 315].map((x, i) => (
              <circle key={x} r="6" fill={inhaling ? '#bfe9ff' : '#ffb199'}>
                <animateMotion dur={asthma ? '4s' : '1.8s'} repeatCount="indefinite" begin={`${-i * 0.6}s`} path={inhaling ? `M${x} 0L${x} 130` : `M${x} 130L${x} 0`} />
              </circle>
            ))}
            <text x="300" y="442" textAnchor="middle" className="svg-label">মধ্যচ্ছদা</text>
          </svg>
        }
        side={
          <>
            <Range label="মধ্যচ্ছদা টানো" value={breath} min={0} max={1} step={0.01} display={inhaling ? 'প্রশ্বাস' : 'নিঃশ্বাস'} onChange={(v) => { setAuto(false); setBreath(v); }} />
            <div className="stepnav" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-hot" onClick={() => setAuto(!auto)}>{auto ? '⏸ থামাও' : '▶ নিজে নিজে শ্বাস নিক'}</button>
              <button type="button" className="btn btn-lab" aria-pressed={asthma} onClick={() => setAsthma(!asthma)}>{asthma ? 'স্বাভাবিক করো' : 'হাঁপানি দেখো'}</button>
            </div>
            <div className="panel" aria-live="polite">
              <h3>{inhaling ? 'প্রশ্বাস' : 'নিঃশ্বাস'}</h3>
              <p>
                {inhaling
                  ? 'মধ্যচ্ছদা সংকুচিত হয়ে নিচে নামে, পাঁজর ওপরে ওঠে। বক্ষগহ্বর বড় হয়, ফুসফুসের চাপ বাইরের চেয়ে কমে, তাই বাতাস নিজে থেকে ঢোকে।'
                  : 'মধ্যচ্ছদা শিথিল হয়ে ওপরে ওঠে, পাঁজর নামে। বক্ষগহ্বর ছোট হয়, চাপ বাড়ে, বাতাস বেরিয়ে যায়।'}
              </p>
              <Meter label="ফুসফুসের আয়তন" value={asthma ? 0.25 + breath * 0.5 : breath} color="#e88f9e" />
              <p className="panel-note">ফুসফুসের চাপ: {inhaling ? 'বাইরের চেয়ে কম' : 'বাইরের চেয়ে বেশি'}</p>
            </div>
            {asthma && <p className="fb fb-no">হাঁপানিতে সরু শ্বাসনালি দিয়ে বাতাস ধীরে চলে। রোগী জোরে শ্বাস নিতে চেষ্টা করেন, অথচ বাতাস কম ঢোকে। এটি ছোঁয়াচে নয়।</p>}
          </>
        }
      />
    </Stage>
  );
}

const CLOUD_TIME = { air: 180, breath: 14 };

export function LimeLab() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [guess, setGuess] = useState<'air' | 'breath' | null>(null);

  useTick(
    () =>
      setSeconds((t) => {
        if (t >= 30) {
          setRunning(false);
          return t;
        }
        return t + 1;
      }),
    170,
    running,
  );

  const cloud = (kind: 'air' | 'breath') => Math.min(1, seconds / CLOUD_TIME[kind]);
  const tube = (x: number, kind: 'air' | 'breath', label: string) => (
    <g key={kind}>
      <path d={`M${x - 40} 60V330a40 40 0 0 0 80 0V60`} fill="none" stroke="#d6e8ef" strokeWidth="5" />
      <path d={`M${x - 37} 170V330a37 37 0 0 0 74 0V170Z`} fill={`rgb(${lerp(190, 238, cloud(kind))},${lerp(228, 238, cloud(kind))},${lerp(240, 235, cloud(kind))})`} />
      <line x1={x + 12} y1="10" x2={x + 12} y2="330" stroke="#a6bfb4" strokeWidth="6" />
      {running && [0, 1, 2].map((i) => (
        <circle key={i} r="5" fill="#fff" opacity="0.8">
          <animateMotion dur="1.2s" begin={`${-i * 0.4}s`} repeatCount="indefinite" path={`M${x + 12} 330L${x + 4} 180`} />
        </circle>
      ))}
      <text x={x} y="400" textAnchor="middle" className="svg-label" fontSize="14">{label}</text>
    </g>
  );

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 560 420" role="img" aria-label="চুনের পানির পরীক্ষা" style={{ background: '#16292c' }}>
            {tube(160, 'air', 'সিরিঞ্জে সাধারণ বাতাস')}
            {tube(400, 'breath', 'নিঃশ্বাসের বাতাস')}
          </svg>
        }
        side={
          <>
            <div className="panel">
              <h4>দুটি টেস্টটিউবে সমপরিমাণ চুনের পানি। কোনটি আগে ঘোলা হবে?</h4>
              <div className="option-stack">
                <button type="button" className="lab-option" aria-pressed={guess === 'air'} disabled={seconds > 0} onClick={() => setGuess('air')}>সাধারণ বাতাসের টিউব</button>
                <button type="button" className="lab-option" aria-pressed={guess === 'breath'} disabled={seconds > 0} onClick={() => setGuess('breath')}>নিঃশ্বাসের বাতাসের টিউব</button>
              </div>
              <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} disabled={!guess || running} onClick={() => { setSeconds(0); setRunning(true); }}>
                {guess ? '▶ ১৫ সেকেন্ড বাতাস চালাও' : 'আগে একটি বেছে নাও'}
              </button>
            </div>
            <Stat label="পার হওয়া সময়" value={`${bn(seconds)} সে.`} />
            {seconds >= 15 && (
              <div className="panel" role="status">
                <h3>{guess === 'breath' ? 'তোমার অনুমান ঠিক!' : 'অনুমান মেলেনি'}</h3>
                <p>নিঃশ্বাসের বাতাসে CO₂ অনেক বেশি। CO₂ চুনের পানির সাথে বিক্রিয়া করে অদ্রবণীয় ক্যালসিয়াম কার্বনেট বানায়, তাই পানি ঘোলা হয়।</p>
                <p style={{ color: '#ffd166' }}>এবার ভাবো: সাধারণ বাতাসের টিউবটি বাদ দিলে পরীক্ষাটি কী প্রমাণ করতে পারত না? সেটিই “নিয়ন্ত্রণ”-এর কাজ।</p>
              </div>
            )}
            <p className="fb">ঘোলা হওয়ার গতি দেখানোর জন্য সহজ করা হয়েছে। নিঃশ্বাস নেওয়ার সময় নল মুখ থেকে সরিয়ে নিতে হয়, যেন চুনের পানি মুখে না আসে।</p>
          </>
        }
      />
    </Stage>
  );
}

export function GasLab() {
  const [s, setS] = useState<GasState>(INIT.gas);
  const { loading, carried } = oxygenCarried(s);
  const wallPx = 6 + (s.wall - 1) * 18;
  const cells = Array.from({ length: 6 }, (_, i) => 90 + i * 76);
  const pale = s.hb < 0.8;

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 560 340" role="img" aria-label={`হিমোগ্লোবিন ${bn(Math.round(loading * 100))} শতাংশ ভরা`} style={{ background: '#16292c' }}>
            <rect width="560" height="150" fill="#cfe6ee" />
            <text x="20" y="30" className="svg-label svg-label-dark" fontSize="14">বায়ুথলি</text>
            <rect y={150} width="560" height={wallPx} fill="#e88f9e" />
            <rect y={150 + wallPx} width="560" height={190 - wallPx} fill="#5a2230" />
            <text x="20" y="325" className="svg-label" fontSize="14">কৈশিকনালির রক্ত</text>
            {Array.from({ length: Math.round(s.air / 3) }, (_, i) => (
              <circle key={i} r="7" fill="#7fd2ff">
                <animateMotion dur="2.4s" begin={`${-i * 0.35}s`} repeatCount="indefinite" path={`M${50 + i * 66} 40L${50 + i * 66} 240`} />
              </circle>
            ))}
            {cells.map((x, i) => {
              const filled = i / cells.length < loading;
              return <ellipse key={x} cx={x} cy="255" rx="32" ry="20" fill={filled ? (pale ? '#e58d80' : '#ff5a4a') : '#7a2c3a'} stroke="#2a0c12" strokeWidth="2" style={{ transition: 'fill .5s' }} />;
            })}
          </svg>
        }
        side={
          <>
            <Meter label="হিমোগ্লোবিন কতটা ভরেছে" value={loading} color="#ff7a6b" />
            <Meter label="রক্ত মোট কত O₂ বহন করছে" value={carried} color="#7fd2ff" />
            <Range label="বাতাসে অক্সিজেন" value={s.air} min={10} max={21} display={`${bn(s.air)}%`} onChange={(air) => setS({ ...s, air })} />
            <Range label="বায়ুথলির প্রাচীর" value={s.wall} min={1} max={3} step={0.1} display={s.wall > 1.5 ? 'পুরু, তরল জমা' : 'পাতলা'} onChange={(wall) => setS({ ...s, wall })} />
            <Range label="হিমোগ্লোবিন" value={s.hb} min={0.4} max={1} step={0.05} display={`${bn(Math.round(s.hb * 100))}%`} onChange={(hb) => setS({ ...s, hb })} />
            <PredictBox scenarios={SCENARIOS.gas} onRun={(set) => setS({ ...INIT.gas, ...set })} />
          </>
        }
      />
    </Stage>
  );
}

export function GasDayLab() {
  const [s, setS] = useState<GasDayState>(INIT.gasDay);
  const r = gasBalance(s);
  const out = r.net > 0 ? 'O₂ ছাড়ছে, CO₂ নিচ্ছে' : r.net < 0 ? 'CO₂ ছাড়ছে, O₂ নিচ্ছে' : 'বাইরের সাথে নিট আদান-প্রদান প্রায় নেই';

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 560 320" role="img" aria-label={`গাছ ${out}`} style={{ background: `rgb(${lerp(16, 130, s.light / 100)},${lerp(28, 200, s.light / 100)},${lerp(52, 235, s.light / 100)})` }}>
            <circle cx="90" cy="70" r="40" fill={s.light > 5 ? '#f8c63f' : '#c9cedb'} opacity={0.3 + s.light / 140} />
            <rect y="270" width="560" height="50" fill="#5a3d28" />
            <rect x="268" y="170" width="24" height="110" fill="#6a4a2e" />
            <ellipse cx="280" cy="125" rx="120" ry="85" fill="#3f9f5e" />
            {r.net !== 0 && [0, 1, 2, 3].map((i) => (
              <g key={i}>
                <circle r="16" fill={r.net > 0 ? '#bdeeff' : '#cfd6db'} />
                <text textAnchor="middle" y="5" fontSize="12" fontWeight="700" fill="#10201c">{r.net > 0 ? 'O₂' : 'CO₂'}</text>
                <animateMotion dur="3s" begin={`${-i * 0.75}s`} repeatCount="indefinite" path={`M${200 + i * 50} 120L${120 + i * 100} 10`} />
              </g>
            ))}
          </svg>
        }
        side={
          <>
            <Range label="আলোর পরিমাণ" value={s.light} min={0} max={100} step={5} display={`${bn(s.light)}%`} onChange={(light) => setS({ light })} />
            <Meter label="সালোকসংশ্লেষণ" value={r.photosynthesis / 10} color="#6fd09a" />
            <Meter label="শ্বসন (দিনরাত চলে)" value={r.respiration / 10} color="#ff9f6b" />
            <div className="panel" aria-live="polite"><h3>{out}</h3></div>
            <PredictBox scenarios={SCENARIOS.gasDay} onRun={(set) => setS({ ...INIT.gasDay, ...set })} />
          </>
        }
      />
    </Stage>
  );
}

const NEPHRON = [
  { name: 'রক্ত প্রবেশ', at: [120, 90], text: 'অ্যাফারেন্ট আর্টারিওল দিয়ে রক্ত গ্লোমেরুলাসে আসে।' },
  { name: 'ছাঁকন', at: [165, 130], text: 'চাপে পানি, গ্লুকোজ, লবণ ও ইউরিয়া বোম্যান্স ক্যাপসুলে ছেঁকে আসে। রক্তকণিকা ও বড় প্রোটিন আটকে থাকে।' },
  { name: 'নিকটবর্তী নালিকা', at: [305, 95], text: 'সব গ্লুকোজ, অ্যামিনো এসিড ও বেশির ভাগ পানি রক্তে ফেরে।' },
  { name: 'হেনলির লুপ', at: [390, 320], text: 'পানি ও লবণের শোষণ চলে, তরল ঘন হতে থাকে।' },
  { name: 'দূরবর্তী নালিকা', at: [470, 100], text: 'প্রয়োজন অনুযায়ী আরও পানি ও লবণ শোষিত হয়।' },
  { name: 'সংগ্রাহক নালিকা', at: [555, 330], text: 'বাকি তরল মূত্র হয়ে পেলভিস, ইউরেটার ও মূত্রাশয়ে যায়।' },
];

export function NephronLab() {
  const steps = useSteps(NEPHRON.length, 2800);
  const [s, setS] = useState<KidneyState>(INIT.kidney);
  const step = NEPHRON[steps.index];
  const n = nephron(s);
  const pale = 1 - Math.min(1, (n.strength - 0.5) / 1.5);
  const urine = `rgb(${lerp(205, 250, pale)}, ${lerp(150, 235, pale)}, ${lerp(30, 150, pale)})`;

  return (
    <Stage>
      <LabGrid
        view={
          <>
            <svg viewBox="0 0 620 420" role="img" aria-label={`নেফ্রন: ${step.name}`} style={{ background: '#16292c' }}>
              <path d="M20 90H130" stroke="#d9413a" strokeWidth="12" />
              <circle cx="165" cy="120" r="50" fill="#f4d9c2" stroke="#b58b5c" strokeWidth="6" />
              <path d="M130 100c20-30 50 10 40 24s-40 12-20 30 40-10 30-28" stroke="#d9413a" strokeWidth="9" fill="none" />
              <path d="M210 110C270 50 340 150 300 170S250 60 330 90 370 170 390 200V330Q395 375 420 340V190C430 130 500 60 470 120S530 90 555 100V400" fill="none" stroke="#e6c35c" strokeWidth="15" strokeLinejoin="round" />
              <text x="165" y="195" textAnchor="middle" className="svg-label" fontSize="14">গ্লোমেরুলাস</text>
              <text x="310" y="40" textAnchor="middle" className="svg-label" fontSize="14">নিকটবর্তী নালিকা</text>
              <text x="405" y="400" textAnchor="middle" className="svg-label" fontSize="14">হেনলির লুপ</text>
              <text x="500" y="40" textAnchor="middle" className="svg-label" fontSize="14">দূরবর্তী নালিকা</text>
              <rect x="590" y="300" width="22" height="110" rx="6" fill={urine} stroke="#fff" />
              <g style={{ transform: `translate(${step.at[0]}px, ${step.at[1]}px)`, transition: 'transform 1.1s ease-in-out' }}>
                <circle className="pulse" r="13" fill="#7fd2ff" stroke="#fff" strokeWidth="3" />
              </g>
            </svg>
            <StepNav steps={steps} />
            <div className="table-wrap">
              <table className="flow-table">
                <thead><tr><th>পদার্থ</th><th>ছেঁকে আসে?</th><th>মূত্রে থাকে?</th></tr></thead>
                <tbody>
                  {SOLUTES.map((x) => {
                    const expected = x === 'ইউরিয়া' || x === 'লবণ';
                    return (
                      <tr key={x}>
                        <td>{x}</td>
                        <td>{n.filtered(x) ? 'হ্যাঁ' : 'না'}</td>
                        <td className={n.inUrine(x) && !expected ? 'cell-yes' : 'cell-fine'}>{n.inUrine(x) ? 'হ্যাঁ' : 'না'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              <h3>{step.name}</h3>
              <p>{step.text}</p>
            </div>
            <Range label="দিনে পানি পান" value={s.drink} min={0.5} max={4} step={0.1} display={`${bn(s.drink)} লিটার`} onChange={(drink) => setS({ ...s, drink })} />
            <div className="stats">
              <Stat label="দৈনিক মূত্র" value={`${bn(n.urine, 1)} লি.`} />
              <Stat label="ঘনত্ব" value={<span style={{ fontSize: 17 }}>{n.strength > 1.4 ? 'গাঢ়' : n.strength > 0.8 ? 'স্বাভাবিক' : 'পাতলা'}</span>} />
            </div>
            <div className="toggle-row">
              <button type="button" className="chip-btn" aria-pressed={s.glucoseHigh} onClick={() => setS({ ...s, glucoseHigh: !s.glucoseHigh })}>রক্তে গ্লুকোজ বেশি</button>
              <button type="button" className="chip-btn" aria-pressed={s.filterDamage} onClick={() => setS({ ...s, filterDamage: !s.filterDamage })}>গ্লোমেরুলাস ক্ষতিগ্রস্ত</button>
            </div>
            <PredictBox scenarios={SCENARIOS.kidney} onRun={(set) => setS({ ...INIT.kidney, ...set })} />
          </>
        }
      />
    </Stage>
  );
}

export function DialysisLab() {
  const [s, setS] = useState<DialysisState>({ ...INIT.dialysis, hours: 0 });
  const [running, setRunning] = useState(false);
  const r = dialysis(s);

  useTick(
    () =>
      setS((v) => {
        if (v.hours >= 4) {
          setRunning(false);
          return v;
        }
        return { ...v, hours: Math.min(4, v.hours + 0.1) };
      }),
    80,
    running,
  );

  const flip = (key: 'fluidUrea' | 'fluidGlucose' | 'fluidSalt', label: string) => (
    <button type="button" className="chip-btn" aria-pressed={s[key]} onClick={() => setS({ ...s, [key]: !s[key], hours: 0 })}>{s[key] ? '✓' : '✗'} তরলে {label}</button>
  );

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 560 300" role="img" aria-label="ডায়ালাইসিস যন্ত্রের নল" style={{ background: '#16292c' }}>
            <rect x="20" y="60" width="520" height="180" rx="14" fill="#bfe2f7" />
            <text x="30" y="84" className="svg-label svg-label-dark" fontSize="14">ডায়ালাইসিস তরল</text>
            <path d="M0 150H560" stroke="#a02b2b" strokeWidth="58" />
            <path d="M0 150H560" stroke="#f6e7ae" strokeWidth="58" strokeDasharray="4 8" opacity="0.5" />
            <text x="280" y="155" textAnchor="middle" className="svg-label" fontSize="14">রোগীর রক্ত (বৈষম্যভেদ্য নল)</text>
            {r.urea > 12 && !s.fluidUrea && [0, 1, 2, 3].map((i) => (
              <circle key={i} r="6" fill="#ffd166">
                <animateMotion dur="2s" begin={`${-i * 0.5}s`} repeatCount="indefinite" path={`M${120 + i * 100} 150L${120 + i * 100} 225`} />
              </circle>
            ))}
          </svg>
        }
        side={
          <>
            <Meter label="রক্তে ইউরিয়া" value={r.urea / 100} color="#ff8a6b" />
            <Meter label="রক্তে গ্লুকোজ" value={r.glucose / 100} color="#ffd166" />
            <Meter label="রক্তে লবণ" value={r.salt / 100} color="#8fc4ef" />
            <div className="toggle-row">
              {flip('fluidUrea', 'ইউরিয়া')}
              {flip('fluidGlucose', 'গ্লুকোজ')}
              {flip('fluidSalt', 'লবণ')}
            </div>
            <button type="button" className="btn btn-hot" disabled={running} onClick={() => { setS({ ...s, hours: 0 }); setRunning(true); }}>▶ ৪ ঘণ্টা ডায়ালাইসিস চালাও</button>
            <Stat label="সময়" value={`${bn(s.hours, 1)} ঘণ্টা`} />
            <PredictBox scenarios={SCENARIOS.dialysis} onRun={(set) => { setS({ ...INIT.dialysis, ...set }); setRunning(false); }} />
          </>
        }
      />
    </Stage>
  );
}

interface Arm {
  angle: number;
  tendon: boolean;
}

const ARM_SCENARIOS: Scenario<Arm>[] = [
  { id: 'tear', title: 'বাইসেপসের টেন্ডন ছিঁড়ে গেলে', set: { tendon: false, angle: 170 }, ask: 'পেশি সুস্থ, কিন্তু টেন্ডন ছিঁড়ে গেছে। হাত ভাঁজ করা যাবে?', options: ['হ্যাঁ, পেশি তো ঠিক আছে', 'না, পেশির টান অস্থিতে পৌঁছাবে না'], answer: 1, why: 'টেন্ডন পেশিকে অস্থির সাথে যুক্ত করে। সংযোগ ছিঁড়লে পেশি সংকুচিত হলেও অস্থি নড়ে না।', proves: (s) => !s.tendon },
];

export function ArmLab() {
  const [s, setS] = useState<Arm>({ angle: 150, tendon: true });
  const angle = s.tendon ? s.angle : 170;
  const flex = (170 - angle) / 140;

  const elbow = { x: 300, y: 310 };
  const shoulder = { x: 130, y: 110 };
  const upperArm = Math.atan2(elbow.y - shoulder.y, elbow.x - shoulder.x);
  const forearm = upperArm - ((180 - angle) * Math.PI) / 180;
  const hand = { x: elbow.x + 210 * Math.cos(forearm), y: elbow.y + 210 * Math.sin(forearm) };
  const insert = { x: lerp(elbow.x, hand.x, 0.18), y: lerp(elbow.y, hand.y, 0.18) };
  const belly = lerp(14, 46, flex);
  const triBelly = lerp(40, 16, flex);
  const midBi = { x: lerp(shoulder.x, insert.x, 0.5) + 30 + belly * 0.5, y: lerp(shoulder.y, insert.y, 0.5) - 26 - belly * 0.6 };
  const midTri = { x: 180 - triBelly * 0.5, y: 250 + triBelly * 0.5 };

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 600 440" role="img" aria-label={`কনুইয়ের কোণ ${bn(angle)} ডিগ্রি`} style={{ background: '#16292c' }}>
            <circle cx={shoulder.x} cy={shoulder.y} r="28" fill="#eadfbe" />
            <line x1={shoulder.x} y1={shoulder.y} x2={elbow.x} y2={elbow.y} stroke="#f1ead2" strokeWidth="24" strokeLinecap="round" />
            <line x1={elbow.x} y1={elbow.y} x2={hand.x} y2={hand.y} stroke="#f1ead2" strokeWidth="20" strokeLinecap="round" />
            <circle cx={elbow.x} cy={elbow.y} r="20" fill="#cfd8c4" stroke="#7a8a6a" strokeWidth="3" />
            <circle cx={hand.x} cy={hand.y} r="26" fill="#e7b48f" />
            {s.tendon ? (
              <path d={`M${shoulder.x + 8} ${shoulder.y - 18}Q${midBi.x} ${midBi.y} ${insert.x} ${insert.y}`} fill="none" stroke="#e4572e" strokeWidth={lerp(16, 34, flex)} strokeLinecap="round" />
            ) : (
              <path d={`M${shoulder.x + 8} ${shoulder.y - 18}Q${shoulder.x + 60} ${shoulder.y - 10} ${shoulder.x + 90} ${shoulder.y + 50}`} fill="none" stroke="#e4572e" strokeWidth="36" strokeLinecap="round" />
            )}
            <path d={`M${shoulder.x - 12} ${shoulder.y + 16}Q${midTri.x} ${midTri.y} ${elbow.x - 14} ${elbow.y + 18}`} fill="none" stroke="#3a8fb7" strokeWidth={lerp(32, 16, flex)} strokeLinecap="round" />
            <text x="60" y="48" className="svg-label">বাইসেপস (লাল)</text>
            <text x="60" y="340" className="svg-label">ট্রাইসেপস (নীল)</text>
            <text x={elbow.x - 34} y={elbow.y + 56} className="svg-label" fontSize="13">কব্জা সন্ধি</text>
          </svg>
        }
        side={
          <>
            <Range label="কনুইয়ের কোণ" value={s.angle} min={30} max={170} display={`${bn(angle)}°`} onChange={(v) => setS({ ...s, angle: v })} />
            <button type="button" className="btn btn-lab" aria-pressed={!s.tendon} onClick={() => setS({ ...s, tendon: !s.tendon })}>{s.tendon ? 'টেন্ডন ছিঁড়ে দেখো' : 'টেন্ডন জোড়া লাগাও'}</button>
            <div className="panel" aria-live="polite">
              <h3>{!s.tendon ? 'হাত ভাঁজ হচ্ছে না' : flex > 0.5 ? 'বাহু ভাঁজ হচ্ছে' : 'বাহু সোজা হচ্ছে'}</h3>
              <p>{!s.tendon ? 'পেশি গুটিয়ে গেছে, কিন্তু টান অস্থিতে পৌঁছাচ্ছে না।' : flex > 0.5 ? 'বাইসেপস সংকুচিত হয়ে রেডিয়াসকে টানে, ট্রাইসেপস শিথিল হয়।' : 'ট্রাইসেপস সংকুচিত হয়ে আলনাকে টানে, বাইসেপস শিথিল হয়। পেশি ঠেলতে পারে না, শুধু টানে।'}</p>
              <Meter label="বাইসেপসের সংকোচন" value={flex} color="#e4572e" />
              <Meter label="ট্রাইসেপসের সংকোচন" value={1 - flex} color="#3a8fb7" />
            </div>
            <PredictBox scenarios={ARM_SCENARIOS} onRun={(set) => setS((v) => ({ ...v, ...set }))} />
            <p className="fb">টেন্ডন: পেশি থেকে অস্থি, শক্ত ও কম স্থিতিস্থাপক। লিগামেন্ট: অস্থি থেকে অস্থি, স্থিতিস্থাপক।</p>
          </>
        }
      />
    </Stage>
  );
}

const MOVES = [
  { id: 'bend', label: 'ভাঁজ করো' },
  { id: 'rotate', label: 'চারদিকে ঘোরাও' },
] as const;

export function JointLab() {
  const [joint, setJoint] = useState<Joint>('hinge');
  const [tried, setTried] = useState<'bend' | 'rotate' | null>(null);
  const j = JOINTS[joint];
  const allowed = tried ? j[tried] : true;
  const swing = tried === 'bend' && allowed ? -46 : 0;

  return (
    <Stage>
      <div className="stage-bar">
        <Seg<Joint>
          label="অস্থিসন্ধি"
          value={joint}
          onChange={(v) => { setJoint(v); setTried(null); }}
          options={(Object.keys(JOINTS) as Joint[]).map((k) => ({ value: k, label: JOINTS[k].name }))}
        />
      </div>
      <LabGrid
        view={
          <svg viewBox="0 0 520 320" role="img" aria-label={j.name} style={{ background: '#16292c' }}>
            <rect x="40" y="145" width="220" height="30" rx="14" fill="#f1ead2" />
            <g style={{ transformOrigin: '270px 160px', transform: `rotate(${swing}deg)`, transition: 'transform .7s' }} className={tried === 'rotate' && allowed ? 'spin' : undefined}>
              <rect x="280" y="145" width="200" height="30" rx="14" fill="#f1ead2" />
            </g>
            {joint === 'fixed' ? <path d="M250 145l14 8-12 8 14 8-12 6" fill="none" stroke="#7a8a6a" strokeWidth="4" /> : <circle cx="270" cy="160" r="30" fill="#cfd8c4" stroke="#7a8a6a" strokeWidth="4" />}
          </svg>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              <h3>{j.name}</h3>
              <span className="tag">{j.where}</span>
              <p>{j.note}</p>
            </div>
            <div className="toggle-row">
              {MOVES.map((m) => <button key={m.id} type="button" className="btn btn-lab" onClick={() => setTried(m.id)}>{m.label}</button>)}
            </div>
            {tried && <p className={allowed ? 'fb fb-ok' : 'fb fb-no'} role="status">{allowed ? 'এই সন্ধি এভাবে নড়তে পারে।' : 'এই সন্ধি এভাবে নড়তে পারে না।'}</p>}
            <p className="fb">সচল সন্ধিতে সাইনোভিয়াল রস ও তরুণাস্থি ঘর্ষণ কমায়। ভাবো: হাঁটু যদি কাঁধের মতো সব দিকে ঘুরত, দাঁড়িয়ে থাকা কি সহজ হতো?</p>
          </>
        }
      />
    </Stage>
  );
}

export function BoneLab() {
  const [s, setS] = useState<BoneState>(INIT.bone);
  const points: [number, number][] = Array.from({ length: 41 }, (_, i) => [i * 2, boneAt(i * 2, s)]);
  const risk = points.find(([age, v]) => age > 30 && v < FRACTURE_RISK)?.[0];
  const flip = (key: keyof BoneState, label: string) => (
    <button type="button" className="chip-btn" aria-pressed={s[key]} onClick={() => setS({ ...s, [key]: !s[key] })}>{label}</button>
  );

  return (
    <Stage>
      <LabGrid
        view={<MiniChart title="বয়সের সাথে অস্থির ঘনত্ব" points={points} xLabel="বয়স (বছর)" yUnit="একক" yMax={100} zones={[{ from: 0, to: FRACTURE_RISK, label: 'ভাঙার ঝুঁকি', color: '#ff6b5b' }]} />}
        side={
          <>
            <div className="toggle-row">
              {flip('calcium', 'ক্যালসিয়ামযুক্ত খাবার')}
              {flip('sun', 'রোদে থাকা')}
              {flip('exercise', 'নিয়মিত ব্যায়াম')}
              {flip('female', 'নারী (মেনোপজ)')}
            </div>
            <Stat label="ঝুঁকিতে পৌঁছায়" value={risk ? `${bn(risk)} বছরে` : '৮০ বছরেও নয়'} />
            <PredictBox scenarios={SCENARIOS.bone} onRun={(set) => setS({ ...INIT.bone, ...set })} />
            <p className="fb">কিশোর বয়সের খাবার ও খেলাধুলাই ভবিষ্যতের হাড় গড়ে। ৫০ বছরের ওপরে নারী-পুরুষের দৈনিক ক্যালসিয়াম প্রয়োজন প্রায় ১২০০ মিলিগ্রাম। লেখচিত্রটি শেখার মডেল।</p>
          </>
        }
      />
    </Stage>
  );
}
