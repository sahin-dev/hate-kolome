import { useState } from 'react';
import { LabGrid, Seg, Stage } from '../../../components/labkit';
import { bn } from '../../../core/util';

type Test = 'light' | 'chlorophyll';
type Look = 'fresh' | 'boiled' | 'pale' | 'iodine';

const STAGES: { title: string; text: string; look: Look }[] = [
  { title: 'রোদে রাখো', text: 'গাছটি ৬–৭ ঘণ্টা রোদে রাখা হলো। আলো পাওয়া সবুজ অংশে শর্করা তৈরি হয়ে শ্বেতসার রূপে জমেছে।', look: 'fresh' },
  { title: 'পানিতে সিদ্ধ করো', text: 'পাতা কয়েক মিনিট পানিতে সিদ্ধ করলে কোষ মরে যায়, পাতা নরম হয়।', look: 'boiled' },
  { title: 'অ্যালকোহলে ক্লোরোফিল দূর করো', text: '৯৫% অ্যালকোহলে পরোক্ষ তাপে পাতা বিবর্ণ হয়। সবুজ রঙ সরে গেলে আয়োডিনের রঙ স্পষ্ট দেখা যায়।', look: 'pale' },
  { title: 'আয়োডিন দ্রবণে ডোবাও', text: 'পাতা ধুয়ে ১% আয়োডিন দ্রবণে ডোবানো হলো। শ্বেতসার আয়োডিনে নীল বা গাঢ় বেগুনি হয়।', look: 'iodine' },
];

const LEAF = 'M120 210C150 70 360 30 520 80 560 220 470 340 300 345 200 345 130 300 120 210Z';

function leafFill(look: Look): string {
  return { fresh: '#3f9f5e', boiled: '#6bab6a', pale: '#e6dfa4', iodine: '#e3c26e' }[look];
}

function Leaf({ test, look, covered, destarched }: { test: Test; look: Look; covered: boolean; destarched: boolean }) {
  const dark = '#2a2448';
  const base = leafFill(look);

  // Each region turns blue-black only if it holds starch.
  const hasOldStarch = !destarched;
  const stain = (hasStarch: boolean) => (look === 'iodine' && hasStarch ? dark : base);

  return (
    <>
      <clipPath id="leaf-shape">
        <path d={LEAF} />
      </clipPath>
      <path d="M120 210C70 230 40 250 20 290" stroke="#6a8a4a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <g clipPath="url(#leaf-shape)">
        <rect width="640" height="400" fill={stain(true)} />
        {test === 'light' && covered && <rect x="250" y="20" width="130" height="360" fill={stain(hasOldStarch)} />}
        {test === 'chlorophyll' && (
          <>
            <path d="M380 30C430 130 400 220 470 360H640V0H360Z" fill={look === 'fresh' ? '#efe08a' : look === 'boiled' ? '#efe6a8' : look === 'pale' ? '#efe9c0' : stain(hasOldStarch)} />
            <path d="M120 270C200 240 260 330 320 360H100Z" fill={look === 'fresh' ? '#f2a95c' : look === 'boiled' ? '#f0c088' : look === 'pale' ? '#efe9c0' : stain(hasOldStarch)} />
          </>
        )}
      </g>
      <path d={LEAF} fill="none" stroke="#2f5b3a" strokeWidth="4" />
      <path d="M120 210C260 190 400 150 520 80M250 180 230 90M340 155 330 60M280 172 330 330M400 130 450 290" stroke="#2f5b3a" strokeWidth="2.5" fill="none" opacity="0.65" />
      {test === 'light' && covered && look === 'fresh' && (
        <g>
          <rect x="240" y="30" width="150" height="330" rx="4" fill="#15171a" />
          <text x="315" y="200" textAnchor="middle" className="svg-label">কালো কাগজ</text>
        </g>
      )}
    </>
  );
}

export default function LeafTestLab() {
  const [test, setTest] = useState<Test>('light');
  const [stage, setStage] = useState(-1);
  const [destarched, setDestarched] = useState(false);
  const [covered, setCovered] = useState(true);

  const started = stage >= 0;
  const current = STAGES[Math.max(0, stage)];
  const finished = stage === STAGES.length - 1;

  const reset = () => setStage(-1);

  let verdict = '';
  if (finished) {
    if (!destarched) {
      verdict = 'পুরো পাতাই নীল হয়ে গেল! পরীক্ষার আগেই পাতায় শ্বেতসার জমা ছিল, তাই ফল প্রমাণ হলো না। গাছটি আগে ৪৮ ঘণ্টা অন্ধকারে রেখে আবার করো।';
    } else if (test === 'light') {
      verdict = covered
        ? 'ঢাকা অংশ রঙ বদলায়নি, কারণ আলো না পাওয়ায় সেখানে শ্বেতসার হয়নি। সিদ্ধান্ত: সালোকসংশ্লেষণে আলো অপরিহার্য।'
        : 'পাতা না ঢাকায় পুরোটাই নীল। তুলনার জন্য ঢাকা অংশ না থাকলে আলোর ভূমিকা প্রমাণ হয় না।';
    } else {
      verdict = 'কেবল সবুজ অংশ নীল হলো। হলুদ ও কমলা অংশে ক্লোরোফিল নেই, তাই শ্বেতসারও নেই। সিদ্ধান্ত: সালোকসংশ্লেষণে ক্লোরোফিল অপরিহার্য।';
    }
  }

  return (
    <Stage>
      <div className="stage-bar">
        <Seg
          label="কোন পরীক্ষা"
          value={test}
          onChange={(t) => { setTest(t); reset(); }}
          options={[{ value: 'light', label: 'আলোর পরীক্ষা' }, { value: 'chlorophyll', label: 'ক্লোরোফিলের পরীক্ষা' }]}
        />
      </div>
      <LabGrid
        view={
          <svg viewBox="0 0 600 400" role="img" aria-label={`পাতা: ${current.title}`} style={{ background: '#16292c' }}>
            <Leaf test={test} look={started ? current.look : 'fresh'} covered={covered} destarched={destarched} />
          </svg>
        }
        side={
          <>
            {!started ? (
              <div className="panel">
                <h3>প্রস্তুতি</h3>
                <p>পরীক্ষা শুরুর আগে নিজে ঠিক করো। ভুল করলেও ক্ষতি নেই, ফল দেখে কারণ বুঝবে।</p>
                <div className="chips">
                  <button type="button" className="chip-btn" aria-pressed={destarched} onClick={() => setDestarched(!destarched)}>
                    গাছ ৪৮ ঘণ্টা অন্ধকারে রাখো
                  </button>
                  {test === 'light' && (
                    <button type="button" className="chip-btn" aria-pressed={covered} onClick={() => setCovered(!covered)}>
                      পাতা কালো কাগজে ঢাকো
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="panel" aria-live="polite">
                <h4>
                  ধাপ {bn(stage + 1)}/{bn(STAGES.length)}
                </h4>
                <h3>{current.title}</h3>
                <p>{current.text}</p>
              </div>
            )}
            {finished ? (
              <div className="panel" role="status">
                <h4>পর্যবেক্ষণ</h4>
                <p>{verdict}</p>
              </div>
            ) : null}
            <div className="stepnav" style={{ marginTop: 0 }}>
              {!finished && (
                <button type="button" className="btn btn-hot" onClick={() => setStage(stage + 1)}>
                  {started ? 'পরের ধাপ →' : 'পরীক্ষা শুরু করো'}
                </button>
              )}
              {started && <button type="button" className="btn btn-lab" onClick={reset}>আবার করো</button>}
            </div>
            <p className="fb">
              সতর্কতা: বাস্তবে অ্যালকোহল সরাসরি আগুনে গরম করবে না। টেস্টটিউবটি গরম পানির বিকারে রেখে শিক্ষকের তত্ত্বাবধানে করো।
            </p>
          </>
        }
      />
    </Stage>
  );
}
