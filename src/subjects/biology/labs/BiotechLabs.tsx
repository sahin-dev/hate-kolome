import { useState } from 'react';
import { LabGrid, OrderGame, PredictBox, Range, Seg, Stage } from '../../../components/labkit';
import { SITE, culture, rdna, type CultureState, type RdnaState } from './models/life';
import { INIT, SCENARIOS } from './models/scenarios';

const ENZYMES = [{ value: 'EcoRI' as const, label: 'EcoRI' }, { value: 'BamHI' as const, label: 'BamHI' }];

function Plasmid({ s, stage, ok }: { s: RdnaState; stage: string; ok: boolean }) {
  const joined = s.plasmidCut === s.donorCut && s.ligase;
  const inside = joined && s.transform;
  const k = inside ? 0.5 : 1;
  const cx = inside ? 280 : 170;
  return (
    <svg viewBox="0 0 560 300" role="img" aria-label={ok ? 'রিকম্বিনেন্ট ব্যাকটেরিয়া তৈরি' : 'প্রক্রিয়া থেমে গেছে'} style={{ background: '#16292c' }}>
      {inside && <rect x="80" y="50" width="400" height="200" rx="100" fill="#a5d98c" stroke="#2f8147" strokeWidth="4" />}
      <circle cx={cx} cy="150" r={80 * k} fill="none" stroke="#7fb8ff" strokeWidth={12 * k} strokeDasharray={joined ? undefined : `${360 * k} ${60 * k}`} transform={`rotate(-68 ${cx} 150)`} />
      {joined && <path d={`M${cx + 29 * k} ${150 - 75 * k}A${80 * k} ${80 * k} 0 0 1 ${cx + 75 * k} ${150 - 29 * k}`} fill="none" stroke="#ff8a5c" strokeWidth={12 * k} />}
      <text x={cx} y="156" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">প্লাজমিড</text>
      {!joined && (
        <>
          <line x1="340" y1="150" x2="520" y2="150" stroke="#ff8a5c" strokeWidth="12" />
          <text x="430" y="130" textAnchor="middle" className="svg-label" fontSize="14">কাঙ্ক্ষিত জিন</text>
          <text x="430" y="182" textAnchor="middle" className="svg-label" fontSize="13">{SITE[s.donorCut]} ক্রমে কাটা</text>
        </>
      )}
      {stage === 'done' && [[130, 60], [430, 60], [130, 240], [430, 240]].map(([x, y]) => <circle key={x + y} cx={x} cy={y} r="16" fill="#6fd09a" stroke="#2f8147" strokeWidth="3" />)}
    </svg>
  );
}

export function RecombinantLab() {
  const [s, setS] = useState<RdnaState>({ ...INIT.rdna, donorCut: 'BamHI', ligase: false, transform: false, antibiotic: false });
  const r = rdna(s);
  const flip = (key: 'ligase' | 'transform' | 'antibiotic', label: string) => (
    <button type="button" className="chip-btn" aria-pressed={s[key]} onClick={() => setS({ ...s, [key]: !s[key] })}>{s[key] ? '✓' : '○'} {label}</button>
  );

  return (
    <Stage>
      <LabGrid
        view={<Plasmid s={s} stage={r.stage} ok={r.ok} />}
        side={
          <>
            <div className="panel">
              <h4>প্লাজমিড কাটার এনজাইম</h4>
              <Seg label="প্লাজমিডের এনজাইম" value={s.plasmidCut} onChange={(plasmidCut) => setS({ ...s, plasmidCut })} options={ENZYMES} />
              <h4 style={{ marginTop: 8 }}>দাতা DNA কাটার এনজাইম</h4>
              <Seg label="দাতার এনজাইম" value={s.donorCut} onChange={(donorCut) => setS({ ...s, donorCut })} options={ENZYMES} />
              <div className="toggle-row" style={{ marginTop: 8 }}>
                {flip('ligase', 'লাইগেজ যোগ করো')}
                {flip('transform', 'ট্রান্সফরমেশন')}
                {flip('antibiotic', 'অ্যান্টিবায়োটিক প্লেটে বাছাই')}
              </div>
            </div>
            <div className="panel" aria-live="polite">
              <h3 style={{ color: r.ok ? '#8fe3b1' : '#ffb199' }}>{r.ok ? 'সফল!' : 'এখনো সম্পূর্ণ হয়নি'}</h3>
              <p>{r.text}</p>
            </div>
            <PredictBox scenarios={SCENARIOS.rdna} onRun={(set) => setS({ ...INIT.rdna, ...set })} />
            <p className="fb">এনজাইমের নাম ও অ্যান্টিবায়োটিক বাছাই বইয়ের চেয়ে কিছুটা বিস্তারিত। এই কৌশলেই E. coli দিয়ে মানব ইনসুলিন তৈরি হয়।</p>
          </>
        }
      />
    </Stage>
  );
}

const FATE_ART: Record<string, { color: string; label: string }> = {
  contaminated: { color: '#6a7a4a', label: 'ছত্রাকে ঢাকা' },
  starved: { color: '#a89a6a', label: 'বৃদ্ধি নেই' },
  slow: { color: '#a8b06a', label: 'দুর্বল বৃদ্ধি' },
  noroot: { color: '#6fd09a', label: 'মূলহীন চারা' },
  virus: { color: '#b9c25a', label: 'রোগা চারা' },
  clean: { color: '#3f9f5e', label: 'সুস্থ চারা' },
};

export function CultureLab() {
  const [s, setS] = useState<CultureState>(INIT.culture);
  const [mode, setMode] = useState<'run' | 'order'>('run');
  const r = culture(s);
  const art = FATE_ART[r.fate];
  const flip = (key: 'sterile' | 'healthyParent' | 'sugar' | 'rootStage', label: string) => (
    <button type="button" className="chip-btn" aria-pressed={s[key]} onClick={() => setS({ ...s, [key]: !s[key] })}>{s[key] ? '✓' : '✗'} {label}</button>
  );

  if (mode === 'order') {
    return (
      <>
        <OrderGame
          prompt="টিস্যু কালচারের ধাপগুলো ঠিক ক্রমে চাপ দাও।"
          steps={[
            { name: 'মাতৃ উদ্ভিদ নির্বাচন', detail: 'উন্নত গুণের, রোগমুক্ত উদ্ভিদ থেকে এক্সপ্ল্যান্ট নেওয়া হয়।' },
            { name: 'কালচার মাধ্যম তৈরি', detail: 'লবণ, ভিটামিন, হরমোন, সুক্রোজ ও অ্যাগার মেশানো হয়।' },
            { name: 'জীবাণুমুক্ত করে এক্সপ্ল্যান্ট স্থাপন', detail: 'অটোক্লেভে ১২১°C, ১৫ পাউন্ড চাপে ২০ মিনিট।' },
            { name: 'অণুচারা বা ক্যালাস তৈরি', detail: '২৫±২°C ও নিয়ন্ত্রিত আলোয় কোষ বিভাজন চলে।' },
            { name: 'মূল উৎপাদক মাধ্যমে স্থানান্তর', detail: 'অণুচারায় মূল গজায়।' },
            { name: 'প্রাকৃতিক পরিবেশে স্থানান্তর', detail: 'ধীরে ধীরে অভ্যস্ত করে মাটিতে লাগানো হয়।' },
          ]}
        />
        <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setMode('run')}>← পরীক্ষাগারে ফেরো</button>
      </>
    );
  }

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 400 320" role="img" aria-label={art.label} style={{ background: '#16292c' }}>
            <path d="M150 40V120L80 270Q70 295 100 295H300Q330 295 320 270L250 120V40Z" fill="#1c3438" stroke="#d6e8ef" strokeWidth="4" />
            <path d="M92 245L80 270Q70 295 100 295H300Q330 295 320 270L308 245Z" fill="#e9dcb4" />
            <rect x="140" y="26" width="120" height="18" rx="4" fill="#b58e5e" />
            {r.fate === 'contaminated' ? (
              [130, 190, 250, 280].map((x, i) => <circle key={x} cx={x} cy={238 - (i % 2) * 8} r={18 + i * 3} fill={art.color} />)
            ) : (
              <>
                <path d="M200 245V170" stroke={art.color} strokeWidth="6" />
                {[205, 185].map((y) => [-1, 1].map((d) => <path key={`${y}${d}`} d={`M200 ${y}q${d * 20} -16 ${d * 44} -6q${d * -22} 14 ${d * -44} 6Z`} fill={art.color} />))}
                {r.fate !== 'noroot' && r.fate !== 'starved' && <path d="M200 245q-16 18-30 26M200 245q16 18 30 26M200 245v32" stroke="#f1ead2" strokeWidth="3" fill="none" />}
              </>
            )}
            <text x="200" y="20" textAnchor="middle" className="svg-label" fontSize="14">{art.label}</text>
          </svg>
        }
        side={
          <>
            <div className="toggle-row">
              {flip('sterile', 'অটোক্লেভে জীবাণুমুক্ত')}
              {flip('healthyParent', 'রোগমুক্ত মাতৃগাছ')}
              {flip('sugar', 'মাধ্যমে সুক্রোজ')}
              {flip('rootStage', 'মূল উৎপাদক ধাপ')}
            </div>
            <Range label="ঘরের তাপমাত্রা" value={s.temp} min={15} max={38} display={`${s.temp}°C`} onChange={(temp) => setS({ ...s, temp })} />
            <div className="panel" aria-live="polite">
              <h3 style={{ color: r.ok && r.fate === 'clean' ? '#8fe3b1' : '#ffb199' }}>{art.label}</h3>
              <p>{r.text}</p>
            </div>
            <PredictBox scenarios={SCENARIOS.culture} onRun={(set) => setS({ ...INIT.culture, ...set })} />
            <button type="button" className="btn btn-lab" onClick={() => setMode('order')}>ধাপগুলো ক্রমে সাজাও</button>
          </>
        }
      />
    </Stage>
  );
}
