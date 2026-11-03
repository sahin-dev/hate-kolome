import { useState } from 'react';
import { LabGrid, PredictBox, Seg, SortGame, Stage, StepNav, useSteps } from '../../../components/labkit';
import { flowerFate, type FlowerState } from './models/life';
import { INIT, SCENARIOS } from './models/scenarios';

const PARTS: Record<string, { name: string; role: string }> = {
  sepal: { name: 'বৃতি', role: 'সবুজ বাইরের স্তবক। কুঁড়ি অবস্থায় ফুলকে রোদ, বৃষ্টি ও পোকা থেকে রক্ষা করে।' },
  petal: { name: 'দলমণ্ডল', role: 'রঙিন পাপড়ি। সরাসরি জননে অংশ নেয় না, তবে পোকা আকর্ষণ করে পরাগায়নে সাহায্য করে।' },
  anther: { name: 'পুংস্তবক', role: 'পরাগধানীতে মিয়োসিসে পরাগরেণু তৈরি হয়, পুংদণ্ড একে ধরে রাখে।' },
  stigma: { name: 'গর্ভমুণ্ড', role: 'আঠালো মাথায় পরাগরেণু আটকায়।' },
  style: { name: 'গর্ভদণ্ড', role: 'গর্ভমুণ্ড ও গর্ভাশয়কে যুক্ত করে; পরাগনালি এর ভেতর দিয়ে নামে।' },
  ovary: { name: 'গর্ভাশয়', role: 'ভেতরে ডিম্বক থাকে। নিষেকের পর এটি ফলে পরিণত হয়।' },
  thalamus: { name: 'পুষ্পাক্ষ', role: 'বৃন্তের শীর্ষ; এখানে সব স্তবক সাজানো থাকে।' },
};

const STORY = [
  { name: 'পরাগরেণু তৈরি', text: 'পরাগধানীর পরাগ মাতৃকোষ (2n) মিয়োসিসে চারটি হ্যাপ্লয়েড (n) পরাগরেণু দেয়। পরিণত পরাগধানী ফেটে রেণু বের হয়।', bee: [470, 90] },
  { name: 'পরাগায়ন', text: 'পোকার গায়ে লেগে পরাগরেণু গর্ভমুণ্ডে পৌঁছায়।', bee: [305, 95] },
  { name: 'পরাগনালি', text: 'রেণু অঙ্কুরিত হয়ে পরাগনালি গড়ে। জেনারেটিভ কোষ বিভাজিত হয়ে দুটি পুং গ্যামেট (n) হয়।', bee: [530, 40] },
  { name: 'দ্বিনিষেক', text: 'এক পুং গ্যামেট (n) + ডিম্বাণু (n) = জাইগোট (2n)। অন্য গ্যামেট (n) + গৌণ নিউক্লিয়াস (2n) = সস্য (3n)। দুই মিলনই দ্বিনিষেক।', bee: [530, 40] },
  { name: 'বীজ ও ফল', text: 'পাপড়ি ঝরে পড়ে। ডিম্বক বীজ হয়, জাইগোট থেকে ভ্রূণ, সস্যে খাদ্য জমা হয়, গর্ভাশয় ফল হয়।', bee: [530, 40] },
];

export default function FlowerLab() {
  const [mode, setMode] = useState<'parts' | 'story'>('parts');
  const [selected, setSelected] = useState('ovary');
  const steps = useSteps(STORY.length, 3000);
  const i = mode === 'story' ? steps.index : -1;

  const hot = (id: string) => ({
    className: `part${mode === 'parts' && selected === id ? ' selected' : ''}`,
    role: 'button',
    tabIndex: 0,
    'aria-label': PARTS[id].name,
    onClick: () => mode === 'parts' && setSelected(id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && mode === 'parts') setSelected(id);
    },
  });

  const fruit = i === 4;
  const tube = i >= 2 && !fruit;

  return (
    <Stage>
      <div className="stage-bar">
        <Seg label="ল্যাবের ধরন" value={mode} onChange={setMode} options={[{ value: 'parts', label: 'ফুলের অংশ' }, { value: 'story', label: 'পরাগায়ন থেকে ফল' }]} />
      </div>
      <LabGrid
        view={
          <>
            <svg viewBox="0 0 600 460" role="img" aria-label="ফুলের লম্বচ্ছেদ" style={{ background: '#16292c' }}>
              <rect x="290" y="390" width="20" height="70" fill="#3f9f5e" />
              <g {...hot('thalamus')}><path d="M250 372Q300 410 350 372L330 400H270Z" fill="#79b866" /></g>
              <g {...hot('sepal')} opacity={fruit ? 0.5 : 1}>
                <path d="M254 372C200 366 160 330 150 300 200 310 250 340 270 366Z" fill="#3f9f5e" />
                <path d="M346 372C400 366 440 330 450 300 400 310 350 340 330 366Z" fill="#3f9f5e" />
              </g>
              {!fruit && (
                <g {...hot('petal')}>
                  <path d="M262 362C170 300 110 190 120 90 210 130 270 240 280 350Z" fill="#ef6f8e" stroke="#b83a60" strokeWidth="3" />
                  <path d="M338 362C430 300 490 190 480 90 390 130 330 240 320 350Z" fill="#ef6f8e" stroke="#b83a60" strokeWidth="3" />
                </g>
              )}
              {!fruit && (
                <g {...hot('anther')}>
                  <path d="M270 365C250 300 215 240 205 190M330 365C350 300 385 240 395 190" stroke="#d8cf8f" strokeWidth="6" fill="none" />
                  <ellipse cx="205" cy="178" rx="15" ry="24" fill="#e7b93e" />
                  <ellipse cx="395" cy="178" rx="15" ry="24" fill="#e7b93e" />
                </g>
              )}
              <g {...hot('ovary')}>
                <path d={fruit ? 'M300 200C400 200 440 300 400 370 360 420 240 420 200 370 160 300 200 200 300 200Z' : 'M300 275C345 275 362 320 345 360 330 380 270 380 255 360 238 320 255 275 300 275Z'} fill={fruit ? '#e58a3a' : '#a5d98c'} stroke="#2f8147" strokeWidth="4" />
                <ellipse cx="300" cy={fruit ? 310 : 335} rx={fruit ? 28 : 16} ry={fruit ? 42 : 22} fill={i >= 3 ? '#6a3f1f' : '#f4ecc8'} stroke="#7a6a2c" strokeWidth="2" />
                {i === 3 && (
                  <>
                    <circle cx="293" cy="345" r="6" fill="#ffd166" />
                    <text x="360" y="352" className="svg-label" fontSize="13">জাইগোট 2n</text>
                    <circle cx="306" cy="325" r="6" fill="#ff8a5c" />
                    <text x="360" y="325" className="svg-label" fontSize="13">সস্য 3n</text>
                  </>
                )}
              </g>
              {!fruit && (
                <>
                  <g {...hot('style')}><rect x="292" y="120" width="16" height="160" fill="#b7dd9b" /></g>
                  <g {...hot('stigma')}><ellipse cx="300" cy="112" rx="28" ry="14" fill="#e0603c" /></g>
                </>
              )}
              {i >= 0 && i < 2 && [0, 1, 2, 3].map((k) => (
                <circle key={k} r="5" fill="#ffd166">
                  <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${-k * 0.45}s`} path={i === 0 ? 'M205 170Q200 130 170 110' : 'M400 170Q360 110 310 112'} />
                </circle>
              ))}
              {tube && <path d="M300 112C298 170 302 230 300 318" fill="none" stroke="#e4572e" strokeWidth="5" strokeDasharray="6 5" className="flow" />}
              {i >= 0 && (
                <g style={{ transform: `translate(${STORY[i].bee[0]}px, ${STORY[i].bee[1]}px)`, transition: 'transform 1.2s ease-in-out' }}>
                  <ellipse rx="18" ry="11" fill="#e7b93e" stroke="#2a220c" strokeWidth="3" />
                  <path d="M-4-11V11M6-10V10" stroke="#2a220c" strokeWidth="4" />
                  <ellipse cx="-2" cy="-16" rx="12" ry="7" fill="#e6f4ff" opacity="0.85" />
                </g>
              )}
            </svg>
            {mode === 'story' && <StepNav steps={steps} />}
          </>
        }
        side={
          mode === 'parts' ? (
            <div className="panel" aria-live="polite">
              <h3>{PARTS[selected].name}</h3>
              <p>{PARTS[selected].role}</p>
              <div className="chips">
                {Object.keys(PARTS).map((id) => (
                  <button key={id} type="button" className="chip-btn" aria-pressed={selected === id} onClick={() => setSelected(id)}>{PARTS[id].name}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel" aria-live="polite">
              <h3>{STORY[steps.index].name}</h3>
              <p>{STORY[steps.index].text}</p>
            </div>
          )
        }
      />
    </Stage>
  );
}

export function FateLab() {
  const [s, setS] = useState<FlowerState>(INIT.fate);
  const r = flowerFate(s);
  const flip = (key: keyof FlowerState, label: string) => (
    <button type="button" className="chip-btn" aria-pressed={s[key]} onClick={() => setS({ ...s, [key]: !s[key] })}>{s[key] ? '✓' : '✗'} {label}</button>
  );

  return (
    <Stage>
      <LabGrid
        view={
          <div className="panel" aria-live="polite">
            <h4>ফুলটির ভাগ্য</h4>
            <h3 style={{ color: r.fruit ? '#8fe3b1' : '#ffb199' }}>{r.fruit ? 'পরাগায়ন ও নিষেক হয়েছে: ফল হবে' : 'পরাগায়ন হয়নি: ফুল ঝরে যাবে'}</h3>
            <div className="toggle-row" style={{ marginTop: 8 }}>
              {flip('anthers', 'পরাগধানী')}
              {flip('stigma', 'গর্ভমুণ্ড')}
              {flip('petals', 'রঙিন পাপড়ি')}
              {flip('insect', 'পোকা আসে')}
              {flip('pollinatorNeeded', 'বাহক লাগে (পর-পরাগী)')}
            </div>
            <p className="panel-note">বাস্তবে উদ্যানে পরাগধানী ফেলে দিয়ে নিয়ন্ত্রিত সংকরায়ন করা হয়।</p>
          </div>
        }
        side={<PredictBox scenarios={SCENARIOS.fate} onRun={(set) => setS({ ...INIT.fate, ...set })} />}
      />
    </Stage>
  );
}

export function PollinationSort() {
  return (
    <SortGame
      prompt="ফুলের এই বৈশিষ্ট্য দেখে পরাগায়নের মাধ্যম ঠিক করো।"
      bins={['পতঙ্গ', 'বায়ু', 'পানি', 'প্রাণী']}
      items={[
        { name: 'বড়, রঙিন, মধুগ্রন্থিযুক্ত ফুল', bin: 'পতঙ্গ', why: 'রং ও মধু পোকা টানে।' },
        { name: 'আঠালো ও সুগন্ধি পরাগ', bin: 'পতঙ্গ', why: 'রেণু পোকার গায়ে লেগে যায়।' },
        { name: 'হালকা, মধুগ্রন্থিহীন ফুল', bin: 'বায়ু', why: 'কাউকে আকর্ষণের দরকার নেই।' },
        { name: 'পালকের মতো গর্ভমুণ্ড', bin: 'বায়ু', why: 'বাতাসের রেণু ধরতে সুবিধা।' },
        { name: 'প্রচুর শুকনো ক্ষুদ্র পরাগ', bin: 'বায়ু', why: 'বেশির ভাগই নষ্ট হয়, তাই প্রচুর লাগে।' },
        { name: 'ফুল পানিতে ভেসে থাকে', bin: 'পানি', why: 'পাতাশ্যাওলায় এমন দেখা যায়।' },
        { name: 'বড় ও পুষ্পমঞ্জরিতে সাজানো ফুল', bin: 'প্রাণী', why: 'পাখি বা বাদুড় সহজে খুঁজে পায়।' },
      ]}
    />
  );
}

const EMBRYO = [
  { name: 'নিষেক', when: 'শুরু', text: 'শুক্রাণু (n = ২৩) ও ডিম্বাণু (n = ২৩) মিলে জাইগোট (2n = ৪৬) হয়।', cells: 1 },
  { name: 'ক্লিভেজ', when: 'প্রথম কয়েক দিন', text: 'মাইটোসিসে জাইগোট বারবার বিভাজিত হয়, আর ডিম্বনালি বেয়ে জরায়ুর দিকে এগোয়।', cells: 8 },
  { name: 'ব্লাস্টোসিস্ট', when: '৪–৫ দিন', text: 'ফাঁপা কোষগোলক জরায়ুতে পৌঁছায় এবং প্রাচীরে সংস্থাপিত হয়।', cells: 24 },
  { name: 'অমরা গঠন', when: '১২ সপ্তাহের মধ্যে', text: 'অমরার মাধ্যমে পুষ্টি ও O₂ ভ্রূণে আসে, CO₂ ও বর্জ্য যায়। মা ও ভ্রূণের রক্ত সরাসরি মেশে না।', cells: 60 },
  { name: 'জন্ম', when: '৩৮–৪০ সপ্তাহ', text: 'হরমোনের প্রভাবে জরায়ু সংকুচিত হয় এবং শিশু ভূমিষ্ঠ হয়।', cells: 120 },
];

export function EmbryoLab() {
  const steps = useSteps(EMBRYO.length, 3000);
  const e = EMBRYO[steps.index];
  const dots = Array.from({ length: e.cells }, (_, i) => {
    const a = i * 2.4;
    const r = 9 * Math.sqrt(i);
    return <circle key={i} cx={260 + Math.cos(a) * r} cy={150 + Math.sin(a) * r} r={e.cells === 1 ? 48 : 8} fill="#f0b0a3" stroke="#a03a2c" />;
  });
  return (
    <Stage>
      <LabGrid
        view={
          <>
            <svg viewBox="0 0 520 300" role="img" aria-label={e.name} style={{ background: '#16292c' }}>{dots}</svg>
            <StepNav steps={steps} />
          </>
        }
        side={
          <div className="panel" aria-live="polite">
            <h3>{e.name}</h3>
            <span className="tag">{e.when}</span>
            <p>{e.text}</p>
            <p className="panel-note">লক্ষ করো: বৃদ্ধি হয় মাইটোসিসে, গ্যামেট হয় মিয়োসিসে। তৃতীয় অধ্যায়ের সাথে এখানেই সংযোগ।</p>
          </div>
        }
      />
    </Stage>
  );
}
