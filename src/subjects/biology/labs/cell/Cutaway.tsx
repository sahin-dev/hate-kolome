import { useState } from 'react';

const MOLECULES = [
  { name: 'O₂', pass: true, via: 'lipid', why: 'ছোট, বিদ্যুৎ-নিরপেক্ষ অণু লিপিডের ফাঁক দিয়ে ব্যাপিত হয়।' },
  { name: 'CO₂', pass: true, via: 'lipid', why: 'ছোট গ্যাস অণু সহজেই ব্যাপিত হয়; শ্বসনের CO₂ এভাবেই বের হয়।' },
  { name: 'পানি', pass: true, via: 'lipid', why: 'পানি পর্দা পেরোয়। ঘনত্বের পার্থক্যে এই চলাচলই অভিস্রবণ।' },
  { name: 'গ্লুকোজ', pass: true, via: 'protein', why: 'অণুটি বড়, লিপিডে আটকায়; তাই প্রোটিন পথ দিয়ে ঢোকে।' },
  { name: 'লবণ আয়ন', pass: true, via: 'protein', why: 'আধানযুক্ত আয়ন লিপিড পেরোতে পারে না, প্রোটিন পথ লাগে।' },
  { name: 'বড় প্রোটিন', pass: false, via: 'none', why: 'অণুটি এত বড় যে এই পথে পেরোতে পারে না। বাইরে যেতে হলে ভেসিকলে ভরে পাঠাতে হয়।' },
];

export function MembraneTester() {
  const [chosen, setChosen] = useState(0);
  const [run, setRun] = useState(0);
  const m = MOLECULES[chosen];
  const x = m.via === 'protein' ? 350 : 170;
  const path = m.pass ? `M${x} 10L${x} 310` : 'M520 10L520 118L520 40';

  return (
    <>
      <svg viewBox="0 0 700 320" role="img" aria-label={`${m.name}: ${m.pass ? 'পর্দা পেরোয়' : 'পর্দা পেরোতে পারে না'}`} style={{ background: '#13272a' }}>
        <text x="16" y="24" className="svg-label" fontSize="14">কোষের বাইরে</text>
        <text x="16" y="306" className="svg-label" fontSize="14">কোষের ভেতরে</text>
        {Array.from({ length: 27 }, (_, i) => {
          const px = 14 + i * 26;
          if (Math.abs(px - 350) < 34) return null;
          return (
            <g key={i}>
              <circle cx={px} cy="124" r="11" fill="#f1cb7c" stroke="#a97a2c" />
              <path d={`M${px - 4} 134V158M${px + 4} 134V158`} stroke="#d9a94f" strokeWidth="3" />
              <path d={`M${px - 4} 164V188M${px + 4} 164V188`} stroke="#d9a94f" strokeWidth="3" />
              <circle cx={px} cy="198" r="11" fill="#f1cb7c" stroke="#a97a2c" />
            </g>
          );
        })}
        <path d="M322 104C312 150 312 180 322 218H338C330 180 330 150 338 104ZM378 104C388 150 388 180 378 218H362C370 180 370 150 362 104Z" fill="#a877d6" stroke="#5a3191" strokeWidth="2.5" />
        <text x="350" y="240" textAnchor="middle" className="svg-label" fontSize="13">প্রোটিন পথ</text>
        <g key={`${chosen}-${run}`}>
          <circle r={m.name === 'বড় প্রোটিন' ? 30 : 14} fill={m.pass ? '#7fd2ff' : '#ff8a5c'} stroke="#fff" strokeWidth="2">
            <animateMotion dur="2.2s" repeatCount="1" fill="freeze" path={path} />
          </circle>
        </g>
      </svg>
      <div className="chips">
        {MOLECULES.map((mol, i) => (
          <button key={mol.name} type="button" className="chip-btn" aria-pressed={i === chosen} onClick={() => { setChosen(i); setRun(run + 1); }}>
            {mol.name}
          </button>
        ))}
      </div>
      <div className="panel" aria-live="polite" style={{ marginTop: 8 }}>
        <h4>নিজে পরীক্ষা করো: কোন অণু পর্দা পেরোবে?</h4>
        <h3>{m.name}: {m.pass ? 'পেরোতে পারে' : 'পেরোতে পারে না'}</h3>
        <p>{m.why}</p>
        <p className="panel-note">কিছু অণু পারে, কিছু পারে না। এ কারণেই পর্দাটিকে বৈষম্যভেদ্য বলে।</p>
      </div>
    </>
  );
}
