import { useState } from 'react';
import { LabGrid, PredictBox, Range, Stage, Stat, useTick } from '../../../components/labkit';
import { bn } from '../../../core/util';
import { SIDE, doublingsFor, growthStep, ploidyAcross, wounded, flaskTemp, type FlaskState } from './models/life';
import { INIT, SCENARIOS } from './models/scenarios';

const COLORS = ['#3a2a2a', '#d98c7a', '#c9543f', '#a73a30', '#8a2622', '#6d1a18', '#500f10'];

export function GrowthLab() {
  const [cells, setCells] = useState(wounded);
  const [controlled, setControlled] = useState(true);
  const [running, setRunning] = useState(false);
  const [day, setDay] = useState(0);
  const [doublings, setDoublings] = useState(20);

  useTick(() => {
    setCells((c) => {
      const next = growthStep(c, controlled);
      if (next.every((n, i) => n === c[i])) setRunning(false);
      return next;
    });
    setDay((d) => d + 1);
  }, 500, running);

  const reset = () => {
    setCells(wounded());
    setDay(0);
    setRunning(false);
  };

  const piled = cells.filter((n) => n > 1).length;
  const empty = cells.filter((n) => n === 0).length;

  return (
    <Stage>
      <LabGrid
        view={
          <>
            <div className="tissue" role="img" aria-label={`খালি ঘর ${bn(empty)}টি, স্তূপ ${bn(piled)}টি`} style={{ gridTemplateColumns: `repeat(${SIDE}, 1fr)` }}>
              {cells.map((n, i) => <span key={i} style={{ background: COLORS[n], transition: 'background .4s' }} />)}
            </div>
            <div className="stepnav" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-hot" onClick={() => setRunning(!running)}>{running ? '⏸ থামাও' : '▶ বিভাজন চালাও'}</button>
              <button type="button" className="btn btn-lab" onClick={reset}>নতুন ক্ষত</button>
              <button type="button" className="btn btn-lab" aria-pressed={!controlled} onClick={() => { setControlled(!controlled); reset(); }}>
                {controlled ? 'নিয়ন্ত্রণ নষ্ট করো' : 'নিয়ন্ত্রণ ফিরিয়ে দাও'}
              </button>
            </div>
          </>
        }
        side={
          <>
            <div className="stats">
              <Stat label="দিন" value={bn(day)} />
              <Stat label="খালি ঘর" value={bn(empty)} />
              <Stat label="স্তূপ" value={bn(piled)} />
            </div>
            <div className="panel" aria-live="polite">
              <h3>{controlled ? 'সুস্থ টিস্যু: ক্ষত পূরণ' : 'নিয়ন্ত্রণহীন বিভাজন'}</h3>
              <p>{controlled ? 'ফাঁকা জায়গার পাশের কোষ মাইটোসিসে বিভাজিত হয়। জায়গা ভরে গেলেই বিভাজন থেমে যায়।' : 'জায়গা ভরে গেলেও বিভাজন থামে না, কোষ স্তূপ হয়ে টিউমার গড়ে। ছড়িয়ে পড়লে তাকে ক্যান্সার বলে।'}</p>
            </div>
            <div className="panel">
              <h4>দ্বিগুণ হতে হতে কত কোষ?</h4>
              <Range label="কতবার দ্বিগুণ" value={doublings} min={1} max={46} display={`${bn(doublings)} বার`} onChange={setDoublings} />
              <p>কোষ হবে প্রায় <strong>{bn((2 ** doublings).toLocaleString('en-IN'))}</strong>টি।</p>
              <p className="panel-note">মানবদেহে প্রায় ৩০ ট্রিলিয়ন কোষ, যা মাত্র {bn(doublingsFor(30e12))} বার দ্বিগুণে হয়। তাই প্রতিদিন একবার বিভাজনেই ৪০–৫০ দিন যথেষ্ট হতো; আসলে সময় লাগে পুষ্টির সীমাবদ্ধতার জন্য।</p>
            </div>
          </>
        }
      />
    </Stage>
  );
}

export function PloidyLab() {
  const [meiosis, setMeiosis] = useState(true);
  const [start, setStart] = useState(46);
  const series = ploidyAcross(start, 5, meiosis);
  const max = Math.max(...series);

  return (
    <Stage>
      <LabGrid
        view={
          <div className="panel">
            <h4>প্রতি প্রজন্মের ক্রোমোজোম সংখ্যা</h4>
            {series.map((n, i) => (
              <div key={i} className="res-row" style={{ alignItems: 'center' }}>
                <span style={{ flex: 'none', width: 74 }}>প্রজন্ম {bn(i + 1)}</span>
                <span className="meter-track" style={{ flex: 1 }}><span className="meter-fill" style={{ width: `${(n / max) * 100}%`, background: meiosis ? '#6fd09a' : '#ff8a6b' }} /></span>
                <strong style={{ flex: 'none', width: 62, textAlign: 'right' }}>{bn(n)}</strong>
              </div>
            ))}
          </div>
        }
        side={
          <>
            <button type="button" className="btn btn-hot" aria-pressed={meiosis} onClick={() => setMeiosis(!meiosis)}>
              {meiosis ? 'মিয়োসিস বন্ধ করে দেখো' : 'মিয়োসিস চালু করো'}
            </button>
            <Range label="শুরুর সংখ্যা (2n)" value={start} min={4} max={46} step={2} onChange={setStart} />
            <div className="panel" aria-live="polite">
              <p>{meiosis ? 'গ্যামেটে অর্ধেক (n), মিলনে আবার 2n। তাই প্রজাতির সংখ্যা স্থির থাকে।' : 'গ্যামেট অর্ধেক না হওয়ায় প্রতি প্রজন্মে সংখ্যা দ্বিগুণ হচ্ছে। জিন আমূল বদলে যাবে।'}</p>
            </div>
            <p className="fb">মাঝে মাঝে ক্রোমোজোম সেট দ্বিগুণ হয়ে নতুন প্রজাতিও হয়, যেমন Xenopus ব্যাঙে। তবে সেটি ব্যতিক্রম।</p>
          </>
        }
      />
    </Stage>
  );
}

export function ThermosLab() {
  const [s, setS] = useState<FlaskState>(INIT.flask);
  const [hours, setHours] = useState(0);
  const [running, setRunning] = useState(false);

  useTick(
    () =>
      setHours((h) => {
        if (h >= 6) {
          setRunning(false);
          return h;
        }
        return h + 0.1;
      }),
    90,
    running,
  );

  const liveTemp = flaskTemp(s, hours);
  const controlTemp = flaskTemp({ ...s, alive: false }, hours);

  const flask = (x: number, label: string, temp: number, alive: boolean) => (
    <g key={x}>
      <path d={`M${x - 30} 60V110Q${x - 70} 130 ${x - 70} 180V330Q${x - 70} 350 ${x - 50} 350H${x + 50}Q${x + 70} 350 ${x + 70} 330V180Q${x + 70} 130 ${x + 30} 110V60Z`} fill="#1c3438" stroke="#d6e8ef" strokeWidth="4" />
      <rect x={x - 34} y="46" width="68" height="20" rx="4" fill="#b58e5e" />
      {Array.from({ length: 22 }, (_, i) => <ellipse key={i} cx={x - 54 + (i % 6) * 21} cy={335 - Math.floor(i / 6) * 18} rx="9" ry="7" fill={alive ? '#e6c35c' : '#a89a6a'} />)}
      <rect x={x - 4} y="14" width="8" height="240" rx="4" fill="#f7f3e6" />
      <rect x={x - 3} y={240 - (temp - 25) * 11} width="6" height={(temp - 25) * 11 + 14} fill="#d9413a" />
      <text x={x} y="390" textAnchor="middle" className="svg-label" fontSize="14">{label}: {bn(temp, 1)}°C</text>
    </g>
  );

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 560 410" role="img" aria-label={`দুটি থার্মোফ্লাস্কের তাপমাত্রা ${bn(liveTemp, 1)} ও ${bn(controlTemp, 1)} ডিগ্রি`} style={{ background: '#16292c' }}>
            {flask(150, 'ফ্লাস্ক ক', liveTemp, s.alive)}
            {flask(410, 'ফ্লাস্ক খ (মৃত বীজ)', controlTemp, false)}
          </svg>
        }
        side={
          <>
            <div className="stepnav" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-hot" disabled={running} onClick={() => { setHours(0); setRunning(true); }}>▶ ৬ ঘণ্টা রেখে দাও</button>
              <span className="stepnav-count">{bn(hours, 1)} ঘণ্টা</span>
            </div>
            <div className="toggle-row">
              <button type="button" className="chip-btn" aria-pressed={s.alive} onClick={() => setS({ ...s, alive: !s.alive })}>ফ্লাস্ক ক-এর বীজ জীবিত</button>
              <button type="button" className="chip-btn" aria-pressed={s.wet} onClick={() => setS({ ...s, wet: !s.wet })}>অঙ্কুরিত (ভেজা)</button>
              <button type="button" className="chip-btn" aria-pressed={s.sealed} onClick={() => setS({ ...s, sealed: !s.sealed })}>থার্মোফ্লাস্ক</button>
            </div>
            <PredictBox scenarios={SCENARIOS.flask} onRun={(set) => { setS({ ...INIT.flask, ...set }); setHours(0); setRunning(true); }} />
            <p className="fb">শ্বসনে খাদ্যের শক্তির একাংশ তাপ হয়ে বের হয়। মারকিউরিক ক্লোরাইড বিষাক্ত, বাস্তবে শুধু শিক্ষকের তত্ত্বাবধানে ব্যবহার করবে।</p>
          </>
        }
      />
    </Stage>
  );
}
