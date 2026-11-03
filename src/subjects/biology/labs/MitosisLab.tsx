import { useMemo, useState } from 'react';
import { LabGrid, Range, Seg, Stage, Stat, useTick } from '../../../components/labkit';
import { bn, clamp, lerp, shuffle, smooth } from '../../../core/util';

type Kind = 'animal' | 'plant';

const STAGES = [
  { name: 'ইন্টারফেজ', text: 'বিভাজনের প্রস্তুতি। ক্রোমোজোম সুতার মতো জট পাকানো ক্রোমাটিন হয়ে থাকে, তাই আলাদা করে চেনা যায় না। DNA-র অনুলিপি হয়।' },
  { name: 'প্রোফেজ', text: 'নিউক্লিয়াস বড় হয়। ক্রোমাটিন কুণ্ডলিত হয়ে ক্রমশ মোটা ও খাটো হয়। প্রতিটি ক্রোমোজোমে দুটি ক্রোমাটিড দেখা যায়।' },
  { name: 'প্রো-মেটাফেজ', text: 'নিউক্লিয়ার ঝিল্লি ও নিউক্লিওলাস মিলিয়ে যেতে থাকে। স্পিন্ডল তন্তু গড়ে সেন্ট্রোমিয়ারে যুক্ত হয়।' },
  { name: 'মেটাফেজ', text: 'সব ক্রোমোজোম বিষুবীয় অঞ্চলে সারি বাঁধে। ক্রোমোজোম এখন সর্বাধিক মোটা ও খাটো; গণনার সেরা সময়।' },
  { name: 'অ্যানাফেজ', text: 'সেন্ট্রোমিয়ার ভাগ হয়। ক্রোমাটিড আলাদা হয়ে বিপরীত মেরুতে যায়। সেন্ট্রোমিয়ার আগে, বাহু পেছনে।' },
  { name: 'টেলোফেজ', text: 'ক্রোমোজোম সরু ও লম্বা হয়। ঝিল্লি ও নিউক্লিওলাস ফিরে আসে। তারপর সাইটোপ্লাজম ভাগ হয়ে দুটি কোষ হয়।' },
];

const MAX_T = 6;
const CHROMOSOMES = [
  { sx: 365, sy: 235, rot: 35, ym: 148, len: 44, color: '#4da3ff' },
  { sx: 440, sy: 245, rot: -50, ym: 246, len: 44, color: '#ff8a5c' },
  { sx: 380, sy: 322, rot: 80, ym: 332, len: 28, color: '#4da3ff' },
  { sx: 445, sy: 330, rot: -20, ym: 400, len: 28, color: '#ff8a5c' },
];

const CHROMATIN =
  'M-46 -10C-30 -44 -6 -22 8 -36S44 -30 40 -8 62 22 34 26 12 50 -6 38-38 50-40 24-62 8-46-10ZM-28 8C-12 -14 8 8 22 -8';

function chromatidPath(len: number, dir: number, trail: number, spread: number) {
  const tipX = -dir * trail * len * 0.85 + dir * spread;
  const tipY = len * (1 - 0.42 * trail);
  const midX = -dir * trail * len * 0.25;
  return `M${tipX} ${-tipY}Q${midX} ${-tipY * 0.45} 0 0Q${midX} ${tipY * 0.45} ${tipX} ${tipY}`;
}

function cellOutline(pinch: number) {
  const points: string[] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    const x = 400 + 305 * (1 + 0.04 * pinch) * Math.cos(a);
    const waist = 1 - pinch * Math.exp(-((x - 400) ** 2) / (2 * 42 ** 2));
    points.push(`${x.toFixed(1)} ${(280 + 200 * Math.sin(a) * waist).toFixed(1)}`);
  }
  return `M${points.join('L')}Z`;
}

function MitosisScene({ t, kind }: { t: number; kind: Kind }) {
  const condensed = smooth(1, 1.9, t) * (1 - smooth(5.1, 5.85, t));
  const envelope = 1 - smooth(1.7, 2.5, t);
  const newEnvelope = smooth(5.1, 5.7, t);
  const spindle = smooth(2, 2.8, t) * (1 - smooth(5.2, 5.8, t));
  const toMeta = smooth(2.2, 3.2, t);
  const part = smooth(4, 4.9, t);
  const trail = smooth(4.02, 4.45, t) * (1 - smooth(5, 5.5, t));
  const cyto = smooth(5.25, 6, t);
  const grow = 1 + 0.12 * smooth(1, 1.8, t) * (1 - smooth(1.7, 2.4, t));
  const poleOut = smooth(1.1, 2.3, t);
  const polePos = lerp(40, 268, poleOut);

  return (
    <>
      {kind === 'animal' ? (
        <path d={cellOutline(cyto)} fill="#f4dcae" stroke="#cf9440" strokeWidth="6" />
      ) : (
        <>
          <rect x="72" y="62" width="656" height="436" rx="18" fill="#7cae6c" stroke="#3f7a44" strokeWidth="7" />
          <rect x="86" y="76" width="628" height="408" rx="12" fill="#f4e8b4" stroke="#c9a23e" strokeWidth="3" />
          <rect x="396" y={280 - 204 * cyto} width="8" height={408 * cyto} rx="3" fill="#6d9a58" />
        </>
      )}

      <g opacity={spindle} stroke="#9fd8cf" strokeWidth="2.2" fill="none">
        {[-120, -70, -30, 30, 70, 120, 0].map((k) => (
          <path key={k} d={`M${400 - polePos} 280Q400 ${280 + k * 1.3} ${400 + polePos} 280`} />
        ))}
        {kind === 'animal' &&
          [-1, 1].map((side) =>
            [150, 175, 205, 240, 270, 298].map((deg) => {
              const r = (deg * Math.PI) / 180;
              return (
                <line
                  key={`${side}${deg}`}
                  x1={400 + side * polePos}
                  y1="280"
                  x2={400 + side * (polePos + Math.abs(Math.cos(r)) * 46)}
                  y2={280 + Math.sin(r) * 46}
                />
              );
            }),
          )}
      </g>

      {kind === 'animal' &&
        [-1, 1].map((side) => (
          <g key={side} transform={`translate(${400 + side * polePos} ${lerp(112, 280, poleOut)})`}>
            <rect x="-10" y="-5" width="20" height="10" rx="3" fill="#f7f4e4" stroke="#7a7656" />
            <rect x="-5" y="-10" width="10" height="20" rx="3" fill="#f7f4e4" stroke="#7a7656" />
          </g>
        ))}

      <g transform={`translate(400 280) scale(${grow})`} opacity={1}>
        <circle r="112" fill="#d9c6ee" fillOpacity={0.75 * envelope} stroke="#6b3fa0" strokeWidth="4" strokeDasharray="14 7" strokeOpacity={envelope} />
        <circle cx="42" cy="-52" r="20" fill="#5a2e91" opacity={envelope * (1 - smooth(1.5, 2.2, t))} />
        <path d={CHROMATIN} transform="scale(1.45)" fill="none" stroke="#6a43a8" strokeWidth="3" opacity={(1 - condensed) * (t < 3 ? 1 : 0)} />
      </g>

      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${400 + side * 212} 280)`} opacity={newEnvelope}>
          <circle r="82" fill="#d9c6ee" fillOpacity="0.72" stroke="#6b3fa0" strokeWidth="4" strokeDasharray="12 6" />
          <circle cx="26" cy="-30" r="13" fill="#5a2e91" />
          <path d={CHROMATIN} fill="none" stroke="#6a43a8" strokeWidth="2.6" />
        </g>
      ))}

      {CHROMOSOMES.map((c, i) => {
        const y0 = lerp(c.sy, c.ym, toMeta);
        const baseRot = lerp(c.rot, 0, toMeta);
        const thick = lerp(3, 12, condensed);
        const opacity = clamp(condensed * 1.6);
        return [-1, 1].map((side) => {
          const x = lerp(lerp(c.sx, 400, toMeta), 400 + side * 212, part) + side * (part > 0 ? 0 : 5);
          const y = lerp(y0, 280 + (c.ym - 280) * 0.62, part);
          return (
            <g key={`${i}${side}`} transform={`translate(${x} ${y}) rotate(${baseRot})`} opacity={opacity}>
              <path
                d={chromatidPath(c.len * lerp(1, 1.3, 1 - condensed), side, trail, 5 * (1 - part))}
                fill="none"
                stroke={c.color}
                strokeWidth={thick}
                strokeLinecap="round"
              />
              <circle r={thick * 0.55} fill="#fff4cc" />
            </g>
          );
        });
      })}

      {kind === 'plant' && (
        <text x="400" y="54" textAnchor="middle" className="svg-label">
          উদ্ভিদকোষে সেন্ট্রিওল ও অ্যাস্টার থাকে না
        </text>
      )}
    </>
  );
}

function StageQuiz({ kind }: { kind: Kind }) {
  const rounds = useMemo(() => shuffle([0, 1, 2, 3, 4, 5]), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(false);

  if (i >= rounds.length) {
    return (
      <div className="panel" role="status">
        <h3>
          ফলাফল: {bn(score)}/{bn(rounds.length)}
        </h3>
        <button type="button" className="btn btn-lab" onClick={() => { setI(0); setScore(0); }}>
          আবার খেলো
        </button>
      </div>
    );
  }

  const answer = rounds[i];
  return (
    <div className="panel">
      <h4>
        ছবি দেখে ধাপ চেনো ({bn(i + 1)}/{bn(rounds.length)})
      </h4>
      <svg viewBox="0 0 800 560" role="img" aria-label="অজানা ধাপের কোষ" style={{ width: '100%', background: '#16292c', borderRadius: 8 }}>
        <MitosisScene t={answer === 0 ? 0.4 : answer + 0.55} kind={kind} />
      </svg>
      <div className="chips">
        {STAGES.map((s, k) => (
          <button
            key={s.name}
            type="button"
            className="chip-btn"
            onClick={() => {
              if (k === answer) {
                if (!wrong) setScore(score + 1);
                setWrong(false);
                setI(i + 1);
              } else {
                setWrong(true);
              }
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      {wrong && <p style={{ color: '#ffb199' }}>হয়নি, ক্রোমোজোম কোথায় আছে দেখো।</p>}
    </div>
  );
}

export default function MitosisLab() {
  const [t, setT] = useState(0);
  const [kind, setKind] = useState<Kind>('animal');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<'watch' | 'quiz'>('watch');

  useTick(
    () =>
      setT((v) => {
        const next = v + 0.016 * speed;
        if (next >= MAX_T) {
          setPlaying(false);
          return MAX_T;
        }
        return next;
      }),
    33,
    playing,
  );

  const index = Math.min(Math.floor(t), STAGES.length - 1);
  const stage = STAGES[index];
  // Once sisters separate each chromatid counts as a chromosome, so the cell briefly holds 8.
  const separated = t >= 4.05;
  const cells = t >= 5.95 ? 2 : 1;
  const inCell = cells === 2 ? 4 : separated ? 8 : 4;
  const armsEach = t < 1 ? '—' : separated ? bn(1) : bn(2);

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="কোষের ধরন" value={kind} onChange={setKind} options={[{ value: 'animal', label: 'প্রাণিকোষ' }, { value: 'plant', label: 'উদ্ভিদকোষ' }]} />
        <Seg label="ল্যাবের ধরন" value={mode} onChange={(m) => { setMode(m); setPlaying(false); }} options={[{ value: 'watch', label: 'দেখো ও চালাও' }, { value: 'quiz', label: 'ধাপ চেনো' }]} />
      </div>
      {mode === 'quiz' ? (
        <StageQuiz kind={kind} />
      ) : (
        <LabGrid
          view={
            <>
              <svg viewBox="0 0 800 560" role="img" aria-label={`মাইটোসিস: ${stage.name}`} style={{ background: '#16292c' }}>
                <MitosisScene t={t} kind={kind} />
              </svg>
              <div className="timeline">
                <input
                  type="range" min={0} max={MAX_T} step={0.01} value={t} aria-label="বিভাজনের সময়রেখা"
                  onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }}
                />
                <div className="timeline-marks">
                  {STAGES.map((s, i) => (
                    <button key={s.name} type="button" aria-pressed={i === index} onClick={() => { setPlaying(false); setT(i + 0.55); }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          }
          side={
            <>
              <div className="panel" aria-live="polite">
                <h4>এখন চলছে</h4>
                <h3>{stage.name}</h3>
                <p>{stage.text}</p>
              </div>
              <div className="stepnav" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="btn btn-hot"
                  onClick={() => {
                    if (t >= MAX_T) setT(0);
                    setPlaying(!playing);
                  }}
                >
                  {playing ? '⏸ থামাও' : t >= MAX_T ? '↺ আবার চালাও' : '▶ চালাও'}
                </button>
              </div>
              <Range label="গতি" value={speed} min={0.5} max={3} step={0.5} display={`${bn(speed)}×`} onChange={setSpeed} />
              <div className="stats">
                <Stat label={cells === 2 ? 'প্রতি কোষে ক্রোমোজোম' : 'কোষে ক্রোমোজোম'} value={bn(inCell)} />
                <Stat label="ক্রোমোজোম প্রতি ক্রোমাটিড" value={armsEach} />
                <Stat label="কোষের সংখ্যা" value={bn(cells)} />
              </div>
              <p className="panel-note" style={{ color: 'var(--stage-soft)', fontSize: 14, margin: 0 }}>
                উদাহরণ কোষে 2n = 4। নীল ও কমলা রঙ পিতা-মাতার কাছ থেকে পাওয়া ক্রোমোজোম বোঝায়। অ্যানাফেজে ক্রোমাটিড আলাদা হলে প্রতিটিই একটি ক্রোমোজোম, তাই কিছুক্ষণ কোষে ৮টি থাকে। শেষে প্রতিটি অপত্য কোষে আবার ৪টি।
              </p>
            </>
          }
        />
      )}
    </Stage>
  );
}
