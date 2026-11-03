import { useState } from 'react';
import { LabGrid, Range, Stage } from '../../../components/labkit';

const TYPES = [
  { max: 0.08, name: 'মেটাসেন্ট্রিক', shape: 'V', note: 'সেন্ট্রোমিয়ার ঠিক মাঝখানে, দুই বাহু সমান।' },
  { max: 0.5, name: 'সাবমেটাসেন্ট্রিক', shape: 'L', note: 'সেন্ট্রোমিয়ার মাঝ থেকে একটু পাশে, বাহু অসমান।' },
  { max: 0.9, name: 'অ্যাক্রোসেন্ট্রিক', shape: 'J', note: 'সেন্ট্রোমিয়ার প্রান্তের খুব কাছে, একটি বাহু খুব ছোট।' },
  { max: 1.01, name: 'টেলোসেন্ট্রিক', shape: 'I', note: 'সেন্ট্রোমিয়ার একেবারে প্রান্তে, একটিই বাহু।' },
];

const LEN = 130;

export default function ChromosomeShapeLab() {
  const [shift, setShift] = useState(0.3);
  const type = TYPES.find((t) => shift < t.max)!;
  const upper = LEN * (1 - shift);
  const lower = LEN * (1 + shift);

  // At anaphase the centromere leads towards the pole and the arms trail behind it.
  const tipL = { x: -upper * 0.62, y: upper * 0.78 };
  const tipR = { x: lower * 0.62 * (1 - shift) ** 0.6, y: lower * 0.78 };

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 800 420" role="img" aria-label={`${type.name} ক্রোমোজোম, ${type.shape} আকৃতি`} style={{ background: '#16292c' }}>
            <text x="200" y="36" textAnchor="middle" className="svg-label">মেটাফেজে</text>
            <text x="590" y="36" textAnchor="middle" className="svg-label">অ্যানাফেজে</text>
            <g transform="translate(200 210)" stroke="#4da3ff" strokeWidth="16" strokeLinecap="round" fill="none">
              <path d={`M-22 ${-upper}Q-4 ${-upper * 0.4} 0 0Q-4 ${lower * 0.4} -22 ${lower}`} />
              <path d={`M22 ${-upper}Q4 ${-upper * 0.4} 0 0Q4 ${lower * 0.4} 22 ${lower}`} stroke="#79bcff" />
              <circle r="10" fill="#fff4cc" stroke="none" />
            </g>
            <g transform="translate(590 110)" stroke="#ff8a5c" strokeWidth="16" strokeLinecap="round" fill="none">
              <path d={`M${tipL.x} ${tipL.y}Q-6 40 0 0Q6 40 ${tipR.x} ${tipR.y}`} />
              <circle r="10" fill="#fff4cc" stroke="none" />
            </g>
            <text x="590" y="88" textAnchor="middle" className="svg-label" fontSize="13">↑ মেরুর দিকে</text>
            <text x="590" y="400" textAnchor="middle" fontSize="44" fontWeight="700" fill="#ffd166">
              {type.shape}
            </text>
          </svg>
        }
        side={
          <>
            <Range label="সেন্ট্রোমিয়ারের অবস্থান" value={shift} min={0} max={1} step={0.02} display={type.name} onChange={setShift} />
            <div className="panel" aria-live="polite">
              <h3>{type.name}</h3>
              <span className="tag">অ্যানাফেজে {type.shape} আকৃতি</span>
              <p>{type.note}</p>
            </div>
            <p className="fb">
              বাহু কেন এমন? স্পিন্ডল তন্তু সেন্ট্রোমিয়ারকে মেরুর দিকে টানে, বাহুগুলো পেছনে ঝুলে থাকে। ঘরে দড়ি ও গিঁট দিয়ে একই মডেল বানাতে পারো।
            </p>
          </>
        }
      />
    </Stage>
  );
}
