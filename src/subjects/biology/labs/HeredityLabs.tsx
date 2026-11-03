import { useMemo, useState } from 'react';
import { LabGrid, Seg, Stage, Stat } from '../../../components/labkit';
import { bn, shuffle } from '../../../core/util';
import { CROSSES, EVIDENCE, SUSPECTS, matches, punnett, ratio, selection } from './models/life';

const PAIR: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const BASE_COLOR: Record<string, string> = { A: '#ffd166', T: '#ff8a5c', G: '#6fd09a', C: '#7fb8ff' };
const BONDS: Record<string, number> = { A: 2, T: 2, G: 3, C: 3 };

function Strand({ template, fill, oldTop, oldBottom, y }: { template: string[]; fill: string[]; oldTop: boolean; oldBottom: boolean; y: number }) {
  const gap = 66;
  return (
    <g transform={`translate(30 ${y})`}>
      <rect x="-12" y="-44" width={template.length * gap + 4} height="10" rx="5" fill={oldTop ? '#e6dfc5' : '#c58bff'} />
      <rect x="-12" y="58" width={template.length * gap + 4} height="10" rx="5" fill={oldBottom ? '#e6dfc5' : '#c58bff'} />
      {template.map((b, i) => (
        <g key={i} transform={`translate(${i * gap} 0)`}>
          <rect x="0" y="-34" width="44" height="40" rx="5" fill={BASE_COLOR[b]} />
          <text x="22" y="-8" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1a241f">{b}</text>
          {fill[i] ? (
            <>
              <rect x="0" y="18" width="44" height="40" rx="5" fill={BASE_COLOR[fill[i]]} />
              <text x="22" y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1a241f">{fill[i]}</text>
              {Array.from({ length: BONDS[b] }, (_, k) => <line key={k} x1={10 + k * 11} x2={10 + k * 11} y1="7" y2="17" stroke="#fff" strokeWidth="3" />)}
            </>
          ) : (
            <rect x="0" y="18" width="44" height="40" rx="5" fill="none" stroke="#6b8580" strokeDasharray="4 4" strokeWidth="2" />
          )}
        </g>
      ))}
    </g>
  );
}

export function DnaLab() {
  const template = useMemo(() => shuffle(['A', 'T', 'G', 'C', 'G', 'A', 'C', 'T']), []);
  const [fill, setFill] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [replicated, setReplicated] = useState(false);
  const next = fill.length;
  const done = next === template.length;
  const bonds = template.slice(0, next).reduce((a, b) => a + BONDS[b], 0);

  const place = (base: string) => {
    if (done) return;
    if (PAIR[template[next]] === base) {
      setFill([...fill, base]);
      setWrong(false);
    } else {
      setWrong(true);
    }
  };

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 590 330" role="img" aria-label="DNA অণুর ক্ষারক জোড়া" style={{ background: '#16292c' }}>
            {replicated ? (
              <>
                <Strand template={template} fill={fill} oldTop oldBottom={false} y={70} />
                <Strand template={fill} fill={template} oldTop oldBottom={false} y={240} />
              </>
            ) : (
              <Strand template={template} fill={fill} oldTop oldBottom={done} y={140} />
            )}
          </svg>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              {done ? (
                <>
                  <h3>{replicated ? 'অর্ধ-রক্ষণশীল অনুলিপি' : 'DNA সম্পূর্ণ!'}</h3>
                  <p>{replicated ? 'দুটি DNA-র প্রতিটিতে একটি পুরোনো (সাদা) ও একটি নতুন (বেগুনি) সূত্র।' : 'এবার সূত্র দুটি আলাদা করে অনুলিপি বানাও।'}</p>
                </>
              ) : (
                <>
                  <h4>ক্ষারক {bn(next + 1)}/{bn(template.length)}</h4>
                  <h3>{template[next]}-এর জোড়া কোনটি?</h3>
                  {wrong && <p style={{ color: '#ffb199' }}>মনে রাখো: A=T, G≡C।</p>}
                </>
              )}
            </div>
            <div className="chips">
              {['A', 'T', 'G', 'C'].map((b) => (
                <button key={b} type="button" className="btn btn-hot" style={{ background: BASE_COLOR[b] }} disabled={done} onClick={() => place(b)}>{b}</button>
              ))}
            </div>
            {done && (
              <div className="stepnav" style={{ marginTop: 0 }}>
                <button type="button" className="btn btn-hot" onClick={() => setReplicated(!replicated)}>{replicated ? 'মূল অণু দেখো' : 'অনুলিপি করো'}</button>
                <button type="button" className="btn btn-lab" onClick={() => { setFill([]); setReplicated(false); }}>আবার</button>
              </div>
            )}
            <Stat label="হাইড্রোজেন বন্ধন" value={bn(bonds)} />
            <p className="fb">প্রতি পূর্ণ ঘূর্ণনে ১০টি নিউক্লিওটাইড জোড়া ও ৩৪ Å। A=T-তে দুটি, G≡C-তে তিনটি বন্ধন, তাই G-C অংশ বেশি মজবুত।</p>
          </>
        }
      />
    </Stage>
  );
}

export function PunnettLab() {
  const [id, setId] = useState('f1');
  const [sample, setSample] = useState<string[]>([]);
  const c = CROSSES.find((x) => x.id === id)!;
  const kids = punnett(c);
  const counts = ratio(c);

  const haveChildren = (n: number) => {
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(c.read(kids[Math.floor(Math.random() * 4)]));
    setSample(out);
  };
  const tally = sample.reduce<Record<string, number>>((m, k) => ({ ...m, [k]: (m[k] ?? 0) + 1 }), {});

  return (
    <Stage>
      <div className="chips cell-types" role="group" aria-label="ক্রস">
        {CROSSES.map((x) => <button key={x.id} type="button" className="chip-btn" aria-pressed={x.id === id} onClick={() => { setId(x.id); setSample([]); }}>{x.label}</button>)}
      </div>
      <LabGrid
        view={
          <div className="punnett">
            <span />
            {c.b.gametes.map((g, i) => <strong key={i}>{g}</strong>)}
            {c.a.gametes.map((x, i) => [
              <strong key={`r${i}`}>{x}</strong>,
              ...c.b.gametes.map((_, j) => {
                const g = kids[i * 2 + j];
                const read = c.read(g);
                const risk = /খাটো|রোগী|বর্ণান্ধ/.test(read);
                return (
                  <div key={`${i}${j}`} className={risk ? 'pun pun-b' : 'pun pun-a'}>
                    <b>{g}</b>
                    <small>{read}</small>
                  </div>
                );
              }),
            ])}
          </div>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              <h3>{c.a.label} × {c.b.label}</h3>
              <p>{Object.entries(counts).map(([k, v]) => `${k} ${bn(v)}`).join(' : ')}</p>
              <p className="panel-note">{c.note}</p>
            </div>
            <div className="panel">
              <h4>অনুপাত কি সবসময় হুবহু মেলে?</h4>
              <div className="stepnav" style={{ marginTop: 0 }}>
                <button type="button" className="btn btn-lab" onClick={() => haveChildren(4)}>৪টি সন্তান</button>
                <button type="button" className="btn btn-lab" onClick={() => haveChildren(1000)}>১০০০টি সন্তান</button>
              </div>
              {sample.length > 0 && <p>{Object.entries(tally).map(([k, v]) => `${k}: ${bn(v)}`).join(' · ')}</p>}
              <p className="panel-note">অনুপাত সম্ভাবনা, নিশ্চয়তা নয়। মুদ্রা টসের মতো: ৪ জনে না-ও মিলতে পারে, অনেক সংখ্যায় কাছাকাছি আসে। প্রতিটি সন্তানের সম্ভাবনা আলাদাভাবে একই থাকে।</p>
            </div>
          </>
        }
      />
    </Stage>
  );
}

export function FingerprintLab() {
  const [picked, setPicked] = useState<string | null>(null);
  const lanes = [{ name: 'ঘটনাস্থলের নমুনা', bands: EVIDENCE }, ...SUSPECTS];

  return (
    <Stage>
      <LabGrid
        view={
          <div className="gel" role="img" aria-label="ইলেকট্রোফোরেসিসের ব্যান্ড">
            {lanes.map((l) => (
              <div key={l.name}>
                <div className="gel-lane">{l.bands.map((b) => <span key={b} className="gel-band" style={{ top: `${b}%` }} />)}</div>
                <div className="gel-name">{l.name}</div>
              </div>
            ))}
          </div>
        }
        side={
          <>
            <div className="panel">
              <h4>DNA ফিঙ্গারপ্রিন্টিং</h4>
              <p>রেস্ট্রিকশন এনজাইমে কাটা DNA-র খণ্ড ইলেকট্রোফোরেসিসে আকার অনুযায়ী আলাদা হয়ে ব্যান্ড গড়ে। কার সব ব্যান্ড ঘটনাস্থলের নমুনার সাথে মেলে?</p>
            </div>
            <div className="chips">
              {SUSPECTS.map((s) => <button key={s.name} type="button" className="chip-btn" onClick={() => setPicked(s.name)}>{s.name}</button>)}
            </div>
            {picked && (
              <p className={matches(SUSPECTS.find((s) => s.name === picked)!.bands) ? 'fb fb-ok' : 'fb fb-no'} role="status">
                {matches(SUSPECTS.find((s) => s.name === picked)!.bands) ? 'সব ব্যান্ড মিলেছে। এটি প্রবল প্রমাণ, তবে নমুনা সংগ্রহে ভুল হয়েছে কি না তা-ও বিচার করতে হয়।' : 'কিছু ব্যান্ড মিলছে, সব নয়। আত্মীয়দের মধ্যেও আংশিক মিল থাকে, তাই আংশিক মিল প্রমাণ নয়।'}
              </p>
            )}
          </>
        }
      />
    </Stage>
  );
}

type Bg = 'soil' | 'grass';

export function SelectionLab() {
  const [bg, setBg] = useState<Bg>('soil');
  const [green, setGreen] = useState(50);
  const [generation, setGeneration] = useState(0);
  const dots = useMemo(() => shuffle(Array.from({ length: 100 }, (_, i) => ({ x: 20 + ((i * 0.7548776662) % 1) * 550, y: 18 + ((i * 0.569840291) % 1) * 264 }))), []);

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="পরিবেশ" value={bg} onChange={setBg} options={[{ value: 'soil', label: 'বাদামি মাটি' }, { value: 'grass', label: 'সবুজ ঘাস' }]} />
      </div>
      <LabGrid
        view={
          <svg viewBox="0 0 590 300" role="img" aria-label={`সবুজ পোকা ${bn(green)}টি, বাদামি পোকা ${bn(100 - green)}টি`} style={{ background: bg === 'soil' ? '#7d5a3a' : '#4d9a5a' }}>
            {dots.map((d, i) => <ellipse key={i} cx={d.x} cy={d.y} rx="9" ry="6" fill={i < green ? '#4fae72' : '#7a5433'} stroke="#2a2010" strokeWidth="1" />)}
          </svg>
        }
        side={
          <>
            <div className="stats">
              <Stat label="সবুজ" value={bn(green)} />
              <Stat label="বাদামি" value={bn(100 - green)} />
              <Stat label="প্রজন্ম" value={bn(generation)} />
            </div>
            <div className="stepnav" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-hot" onClick={() => { setGreen(selection(green, bg === 'grass')); setGeneration(generation + 1); }}>এক প্রজন্ম এগোও</button>
              <button type="button" className="btn btn-lab" onClick={() => { setGreen(50); setGeneration(0); }}>আবার</button>
            </div>
            <div className="panel">
              <p>পাখি যে পোকা সহজে দেখে, সেটিই বেশি খায়। পরিবেশের সাথে মিশে থাকা পোকা বেঁচে থাকে ও বংশবৃদ্ধি করে। কোনো পোকা রং বদলায় না; পপুলেশনে অনুপাত বদলায়।</p>
              <p className="panel-note">প্রকরণ, যোগ্যতমের টিকে থাকা ও বংশগতি: তিনটি শর্ত একসাথে লাগে। পরিবেশ বদলে দেখো, “যোগ্য” কে তা পরিবেশের ওপর নির্ভর করে।</p>
            </div>
          </>
        }
      />
    </Stage>
  );
}
