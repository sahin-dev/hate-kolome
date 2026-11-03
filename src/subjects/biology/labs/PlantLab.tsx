import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LabGrid, Meter, Seg, Stage, Stat, useTick } from '../../../components/labkit';
import { bn } from '../../../core/util';

type Level = 'plant' | 'leaf' | 'chloroplast';

const PARTS: Record<string, { name: string; role: string }> = {
  sun: { name: 'সূর্য', role: 'আলোর ফোটনই শক্তির উৎস। আলো ছাড়া আলোকনির্ভর পর্যায় চলে না।' },
  root: { name: 'মূল ও মূলরোম', role: 'মাটি থেকে অভিস্রবণে পানি ও খনিজ লবণ শোষণ করে। পানি ছাড়া ফটোলাইসিস হয় না।' },
  xylem: { name: 'জাইলেম', role: 'মৃত ভেসেল ও ট্রাকিডের নল। প্রস্বেদনের টানে পানি ও লবণ মূল থেকে পাতায় তোলে।' },
  phloem: { name: 'ফ্লোয়েম', role: 'পাতায় তৈরি শর্করা সিভনল দিয়ে গাছের সব অংশে, বিশেষ করে মূল ও ফলে পাঠায়।' },
  leaf: { name: 'পাতা', role: 'গাছের প্রধান খাদ্য কারখানা। চওড়া ফলকে আলো ধরে, শিরায় পানি আসে। ভেতরে মেসোফিল টিস্যু।' },
  cuticle: { name: 'কিউটিকল', role: 'পাতার ওপরের মোমের স্তর। অতিরিক্ত পানি হারানো কমায়, আলো পার হতে দেয়।' },
  palisade: { name: 'প্যালিসেড মেসোফিল', role: 'লম্বা কোষে ঠাসা ক্লোরোপ্লাস্ট। সবচেয়ে বেশি সালোকসংশ্লেষণ এখানেই হয়।' },
  spongy: { name: 'স্পঞ্জি মেসোফিল', role: 'ফাঁকা বায়ুকুঠুরি। CO₂ ছড়িয়ে কোষে পৌঁছায়, O₂ বেরিয়ে যায়।' },
  vein: { name: 'শিরা (পরিবহন গুচ্ছ)', role: 'জাইলেম পানি আনে, ফ্লোয়েম শর্করা নিয়ে যায়।' },
  stoma: { name: 'পত্ররন্ধ্র', role: 'দুটি রক্ষীকোষের মাঝের ছিদ্র। আলো ও পর্যাপ্ত পানিতে খোলে; CO₂ ঢোকে, O₂ ও জলীয়বাষ্প বের হয়। চাপ দিলে খোলা বা বন্ধ হবে।' },
  envelope: { name: 'দ্বিস্তর ঝিল্লি', role: 'ক্লোরোপ্লাস্টকে ঘিরে রাখে, বস্তুর চলাচল নিয়ন্ত্রণ করে।' },
  grana: { name: 'গ্রানা (থাইলাকয়েড)', role: 'মুদ্রার মতো থাক। ক্লোরোফিল আলো ধরে; পানি ভেঙে ATP ও NADPH হয়। আলোকনির্ভর পর্যায়ের কেন্দ্র।' },
  stroma: { name: 'স্ট্রোমা', role: 'তরল অংশ। উৎসেচক ATP ও NADPH ব্যবহার করে CO₂ থেকে শর্করা বানায়। ক্যালভিন চক্রের কেন্দ্র।' },
};

const hotspot = (id: string, pick: (id: string) => void) => ({
  className: 'part',
  role: 'button',
  tabIndex: 0,
  'aria-label': PARTS[id].name,
  onClick: () => pick(id),
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(id);
    }
  },
});

interface SceneProps {
  sun: boolean;
  water: number;
  stoma: boolean;
  working: boolean;
  pick: (id: string) => void;
}

function Particles({ path, color, label, n = 3, dur = 3 }: { path: string; color: string; label: string; n?: number; dur?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <circle r="14" fill={color} />
          <text textAnchor="middle" y="4" fontSize="11" fontWeight="700" fill="#10201c">{label}</text>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${(-i * dur) / n}s`} path={path} />
        </g>
      ))}
    </>
  );
}

function PlantScene({ sun, water, stoma, working, pick }: SceneProps) {
  const moist = water >= 15;
  return (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sun ? '#8fd3f4' : '#12203f'} />
          <stop offset="1" stopColor={sun ? '#def4e0' : '#27395f'} />
        </linearGradient>
      </defs>
      <rect width="900" height="430" fill="url(#sky)" />
      <rect y="430" width="900" height="170" fill={water > 50 ? '#5a3d28' : water > 15 ? '#7d5a3a' : '#a78a62'} />

      <g {...hotspot('sun', pick)}>
        <circle cx="120" cy="90" r="54" fill={sun ? '#f8c63f' : '#c9cedb'} />
        {sun &&
          [0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <line key={d} x1="120" y1="20" x2="120" y2="2" stroke="#f8c63f" strokeWidth="6" strokeLinecap="round" transform={`rotate(${d} 120 90)`} />
          ))}
      </g>
      <g {...hotspot('root', pick)}>
        <path d="M450 430C450 470 440 500 400 545M450 440C460 480 470 500 510 555M450 450C450 490 452 530 448 585M446 470C420 480 390 482 350 500M455 470C490 480 520 490 560 500" stroke="#e8d7b8" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M350 500l-14-8M350 500l-10 10M400 545l-14 2M400 545l-4 13M510 555l14 4M510 555l2 14M560 500l14-6M560 500l10 10" stroke="#e8d7b8" strokeWidth="3" fill="none" />
      </g>

      <g {...hotspot('xylem', pick)}>
        <rect x="434" y="160" width="16" height="290" fill="#6fa86b" />
        {moist && <line x1="442" y1="440" x2="442" y2="176" stroke="#7fd2ff" strokeWidth="5" className="flow" />}
        {!moist && <line x1="442" y1="440" x2="442" y2="176" stroke="#415d68" strokeWidth="5" />}
      </g>
      <g {...hotspot('phloem', pick)}>
        <rect x="450" y="160" width="16" height="290" fill="#5d955b" />
        {working ? (
          <line x1="458" y1="176" x2="458" y2="440" stroke="#ffc65c" strokeWidth="5" className="flow" />
        ) : (
          <line x1="458" y1="176" x2="458" y2="440" stroke="#7a6a45" strokeWidth="5" />
        )}
      </g>

      <g {...hotspot('leaf', pick)}>
        <path d="M455 195C520 90 680 70 800 130 740 240 590 280 455 195Z" fill={moist ? '#3f9f5e' : '#88a553'} stroke="#1d5f39" strokeWidth="4" />
        <path d="M455 195C570 170 690 150 800 130M560 172 590 110M640 158 680 100M580 170 640 232M660 154 720 196" stroke="#1d5f39" strokeWidth="2.5" fill="none" />
        <path d="M442 225C380 130 240 120 150 170 200 270 330 310 442 225Z" fill={moist ? '#46aa66' : '#92ad5c'} stroke="#1d5f39" strokeWidth="4" />
        <path d="M442 225C350 200 250 185 150 170M350 205 320 142M270 192 230 145M340 202 300 266M260 190 220 234" stroke="#1d5f39" strokeWidth="2.5" fill="none" />
      </g>

      {sun &&
        [[195, 70, 560, 118], [160, 150, 290, 172]].map(([a, b, c, d]) => (
          <line key={a} x1={a} y1={b} x2={c} y2={d} stroke="#f8c63f" strokeWidth="4" className="flow" />
        ))}
      {stoma && <Particles path="M880 40Q820 90 700 150" color="#c5d3dc" label="CO₂" />}
      {working && <Particles path="M620 240Q700 300 860 330" color="#b8f0c8" label="O₂" />}
      {moist && <Particles path="M442 590 L442 180" color="#7fd2ff" label="H₂O" n={3} dur={5} />}
      {working && <Particles path="M458 200 L458 560" color="#ffc65c" label="চিনি" n={2} dur={6} />}

      <text x="888" y="586" textAnchor="end" className="svg-label">অঙ্গে চাপ দিয়ে কাজ জানো</text>
    </>
  );
}

function LeafScene({ sun, water, stoma, working, pick }: SceneProps) {
  const moist = water >= 15;
  const gap = stoma ? 15 : 2;
  return (
    <>
      <rect width="900" height="600" fill="#102629" />
      {sun && [150, 350, 550, 750].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="130" stroke="#f8c63f" strokeWidth="5" className="flow" />)}

      <g {...hotspot('cuticle', pick)}>
        <rect x="30" y="50" width="840" height="16" rx="6" fill="#e6efc9" />
        <text x="450" y="38" textAnchor="middle" className="svg-label">কিউটিকল ও উপরের এপিডার্মিস</text>
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={i} x={30 + i * 65} y="68" width="62" height="34" rx="6" fill="#cce8c0" stroke="#7bb17a" />
        ))}
      </g>

      <g {...hotspot('palisade', pick)}>
        {Array.from({ length: 19 }, (_, i) => (
          <g key={i} transform={`translate(${34 + i * 44} 106)`}>
            <rect width="40" height="130" rx="16" fill="#7dc47f" stroke="#2f8147" strokeWidth="2.5" />
            {[20, 42, 64, 86, 108].map((y, k) => (
              <ellipse key={y} cx={k % 2 ? 14 : 26} cy={y} rx="9" ry="6" fill={working ? '#1f8f46' : '#2c6b43'} />
            ))}
          </g>
        ))}
      </g>

      <g {...hotspot('spongy', pick)}>
        {[[70, 290, 44, 32], [185, 310, 52, 36], [80, 395, 46, 34], [205, 410, 42, 30], [300, 280, 40, 30], [300, 390, 50, 30], [640, 285, 48, 32], [740, 310, 46, 36], [830, 280, 36, 28], [640, 400, 46, 32], [750, 415, 50, 30], [840, 385, 34, 32]].map(([x, y, rx, ry]) => (
          <g key={`${x}${y}`}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#9bd59b" stroke="#2f8147" strokeWidth="2.5" />
            <circle cx={x - 14} cy={y} r="7" fill="#2c8a4a" />
            <circle cx={x + 14} cy={y + 8} r="7" fill="#2c8a4a" />
          </g>
        ))}
      </g>

      <g {...hotspot('vein', pick)}>
        <circle cx="470" cy="340" r="88" fill="#d5e7b7" stroke="#6a9a58" strokeWidth="4" />
        <circle cx="470" cy="305" r="40" fill="#82ccf0" stroke="#2b7fa6" strokeWidth="3" />
        <circle cx="470" cy="378" r="32" fill="#f7d078" stroke="#b78627" strokeWidth="3" />
        <text x="470" y="310" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">জাইলেম</text>
        <text x="470" y="384" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">ফ্লোয়েম</text>
      </g>

      <g>
        {Array.from({ length: 13 }, (_, i) =>
          i === 6 ? null : <rect key={i} x={30 + i * 65} y="466" width="62" height="34" rx="6" fill="#cce8c0" stroke="#7bb17a" />,
        )}
        <g {...hotspot('stoma', pick)}>
          <rect x="400" y="456" width="130" height="60" fill="transparent" />
          <path d={`M${465 - gap - 44} 492Q${465 - gap - 20} 450 ${465 - gap} 478Q${465 - gap - 6} 500 ${465 - gap - 44} 492Z`} fill="#5cb872" stroke="#1f6b3f" strokeWidth="3" />
          <path d={`M${465 + gap + 44} 492Q${465 + gap + 20} 450 ${465 + gap} 478Q${465 + gap + 6} 500 ${465 + gap + 44} 492Z`} fill="#5cb872" stroke="#1f6b3f" strokeWidth="3" />
        </g>
        <text x="465" y="545" textAnchor="middle" className="svg-label">পত্ররন্ধ্র {stoma ? '(খোলা)' : '(বন্ধ)'}: চাপ দাও</text>
      </g>

      {stoma && <Particles path="M465 590 L465 500 Q440 420 300 340" color="#c5d3dc" label="CO₂" />}
      {stoma && <Particles path="M210 300 Q400 400 480 500 L490 590" color="#d9f7e2" label="বাষ্প" n={2} dur={4} />}
      {working && <Particles path="M650 300 Q520 420 466 500 L440 590" color="#b8f0c8" label="O₂" />}
      {moist && <Particles path="M470 300 Q400 210 300 170" color="#7fd2ff" label="H₂O" n={2} dur={3.6} />}
      {working && <Particles path="M300 160 Q400 260 470 380" color="#ffc65c" label="চিনি" n={2} dur={4} />}
    </>
  );
}

function ChloroplastScene({ sun, working, pick }: SceneProps) {
  return (
    <>
      <rect width="900" height="600" fill="#102629" />
      <g {...hotspot('envelope', pick)}>
        <ellipse cx="450" cy="310" rx="400" ry="240" fill="#2a7b4c" />
      </g>
      <g {...hotspot('stroma', pick)}>
        <ellipse cx="450" cy="310" rx="384" ry="224" fill="#b8e0a8" />
        <text x="640" y="490" textAnchor="middle" className="svg-label svg-label-dark">স্ট্রোমা</text>
      </g>
      <g {...hotspot('grana', pick)}>
        {[[230, 240], [400, 200], [570, 240], [300, 400], [500, 400]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={x - 48} y={y - 42 + i * 18} width="96" height="15" rx="7" fill={working ? '#1f9a4c' : '#2c6b43'} stroke="#0f4d2a" strokeWidth="2" />
            ))}
          </g>
        ))}
        <path d="M278 240H352M448 200H522M348 400H452M260 280L300 358M540 280L510 358" stroke="#2c6b43" strokeWidth="9" fill="none" />
        <text x="400" y="150" textAnchor="middle" className="svg-label svg-label-dark">গ্রানা</text>
      </g>
      {sun && <Particles path="M80 20 L240 220" color="#f8c63f" label="আলো" n={3} dur={2.4} />}
      {working && <Particles path="M300 400 Q450 480 640 400 T760 300" color="#ffc65c" label="ATP" n={3} dur={4.5} />}
    </>
  );
}

export default function PlantLab() {
  const [level, setLevel] = useState<Level>('plant');
  const [sun, setSun] = useState(true);
  const [water, setWater] = useState(70);
  const [stomaWanted, setStomaWanted] = useState(true);
  const [selected, setSelected] = useState<string | null>('leaf');
  const [sugar, setSugar] = useState(0);
  const [oxygen, setOxygen] = useState(0);

  const hasWater = water >= 15;
  const stoma = stomaWanted && sun && hasWater;
  const working = sun && hasWater && stoma;

  useTick(() => {
    if (stoma) setWater((w) => Math.max(0, w - 1.6));
    if (working) {
      setSugar((s) => s + 1);
      setOxygen((o) => o + 6);
    }
  }, 900);

  const pick = (id: string) => {
    setSelected(id);
    if (id === 'stoma') setStomaWanted((v) => !v);
    if (id === 'sun') setSun((v) => !v);
  };

  const part = selected ? PARTS[selected] : null;
  const needs = [
    { label: 'আলো', ok: sun },
    { label: 'পানি', ok: hasWater },
    { label: 'CO₂', ok: stoma },
    { label: 'ক্লোরোফিল', ok: true },
  ];

  let reason = 'সব উপকরণ আছে। পাতায় খাদ্য তৈরি চলছে!';
  if (!sun) reason = 'আলো নেই। আলোকনির্ভর পর্যায় থেমে গেছে, পত্ররন্ধ্রও বন্ধ হয়েছে। শ্বসন কিন্তু চলছে।';
  else if (!hasWater) reason = 'মাটিতে পানি কম। রক্ষীকোষ স্ফীতি হারিয়ে পত্ররন্ধ্র বন্ধ করে দিয়েছে, তাই CO₂ ঢুকছে না।';
  else if (!stomaWanted) reason = 'পত্ররন্ধ্র বন্ধ। পানি ও আলো থাকলেও CO₂ ছাড়া শর্করা তৈরি হয় না।';

  const props = { sun, water, stoma, working, pick };

  return (
    <Stage>
      <div className="stage-bar">
        <Seg
          label="দৃষ্টির স্তর"
          value={level}
          onChange={(l) => { setLevel(l); setSelected(l === 'plant' ? 'leaf' : l === 'leaf' ? 'palisade' : 'grana'); }}
          options={[{ value: 'plant', label: 'পুরো গাছ' }, { value: 'leaf', label: 'পাতার ভেতর' }, { value: 'chloroplast', label: 'ক্লোরোপ্লাস্ট' }]}
        />
      </div>
      <LabGrid
        view={
          <svg viewBox="0 0 900 600" role="group" aria-label="সালোকসংশ্লেষণের দৃশ্য">
            {level === 'plant' && <PlantScene {...props} />}
            {level === 'leaf' && <LeafScene {...props} />}
            {level === 'chloroplast' && <ChloroplastScene {...props} />}
          </svg>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              <h4>কী ঘটছে</h4>
              <p style={{ color: working ? '#8fe3b1' : '#ffb199' }}>{reason}</p>
              <div className="chips">
                {needs.map((n) => (
                  <span key={n.label} className="tag">
                    {n.ok ? '✓' : '✗'} {n.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="stepnav" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-hot" onClick={() => setSun(!sun)}>
                {sun ? 'আলো নেভাও' : 'আলো জ্বালাও'}
              </button>
              <button type="button" className="btn btn-lab" onClick={() => setWater(Math.min(100, water + 40))}>
                পানি দাও
              </button>
              <button type="button" className="btn btn-lab" aria-pressed={stomaWanted} onClick={() => setStomaWanted(!stomaWanted)}>
                পত্ররন্ধ্র {stomaWanted ? 'বন্ধ করো' : 'খোলো'}
              </button>
            </div>
            <Meter label="মাটির পানি" value={water / 100} color="#7fd2ff" />
            <div className="stats">
              <Stat label="গ্লুকোজ (অণু)" value={bn(sugar)} />
              <Stat label="ত্যাগ করা O₂" value={bn(oxygen)} />
            </div>
            {part && (
              <div className="panel" aria-live="polite">
                <h3>{part.name}</h3>
                <p>{part.role}</p>
              </div>
            )}
            {level === 'chloroplast' && (
              <>
                <Link className="btn btn-hot" to="/biology/ch04/lab/chloroplast">
                  ক্লোরোপ্লাস্ট নিজে চালাও →
                </Link>
                <Link className="btn btn-lab" to="/biology/ch02/lab/cell?close=chloro">
                  🔬 প্রতিটি অণুর হিসাব দেখো
                </Link>
              </>
            )}
          </>
        }
      />
    </Stage>
  );
}
