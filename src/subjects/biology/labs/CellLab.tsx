import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LabGrid, Meter, Seg, Stage, StepNav, useSteps, useTick } from '../../../components/labkit';
import { bn, shuffle } from '../../../core/util';
import { CAUSE_TEXT, NORMAL_ENV, PROFILES, freshCell, isPlasmolysed, step as simStep, type CellState, type CellType, type Env, type Solution } from './cell/cellSim';
import { CellScene } from './cell/CellScene';
import { CHALLENGES, envFor, type Challenge } from './cell/challenges';
import { Closeup } from './cell/Closeup';
import { layoutFor, type Layout, type Pt } from './cell/layout';
import { ORG } from './cell/organelles';

type Mode = 'explore' | 'close' | 'test' | 'process' | 'find';

interface ProcessStep {
  title: string;
  text: string;
  at: (L: Layout) => Pt;
  focus: string;
  gone?: boolean;
}

const offset = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];
const first = (items: Pt[], fallback: Pt = [400, 280]) => items[0] ?? fallback;

const PROCESSES: { id: string; title: string; color: string; steps: ProcessStep[] }[] = [
  {
    id: 'protein', title: 'প্রোটিন তৈরি', color: '#ffd166',
    steps: [
      { title: 'নির্দেশ তৈরি', text: 'নিউক্লিয়াসের DNA থেকে প্রোটিন তৈরির নির্দেশ RNA-তে কপি হয়।', at: (L) => L.nucleus ?? [400, 280], focus: 'nucleus' },
      { title: 'নিউক্লিয়ার রন্ধ্র পেরোনো', text: 'RNA নিউক্লিয়ার ঝিল্লির রন্ধ্র দিয়ে সাইটোপ্লাজমে আসে।', at: (L) => offset(L.nucleus ?? [400, 280], 92, -6), focus: 'nucleus' },
      { title: 'রাইবোজোমে প্রোটিন', text: 'অমসৃণ জালিকার রাইবোজোম নির্দেশ পড়ে অ্যামিনো এসিড জুড়ে প্রোটিন বানায়।', at: (L) => offset(first(L.rer), -10, -20), focus: 'ribosome' },
      { title: 'জালিকার ভেতর দিয়ে', text: 'প্রোটিন এন্ডোপ্লাজমিক রেটিকুলামের ভেতর দিয়ে এগোয়।', at: (L) => offset(first(L.rer), 35, 20), focus: 'rer' },
      { title: 'গলজি বস্তুতে প্যাকেট', text: 'গলজি বস্তু প্রোটিন গুছিয়ে ভেসিকলে ভরে।', at: (L) => first(L.golgi), focus: 'golgi' },
      { title: 'কোষের বাইরে', text: 'ভেসিকল কোষঝিল্লিতে মিশে প্রোটিন বাইরে ছেড়ে দেয়। এটিই নিঃসরণ।', at: (L) => (L.shape === 'box' ? [600, 36] : [640, 92]), focus: 'membrane' },
    ],
  },
  {
    id: 'energy', title: 'শক্তি তৈরি', color: '#ff9f6b',
    steps: [
      { title: 'গ্লুকোজ ঢোকে', text: 'কোষঝিল্লি পেরিয়ে গ্লুকোজ সাইটোপ্লাজমে আসে।', at: (L) => (L.shape === 'box' ? [40, 300] : [70, 300]), focus: 'membrane' },
      { title: 'গ্লাইকোলাইসিস', text: 'সাইটোপ্লাজমে গ্লুকোজ ভেঙে পাইরুভিক এসিড হয়। সামান্য ATP মেলে।', at: (L) => (L.shape === 'box' ? [70, 240] : [150, 370]), focus: 'cytoplasm' },
      { title: 'মাইটোকন্ড্রিয়ায় প্রবেশ', text: 'পাইরুভিক এসিড মাইটোকন্ড্রিয়ায় ঢুকে অ্যাসিটাইল Co-A হয়।', at: (L) => first(L.mito), focus: 'mito' },
      { title: 'ক্রেবস চক্র', text: 'ম্যাট্রিক্সে ক্রেবস চক্র ঘোরে, CO₂ বের হয়, NADH জমা হয়।', at: (L) => offset(first(L.mito), 8, 6), focus: 'mito' },
      { title: 'ATP তৈরি', text: 'ইলেকট্রন প্রবাহতন্ত্র NADH ব্যবহার করে বিপুল ATP বানায়। মোট ৩৮ ATP!', at: (L) => offset(first(L.mito), 30, -50), focus: 'mito' },
    ],
  },
  {
    id: 'clean', title: 'জীবাণু হজম', color: '#8ee3c6',
    steps: [
      { title: 'জীবাণু গ্রাস', text: 'কোষঝিল্লি জীবাণুকে ঘিরে ভেতরে টেনে নেয়।', at: (L) => (L.shape === 'box' ? [40, 400] : [660, 460]), focus: 'membrane' },
      { title: 'লাইসোজোমের কাছে', text: 'ভেসিকলে ভরা জীবাণু লাইসোজোমের দিকে যায়।', at: (L) => offset(first(L.lyso), 34, 18), focus: 'lyso' },
      { title: 'মিলন', text: 'লাইসোজোম ভেসিকলের সাথে মেশে, উৎসেচক ঢেলে দেয়।', at: (L) => first(L.lyso), focus: 'lyso' },
      { title: 'হজম', text: 'উৎসেচক জীবাণুকে ভেঙে ফেলে। ব্যবহারযোগ্য অংশ কোষ রেখে দেয়।', at: (L) => first(L.lyso), focus: 'lyso', gone: true },
    ],
  },
];

const CELL_TYPES: { value: CellType; label: string }[] = [
  { value: 'animal', label: 'প্রাণিকোষ' },
  { value: 'plant', label: 'পাতার কোষ' },
  { value: 'root', label: 'মূলের কোষ' },
  { value: 'muscle', label: 'পেশিকোষ' },
  { value: 'gland', label: 'গ্রন্থিকোষ' },
  { value: 'wbc', label: 'শ্বেত কণিকা' },
  { value: 'rbc', label: 'লোহিত কণিকা' },
];

function partsFor(type: CellType): string[] {
  const L = layoutFor(type);
  const p = PROFILES[type];
  const has: Record<string, boolean> = {
    wall: p.wall, membrane: true, cytoplasm: L.shape !== 'disc', cytoskel: L.shape !== 'disc', nucleus: !!L.nucleus, nucleolus: !!L.nucleus,
    mito: L.mito.length > 0, chloro: L.chloro.length > 0, rer: L.rer.length > 0, ser: L.ser.length > 0, ribosome: L.ribosomes.length > 0,
    golgi: L.golgi.length > 0, lyso: L.lyso.length > 0, vacuole: !!L.bigVac || L.smallVac.length > 0, centro: !!L.centro, hb: L.shape === 'disc',
  };
  return Object.keys(ORG).filter((id) => has[id]);
}

function CellMeters({ sim, type }: { sim: CellState; type: CellType }) {
  const plasmolysed = isPlasmolysed(PROFILES[type], sim);
  return (
    <div className="panel">
      <h4>কোষের অবস্থা</h4>
      <Meter label="ATP (শক্তি)" value={sim.atp} color="#ffc23d" />
      <Meter label="প্রোটিন" value={sim.protein} color="#ffd166" />
      <Meter label="নিঃসরণ" value={sim.secretion} color="#f1d06e" />
      <Meter label="বর্জ্য" value={sim.waste} color="#b5a493" />
      <Meter label="কোষের আয়তন" value={sim.water / 1.4} color="#8fc4ef" display={`${bn(Math.round(sim.water * 100))}%`} />
      <Meter label="ক্ষতি" value={sim.damage} color="#ff8a6b" />
      {sim.ruptured && !sim.dead && <p style={{ color: '#ffb199' }}>লাইসোজোম ফেটেছে! উৎসেচক অঙ্গাণু হজম করছে।</p>}
      {plasmolysed && <p style={{ color: '#ffd166' }}>প্রোটোপ্লাজম প্রাচীর থেকে সরে এসেছে (প্লাজমোলাইসিস)।</p>}
      {sim.dead && sim.cause && <p role="status" style={{ color: '#ffb199' }}>কোষটি মারা গেছে। {CAUSE_TEXT[sim.cause]}</p>}
    </div>
  );
}

function ChallengePanel({
  challenge, picked, done, sim, onPick, onRun, running, onLeave,
}: {
  challenge: Challenge;
  picked: number | null;
  done: boolean;
  sim: CellState;
  onPick: (i: number) => void;
  onRun: () => void;
  running: boolean;
  onLeave: () => void;
}) {
  const right = picked === challenge.answer;
  return (
    <div className="panel" aria-live="polite">
      <h4>আগে অনুমান করো, তারপর চালাও</h4>
      <h3>{challenge.title}</h3>
      <p>{challenge.ask}</p>
      <div className="option-stack">
        {challenge.options.map((o, i) => {
          const state = !done ? '' : i === challenge.answer ? ' right' : i === picked ? ' wrong' : '';
          return (
            <button key={o} type="button" className={`lab-option${state}`} aria-pressed={picked === i} disabled={running || done} onClick={() => onPick(i)}>
              {o}
            </button>
          );
        })}
      </div>
      {!done && (
        <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} disabled={picked === null || running} onClick={onRun}>
          {running ? `পরীক্ষা চলছে… ${bn(Math.round((sim.t / challenge.ticks) * 100))}%` : picked === null ? 'আগে একটি উত্তর বেছে নাও' : '▶ পরীক্ষা চালাও'}
        </button>
      )}
      {done && (
        <>
          <p style={{ color: right ? '#8fe3b1' : '#ffb199' }}>{right ? 'তোমার অনুমান ঠিক!' : 'অনুমান মেলেনি। প্রমাণ দেখে ধারণা বদলানোই বিজ্ঞান।'}</p>
          <p>{challenge.why}</p>
          <p style={{ color: '#ffd166' }}>এবার ভাবো: {challenge.think}</p>
        </>
      )}
      <button type="button" className="btn btn-lab" style={{ marginTop: 8 }} onClick={onLeave}>
        অন্য পরীক্ষা বাছো
      </button>
    </div>
  );
}

function FreeControls({ type, env, setEnv, onReset }: { type: CellType; env: Env; setEnv: (e: Env) => void; onReset: () => void }) {
  const toggle = (key: 'oxygen' | 'glucose' | 'light', label: string) => (
    <button type="button" className="chip-btn" aria-pressed={env[key]} onClick={() => setEnv({ ...env, [key]: !env[key] })}>
      {env[key] ? '✓' : '✗'} {label}
    </button>
  );
  return (
    <div className="panel">
      <h4>মুক্ত পরীক্ষা: পরিবেশ বদলাও, অঙ্গাণুতে চাপ দিয়ে বন্ধ করো</h4>
      <div className="chips">
        {toggle('oxygen', 'অক্সিজেন')}
        {toggle('glucose', 'গ্লুকোজ')}
        {PROFILES[type].chloro && toggle('light', 'আলো')}
      </div>
      <div style={{ marginTop: 8 }}>
        <Seg<Solution>
          label="বাইরের দ্রবণ"
          value={env.solution}
          onChange={(solution) => setEnv({ ...env, solution })}
          options={[{ value: 'hypo', label: 'বিশুদ্ধ পানি' }, { value: 'iso', label: 'স্বাভাবিক' }, { value: 'hyper', label: 'ঘন লবণ পানি' }]}
        />
      </div>
      <button type="button" className="btn btn-lab" style={{ marginTop: 8 }} onClick={onReset}>
        কোষ নতুন করে শুরু করো
      </button>
    </div>
  );
}

function FindGame({ type, last }: { type: CellType; last: { id: string; n: number } | null }) {
  const pool = useMemo(() => shuffle(partsFor(type).filter((id) => id !== 'cytoskel')), [type]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [miss, setMiss] = useState<string | null>(null);
  const target = pool[index];

  useEffect(() => {
    setIndex(0);
    setScore(0);
    setMiss(null);
  }, [pool]);

  useEffect(() => {
    if (!last || !target) return;
    if (last.id === target) {
      setScore((s) => s + (miss ? 0 : 1));
      setMiss(null);
      setIndex((i) => i + 1);
    } else {
      setMiss(last.id);
    }
    // React only to a new tap, not to the score or target changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last?.n]);

  return (
    <div className="panel" aria-live="polite">
      {target ? (
        <>
          <h4>কাজ শুনে অঙ্গাণু খুঁজে বের করো</h4>
          <p>{ORG[target].role}</p>
          {miss && <p style={{ color: '#ffb199' }}>এটি {ORG[miss].name}। আবার খোঁজো।</p>}
        </>
      ) : (
        <>
          <h3>শেষ!</h3>
          <p>প্রথম চেষ্টায় {bn(pool.length)}টির মধ্যে {bn(score)}টি ঠিক।</p>
          <button type="button" className="btn btn-lab" onClick={() => { setIndex(0); setScore(0); }}>আবার খেলো</button>
        </>
      )}
      <p className="panel-note">{bn(Math.min(index, pool.length))}/{bn(pool.length)} সম্পন্ন</p>
    </div>
  );
}

export default function CellLab() {
  const [params] = useSearchParams();
  const requested = CHALLENGES.find((c) => c.id === params.get('try')) ?? null;
  const askedClose = params.get('close');

  const [type, setType] = useState<CellType>(requested?.type ?? 'animal');
  const [mode, setMode] = useState<Mode>(requested ? 'test' : askedClose ? 'close' : 'explore');
  const [closeId, setCloseId] = useState(askedClose && ORG[askedClose] ? askedClose : 'mito');
  const [selected, setSelected] = useState<string | null>(null);
  const [deep, setDeep] = useState<string | null>(null);
  const [off, setOff] = useState<Set<string>>(new Set(requested?.off));
  const [env, setEnv] = useState<Env>(requested ? envFor(requested) : NORMAL_ENV);
  const [sim, setSim] = useState<CellState>(freshCell);
  const [running, setRunning] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(requested);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [processId, setProcessId] = useState(PROCESSES[0].id);
  const [tap, setTap] = useState<{ id: string; n: number } | null>(null);

  const process = PROCESSES.find((p) => p.id === processId)!;
  const steps = useSteps(process.steps.length, 2600);
  const pstep = process.steps[steps.index];
  const layout = layoutFor(type);
  const hasProcess = type !== 'rbc';

  useTick(
    () => {
      setSim((s) => {
        const next = simStep(s, PROFILES[type], off, env);
        if (challenge && (next.dead || next.t >= challenge.ticks)) {
          setRunning(false);
          setDone(true);
        } else if (next.dead) {
          setRunning(false);
        }
        return next;
      });
    },
    // Free testing runs slower, so a student has time to react and rescue the cell.
    challenge ? 45 : 180,
    running,
  );

  const resetCell = () => {
    setSim(freshCell());
    setRunning(mode === 'test' && !challenge);
    setDone(false);
  };

  const startChallenge = (c: Challenge) => {
    setType(c.type);
    setOff(new Set(c.off));
    setEnv(envFor(c));
    setSim(freshCell());
    setChallenge(c);
    setPicked(null);
    setDone(false);
    setRunning(false);
    setSelected(null);
  };

  const leaveChallenge = () => {
    setChallenge(null);
    setOff(new Set());
    setEnv(NORMAL_ENV);
    setSim(freshCell());
    setRunning(false);
    setDone(false);
  };

  const changeMode = (m: Mode) => {
    setMode(m);
    setSelected(null);
    setDeep(null);
    leaveChallenge();
    if (m === 'test') setRunning(true);
  };

  const changeType = (t: CellType) => {
    setType(t);
    setSelected(null);
    setDeep(null);
    setOff(new Set());
    setSim(freshCell());
    setChallenge(null);
    setDone(false);
    setRunning(mode === 'test');
    if (t === 'rbc' && mode === 'process') setMode('explore');
  };

  const toggleOff = (id: string) => {
    if (!ORG[id].without) return;
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onPick = (id: string) => {
    if (mode === 'explore') setSelected(id === selected ? null : id);
    if (mode === 'find') setTap((t) => ({ id, n: (t?.n ?? 0) + 1 }));
    if (mode === 'test' && !challenge) {
      setSelected(id);
      toggleOff(id);
    }
  };

  const org = selected ? ORG[selected] : null;
  const focus = mode === 'process' ? pstep.focus : mode === 'explore' ? selected : null;
  const modes = [
    { value: 'explore' as Mode, label: 'অন্বেষণ' },
    { value: 'close' as Mode, label: 'কাছ থেকে দেখো' },
    { value: 'test' as Mode, label: 'পরীক্ষা করো' },
    ...(hasProcess ? [{ value: 'process' as Mode, label: 'ধাপে ধাপে' }] : []),
    { value: 'find' as Mode, label: 'খুঁজে বের করো' },
  ];
  const tokenAt = pstep.at(layout);

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="ল্যাবের ধরন" value={mode} onChange={changeMode} options={modes} />
      </div>
      {mode === 'close' ? (
        <Closeup id={closeId} options={Object.keys(ORG)} onPick={setCloseId} />
      ) : deep ? (
        <Closeup id={deep} onClose={() => setDeep(null)} />
      ) : (
      <>
      <div className="chips cell-types" role="group" aria-label="কোষের ধরন">
        {CELL_TYPES.map((c) => (
          <button key={c.value} type="button" className="chip-btn" aria-pressed={type === c.value} disabled={!!challenge} onClick={() => changeType(c.value)}>
            {c.label}
          </button>
        ))}
      </div>
      <LabGrid
        view={
            <>
              <CellScene type={type} sim={sim} env={env} off={off} selected={focus} onPick={onPick}>
                {mode === 'process' && (
                  <g style={{ transform: `translate(${tokenAt[0]}px, ${tokenAt[1]}px)`, transition: 'transform 1.1s ease-in-out', pointerEvents: 'none' }}>
                    <circle className="pulse" r={pstep.gone ? 7 : 14} fill={process.color} stroke="#222" strokeWidth="2.5" opacity={pstep.gone ? 0.4 : 1} />
                    {!pstep.gone && <circle r="24" fill="none" stroke={process.color} strokeWidth="2" strokeDasharray="4 6" />}
                  </g>
                )}
              </CellScene>
              {mode === 'process' && <StepNav steps={steps} />}
            </>
        }
        side={
          <>
            {mode === 'explore' && (
              <div className="panel" aria-live="polite">
                {org ? (
                  <>
                    <h3>{org.name}</h3>
                    <span className="tag">{org.en}</span>
                    <span className="tag">উপমা: {org.analogy}</span>
                    <p>{org.role}</p>
                    {org.without && <p style={{ color: '#ffd166' }}>না থাকলে: {org.without}</p>}
                    <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} onClick={() => setDeep(selected)}>
                      🔬 কাছ থেকে দেখো: কী ঢোকে, কী তৈরি হয়
                    </button>
                  </>
                ) : (
                  <>
                    <h3>{PROFILES[type].name}</h3>
                    <p>{PROFILES[type].note}</p>
                    <p className="panel-note">যেকোনো অংশে চাপ দাও। কোষের ধরন বদলে দেখো অঙ্গাণুর সংখ্যা কীভাবে কাজের সাথে মেলে।</p>
                  </>
                )}
              </div>
            )}

            {mode === 'test' && (
              <>
                {challenge ? (
                  <ChallengePanel
                    challenge={challenge} picked={picked} done={done} sim={sim} running={running}
                    onPick={setPicked} onRun={() => setRunning(true)} onLeave={leaveChallenge}
                  />
                ) : (
                  <>
                    <div className="panel">
                      <h4>অনুমান পরীক্ষা বাছো</h4>
                      <div className="chips">
                        {CHALLENGES.map((c) => (
                          <button key={c.id} type="button" className="chip-btn" onClick={() => startChallenge(c)}>{c.title}</button>
                        ))}
                      </div>
                    </div>
                    <FreeControls type={type} env={env} setEnv={setEnv} onReset={resetCell} />
                    {org && <p className="fb">{off.has(selected!) ? `${org.name} বন্ধ। ${org.without ?? ''}` : org.without ? `${org.name} চালু আছে।` : `${org.name} বন্ধ করা যায় না।`}</p>}
                  </>
                )}
                <CellMeters sim={sim} type={type} />
              </>
            )}

            {mode === 'find' && <FindGame type={type} last={tap} />}

            {mode === 'process' && (
              <>
                <div className="chips" style={{ marginTop: 0 }}>
                  {PROCESSES.map((p) => (
                    <button key={p.id} type="button" className="chip-btn" aria-pressed={p.id === processId} onClick={() => { setProcessId(p.id); steps.setIndex(0); steps.setPlaying(false); }}>
                      {p.title}
                    </button>
                  ))}
                </div>
                <div className="panel" aria-live="polite">
                  <h4>ধাপ {bn(steps.index + 1)}</h4>
                  <h3>{pstep.title}</h3>
                  <p>{pstep.text}</p>
                </div>
              </>
            )}

            {mode !== 'test' && (
              <details className="panel">
                <summary>সব অংশের তালিকা</summary>
                <div className="chips">
                  {partsFor(type).map((id) => (
                    <button key={id} type="button" className="chip-btn" aria-pressed={selected === id} onClick={() => onPick(id)}>
                      {ORG[id].name}
                    </button>
                  ))}
                </div>
              </details>
            )}
            <Link className="fb lab-link" to="/biology/ch02/lab/cases">সৃজনশীল প্রশ্নের অনুশীলনে যাও →</Link>
          </>
        }
      />
      </>
      )}
    </Stage>
  );
}
