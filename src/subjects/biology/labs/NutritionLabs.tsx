import { useState } from 'react';
import { LabGrid, Meter, PredictBox, Range, Seg, Stage, Stat, StepNav, useSteps } from '../../../components/labkit';
import { bn } from '../../../core/util';
import { FOODS, FOOD_TABLE, bmi, bmiBand, bmr, digest, type DigestState, type Food } from './models/body';
import { INIT, SCENARIOS } from './models/scenarios';
import { GutView } from './nutrition/GutView';
import { Plate } from './nutrition/Plate';
import { ZoomView } from './nutrition/ZoomView';

export { MineralLab } from './nutrition/MineralLab';
export { FoodTestLab } from './nutrition/FoodTestLab';

const ORGANS = [
  { name: 'মুখগহ্বর', at: [300, 55], gut: 0, juice: 'লালা: টায়ালিন', text: 'দাঁত খাবার চিবিয়ে ছোট করে। টায়ালিন শ্বেতসারকে মলটোজে ভাঙতে শুরু করে।' },
  { name: 'অন্ননালি', at: [300, 140], gut: 0, juice: 'উৎসেচক নেই', text: 'পেরিস্টালসিস ঢেউয়ের মতো খাবারকে নিচে ঠেলে দেয়। এখানে পরিপাক হয় না।' },
  { name: 'পাকস্থলী', at: [352, 235], gut: 1, juice: 'HCl, পেপসিন', text: 'HCl জীবাণু মারে এবং পেপসিনোজেনকে সক্রিয় পেপসিন করে। পেপসিন আমিষ ভাঙে। শর্করা ও স্নেহ ভাঙার উৎসেচক এখানে নেই।' },
  { name: 'ডিওডেনাম', at: [262, 315], gut: 2, juice: 'পিত্তরস, অ্যামাইলেজ, ট্রিপসিন, লাইপেজ', text: 'পিত্তরস অম্ল প্রশমিত করে ও স্নেহকে ক্ষুদ্র ফোঁটায় ভাঙে। অগ্ন্যাশয় রস তিন খাদ্যই ভাঙে।' },
  { name: 'ইলিয়াম', at: [300, 415], gut: 3, juice: 'আন্ত্রিক রস', text: 'পরিপাক শেষ হয়। ভিলাই গ্লুকোজ, অ্যামিনো এসিড, ফ্যাটি এসিড ও গ্লিসারল শোষণ করে।' },
  { name: 'বৃহদন্ত্র', at: [430, 400], gut: 3, juice: 'উৎসেচক নেই', text: 'পানি ও লবণ শোষিত হয়। না ভাঙা অংশ মল হিসেবে বেরিয়ে যায়।' },
];

export function DigestLab() {
  const steps = useSteps(ORGANS.length, 3000);
  const [state, setState] = useState<DigestState>(INIT.digest);
  const organ = ORGANS[steps.index];
  const d = digest(state);
  const atColon = d.starch[3] + d.protein[3] + d.fat[3];

  const flip = (key: 'bile' | 'pancreas' | 'acid', label: string) => (
    <button type="button" className="chip-btn" aria-pressed={state[key]} onClick={() => setState({ ...state, [key]: !state[key] })}>
      {state[key] ? '✓' : '✗'} {label}
    </button>
  );

  return (
    <Stage>
      <div className="stage-bar">
        <Seg<Food>
          label="খাবার"
          value={state.food}
          onChange={(food) => setState({ ...state, food })}
          options={(Object.keys(FOODS) as Food[]).map((f) => ({ value: f, label: FOODS[f].name }))}
        />
      </div>
      <div className="digest-layout">
        <div>
          <GutView stop={steps.index} name={organ.name} />
          <StepNav steps={steps} />
        </div>
        <div className="digest-right">
          <ZoomView state={state} stop={steps.index} />
          <div className="digest-pair">
            <div className="panel" aria-live="polite">
              <h3>{organ.name}</h3>
              <span className="tag">{organ.juice}</span>
              <p>{organ.text}</p>
            </div>
            <div className="panel">
              <h4>এখনো না ভাঙা খাদ্য</h4>
              <Meter label="শ্বেতসার" value={d.starch[organ.gut]} color="#ffd166" />
              <Meter label="আমিষ" value={d.protein[organ.gut]} color="#ff9f6b" />
              <Meter label="স্নেহ" value={d.fat[organ.gut]} color="#8fc4ef" />
              {steps.index >= 4 && atColon > 0.05 && <p style={{ color: '#ffb199' }}>না ভাঙা খাদ্য শোষিত হবে না, পুষ্টি নষ্ট হবে।</p>}
            </div>
          </div>
          <div className="panel">
            <h4>রস বন্ধ করে দেখো: অণুগুলোর আচরণ বদলে যাবে</h4>
            <div className="toggle-row">
              {flip('acid', 'পাকস্থলীর HCl')}
              {flip('bile', 'পিত্তরস')}
              {flip('pancreas', 'অগ্ন্যাশয় রস')}
            </div>
          </div>
          <PredictBox scenarios={SCENARIOS.digest} onRun={(set) => { setState({ ...INIT.digest, ...set }); steps.setIndex(set.food === 'rice' ? 2 : set.acid === false ? 2 : 3); }} />
        </div>
      </div>
    </Stage>
  );
}

const REFERENCE = { weight: 52, height: 160, age: 15, sex: 'f' as const, factor: 1.55 };

export function DietLab() {
  const [grams, setGrams] = useState<Record<string, number>>({});
  const need = Math.round(bmr(REFERENCE.sex, REFERENCE.weight, REFERENCE.height, REFERENCE.age) * REFERENCE.factor);
  const total = FOOD_TABLE.reduce((a, [name, kcal]) => a + ((grams[name] ?? 0) / 100) * kcal, 0);
  const share = total / need;
  const change = (name: string, by: number) => setGrams({ ...grams, [name]: Math.max(0, (grams[name] ?? 0) + by) });

  return (
    <Stage>
      <LabGrid
        view={
          <div className="table-wrap">
            <table className="flow-table">
              <caption className="fb">প্রতি ১০০ গ্রামের শক্তি বইয়ের সারণি অনুযায়ী (কিলোক্যালরি)</caption>
              <thead><tr><th>খাবার</th><th>শক্তি/১০০ গ্রাম</th><th>পরিমাণ</th></tr></thead>
              <tbody>
                {FOOD_TABLE.map(([name, kcal]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{bn(kcal)}</td>
                    <td>
                      <button type="button" className="chip-btn" aria-label={`${name} কমাও`} onClick={() => change(name, -50)}>−</button>
                      {' '}{bn(grams[name] ?? 0)} গ্রাম{' '}
                      <button type="button" className="chip-btn" aria-label={`${name} বাড়াও`} onClick={() => change(name, 50)}>+</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
        side={
          <>
            <Plate grams={grams} />
            <div className="panel">
              <h4>একজন কাল্পনিক শিক্ষার্থীর এক দিনের খাবার সাজাও</h4>
              <p>১৫ বছর, ৫২ কেজি, ১৬০ সে.মি., সপ্তাহে কয়েক দিন খেলাধুলা করে।</p>
            </div>
            <div className="stats">
              <Stat label="চাহিদা (কিলোক্যালরি)" value={bn(need)} />
              <Stat label="সাজানো খাবারে" value={bn(Math.round(total))} />
            </div>
            <Meter label="চাহিদার কতটা" value={share} color={share > 1.1 ? '#ff8a6b' : '#6fd09a'} display={`${bn(Math.round(share * 100))}%`} />
            <p className="fb" aria-live="polite">
              {total === 0 ? 'খাবার যোগ করো।' : share < 0.9 ? 'শক্তি কম। ঘাটতি হলে দেহ জমা চর্বি ও পেশি ক্ষয় করে।' : share > 1.1 ? 'শক্তি বেশি। অতিরিক্ত শক্তি চর্বি হিসেবে জমে।' : 'শক্তির হিসাব ঠিক আছে। এবার দেখো আমিষ, শাকসবজি ও ফল আছে কি না।'}
            </p>
            <p className="panel-note" style={{ color: 'var(--stage-soft)', fontSize: 14, margin: 0 }}>
              লক্ষ করো: ১০০ গ্রাম তেলে শক্তি ৯০০ কিলোক্যালরি, কিন্তু ১০০ গ্রাম শাকে মাত্র ২৭। শক্তি মিললেই খাবার সুষম হয় না; ভিটামিন ও খনিজ শাকসবজি থেকে আসে।
            </p>
          </>
        }
      />
    </Stage>
  );
}

/** A bathroom scale, dial and all. The needle follows the weight on the slider. */
function WeighingScale({ kg }: { kg: number }) {
  const turn = ((kg / 120) * 300 - 150).toFixed(1);
  return (
    <svg viewBox="0 0 300 240" role="img" aria-label={`ওজন মাপার যন্ত্রে ${bn(kg)} কেজি`}>
      <defs>
        <linearGradient id="scale-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f2ee" />
          <stop offset="1" stopColor="#a8aeb0" />
        </linearGradient>
        <radialGradient id="scale-dial" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d6dadb" />
        </radialGradient>
      </defs>
      <rect width="300" height="240" fill="#26383a" />
      <rect x="28" y="20" width="244" height="208" rx="30" fill="url(#scale-body)" stroke="#6f7678" strokeWidth="2" />
      <circle cx="150" cy="100" r="66" fill="#3a4648" />
      <circle cx="150" cy="100" r="62" fill="url(#scale-dial)" />
      {Array.from({ length: 13 }, (_, i) => {
        const a = ((i * 25 - 150 - 90) * Math.PI) / 180;
        const inner = i % 2 ? 50 : 46;
        return <line key={i} x1={150 + Math.cos(a) * inner} y1={100 + Math.sin(a) * inner} x2={150 + Math.cos(a) * 57} y2={100 + Math.sin(a) * 57} stroke="#2a3436" strokeWidth={i % 2 ? 1.2 : 2.2} />;
      })}
      <g style={{ transformOrigin: '150px 100px', transform: `rotate(${turn}deg)`, transition: 'transform .5s cubic-bezier(.3,1.5,.5,1)' }}>
        <path d="M148 104L150 44L152 104Z" fill="#c9302c" />
      </g>
      <circle cx="150" cy="100" r="5.5" fill="#2a3436" />
      <text x="150" y="134" textAnchor="middle" fontSize="15" fontWeight="700" fill="#2a3436">{bn(kg)} কেজি</text>
      <rect x="58" y="178" width="78" height="38" rx="15" fill="#3c4648" opacity="0.8" />
      <rect x="164" y="178" width="78" height="38" rx="15" fill="#3c4648" opacity="0.8" />
    </svg>
  );
}

function HeightRod({ cm }: { cm: number }) {
  const y = (v: number) => 228 - ((v - 110) / 100) * 216;
  return (
    <svg viewBox="0 0 150 240" role="img" aria-label={`উচ্চতা ${bn(cm)} সেন্টিমিটার`}>
      <defs>
        <linearGradient id="rod" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dcbf8c" />
          <stop offset="1" stopColor="#b08c58" />
        </linearGradient>
      </defs>
      <rect width="150" height="240" fill="#b9bfb6" />
      <rect x="44" y="4" width="46" height="232" fill="url(#rod)" stroke="#7a5e36" />
      {Array.from({ length: 21 }, (_, i) => {
        const v = 110 + i * 5;
        return (
          <g key={v}>
            <line x1="44" x2={i % 2 ? 54 : 62} y1={y(v)} y2={y(v)} stroke="#3a2a14" strokeWidth={i % 2 ? 0.8 : 1.4} />
            {i % 2 === 0 && <text x="86" y={y(v) + 4} textAnchor="end" fontSize="10" fill="#3a2a14">{bn(v)}</text>}
          </g>
        );
      })}
      <g style={{ transform: `translateY(${y(cm)}px)`, transition: 'transform .4s ease' }}>
        <rect x="14" y="-4" width="124" height="8" rx="3" fill="#2f4a56" />
      </g>
    </svg>
  );
}

const ACTIVITY = [
  { label: 'পরিশ্রম নেই', k: 1.2 },
  { label: 'সপ্তাহে ২–৩ দিন হালকা খেলা', k: 1.375 },
  { label: 'সপ্তাহে ২–৩ দিন পরিশ্রমের খেলা', k: 1.55 },
  { label: 'প্রতিদিন প্রচুর খেলা', k: 1.725 },
  { label: 'অত্যন্ত পরিশ্রম', k: 1.9 },
];

export function BmiLab() {
  const [sex, setSex] = useState<'f' | 'm'>('f');
  const [weight, setWeight] = useState(55);
  const [height, setHeight] = useState(160);
  const [age, setAge] = useState(16);
  const [activity, setActivity] = useState(2);

  const metres = height / 100;
  const value = bmi(weight, height);
  const band = bmiBand(value);
  const base = bmr(sex, weight, height, age);
  const need = base * ACTIVITY[activity].k;
  const marker = Math.min(100, Math.max(0, ((value - 12) / 28) * 100));

  return (
    <Stage>
      <LabGrid
        view={
          <div className="panel">
            <div className="instruments">
              <WeighingScale kg={weight} />
              <HeightRod cm={height} />
            </div>
            <h4>একজন কাল্পনিক শিক্ষার্থীর হিসাব করো</h4>
            <Seg label="লিঙ্গ" value={sex} onChange={setSex} options={[{ value: 'f', label: 'মেয়ে' }, { value: 'm', label: 'ছেলে' }]} />
            <Range label="ওজন" value={weight} min={25} max={110} display={`${bn(weight)} কেজি`} onChange={setWeight} />
            <Range label="উচ্চতা" value={height} min={120} max={200} display={`${bn(height)} সে.মি.`} onChange={setHeight} />
            <Range label="বয়স" value={age} min={10} max={60} display={`${bn(age)} বছর`} onChange={setAge} />
            <div className="chips">
              {ACTIVITY.map((a, i) => (
                <button key={a.k} type="button" className="chip-btn" aria-pressed={activity === i} onClick={() => setActivity(i)}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        }
        side={
          <>
            <div className="stats">
              <Stat label="BMI" value={bn(value, 1)} />
              <Stat label="BMR (কিলোক্যালরি)" value={bn(Math.round(base))} />
              <Stat label="দৈনিক চাহিদা" value={bn(Math.round(need))} />
            </div>
            <div className="panel" aria-live="polite">
              <h3>{band.name}</h3>
              <div className="bmi-bar"><span style={{ left: `${marker}%` }} /></div>
              <p>{band.advice}</p>
              <p className="close-equation">BMI = {bn(weight)} ÷ ({bn(metres, 2)})² = {bn(value, 1)}</p>
              <p className="close-equation">চাহিদা = BMR × {bn(ACTIVITY[activity].k)} = {bn(Math.round(need))}</p>
            </div>
            <p className="fb">
              এটি সূত্র অনুশীলনের জন্য। কিশোর বয়সে শরীর দ্রুত বদলায়, তাই এই সংখ্যা দিয়ে নিজের শরীর বিচার কোরো না। স্বাস্থ্য নিয়ে চিন্তা থাকলে অভিভাবক বা চিকিৎসকের সাথে কথা বলো।
            </p>
          </>
        }
      />
    </Stage>
  );
}
