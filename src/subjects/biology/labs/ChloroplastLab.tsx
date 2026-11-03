import { useState } from 'react';
import { LabGrid, Stage, Stat } from '../../../components/labkit';
import { bn } from '../../../core/util';

const START = { water: 12, co2: 6, o2: 0, atp: 0, nadph: 0, fixed: 0, glucose: 0, madeWater: 0 };

export default function ChloroplastLab() {
  const [s, setS] = useState(START);
  const [lightOn, setLightOn] = useState(true);
  const [flash, setFlash] = useState<'light' | 'dark' | null>(null);
  const [note, setNote] = useState('প্রথমে আলো ফেলো। আলো পানি ভেঙে ATP ও NADPH বানাবে।');

  const shine = () => {
    if (!lightOn) return setNote('আলো বন্ধ। আলোকনির্ভর পর্যায় চলতে পারছে না।');
    if (s.water < 2) return setNote('পানি শেষ! ফটোলাইসিসের জন্য আর পানি নেই।');
    setS({ ...s, water: s.water - 2, o2: s.o2 + 1, atp: s.atp + 3, nadph: s.nadph + 2 });
    setFlash('light');
    setNote('ফটোলাইসিস: ২ H₂O ভেঙে ১ O₂ বের হলো। সাথে তৈরি হলো ৩ ATP ও ২ NADPH।');
  };

  const fix = () => {
    if (s.co2 < 1) return setNote('CO₂ শেষ। পত্ররন্ধ্র দিয়ে আর CO₂ আসছে না।');
    if (s.atp < 3 || s.nadph < 2) {
      return setNote(
        lightOn
          ? 'ATP বা NADPH নেই! ক্যালভিন চক্র আলোকনির্ভর পর্যায়ের উৎপাদের ওপর নির্ভর করে। আগে আলো ফেলো।'
          : 'আলো নেই, জমা ATP-ও ফুরিয়েছে। তাই অন্ধকার পর্যায়ও বেশিক্ষণ চলে না।',
      );
    }
    const fixed = s.fixed + 1;
    const done = fixed === 6;
    setS({
      ...s, co2: s.co2 - 1, atp: s.atp - 3, nadph: s.nadph - 2,
      fixed: done ? 0 : fixed,
      glucose: s.glucose + (done ? 1 : 0),
      madeWater: s.madeWater + (done ? 6 : 0),
    });
    setFlash('dark');
    setNote(done ? 'অভিনন্দন! ৬ অণু CO₂ মিলে ১ অণু গ্লুকোজ তৈরি হলো, সাথে ৬ অণু পানি।' : `CO₂ বিজারিত হলো। গ্লুকোজ হতে আরও ${bn(6 - fixed)} অণু CO₂ লাগবে।`);
  };

  const finished = s.glucose > 0 && s.water === 0 && s.co2 === 0;

  return (
    <Stage>
      <LabGrid
        view={
          <>
            <svg viewBox="0 0 860 460" role="img" aria-label="ক্লোরোপ্লাস্টের ভেতরে আলোকনির্ভর পর্যায় ও ক্যালভিন চক্র" style={{ background: '#16292c' }}>
              <ellipse cx="430" cy="235" rx="415" ry="215" fill="#2a7b4c" />
              <ellipse cx="430" cy="235" rx="400" ry="200" fill="#c6e6b2" />

              {lightOn &&
                [[60, 10, 200, 170], [150, 0, 250, 150], [20, 80, 170, 190]].map(([a, b, c, d]) => (
                  <line key={a} x1={a} y1={b} x2={c} y2={d} stroke="#f8c63f" strokeWidth="6" className="flow" />
                ))}

              <g key={flash === 'light' ? s.o2 : 'g'} className={flash === 'light' ? 'pulse' : undefined}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <rect key={i} x="150" y={150 + i * 26} width="150" height="20" rx="10" fill={lightOn ? '#20a052' : '#2c6b43'} stroke="#0d4a28" strokeWidth="2.5" />
                ))}
              </g>
              <text x="225" y="324" textAnchor="middle" className="svg-label svg-label-dark">গ্রানা</text>
              <text x="225" y="346" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">আলোকনির্ভর পর্যায়</text>

              <g transform="translate(430 215)" stroke="#6c5b23" fill="none" strokeWidth="4">
                <path d="M-70-30H60m-14-10 14 10-14 10" />
                <path d="M60 30H-70m14 10-14-10 14-10" />
              </g>
              <text x="430" y="170" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">ATP, NADPH →</text>
              <text x="430" y="278" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">← ADP, NADP⁺</text>

              <g transform={`translate(640 225) rotate(${s.fixed * 60})`} style={{ transition: 'transform .6s ease' }}>
                <circle r="92" fill="none" stroke="#b5402f" strokeWidth="12" strokeDasharray="120 24" />
              </g>
              <text x="640" y="220" textAnchor="middle" className="svg-label svg-label-dark">ক্যালভিন চক্র</text>
              <text x="640" y="246" textAnchor="middle" fontSize="26" fontWeight="700" fill="#7d2318">
                {bn(s.fixed)}/{bn(6)}
              </text>
              <text x="640" y="350" textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">স্ট্রোমা</text>

              <text x="110" y="330" textAnchor="middle" fontSize="15" fill="#123b5c">H₂O ↓</text>
              <text x="320" y="110" textAnchor="middle" fontSize="15" fill="#0d4a28">O₂ ↑</text>
              <text x="640" y="110" textAnchor="middle" fontSize="15" fill="#3b3b3b">CO₂ ↓</text>
              <text x="775" y="240" textAnchor="middle" fontSize="15" fill="#7d4a00">গ্লুকোজ →</text>
            </svg>
            <div className="stepnav">
              <button type="button" className="btn btn-hot" onClick={shine}>☀ আলো ফেলো</button>
              <button type="button" className="btn btn-hot" onClick={fix}>CO₂ ঢোকাও</button>
              <button type="button" className="btn btn-lab" aria-pressed={!lightOn} onClick={() => setLightOn(!lightOn)}>
                {lightOn ? 'আলো বন্ধ করো' : 'আলো চালু করো'}
              </button>
              <button type="button" className="btn btn-lab" onClick={() => { setS(START); setFlash(null); setLightOn(true); setNote('আবার শুরু। প্রথমে আলো ফেলো।'); }}>
                আবার শুরু
              </button>
            </div>
          </>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              <h4>চলছে</h4>
              <p>{note}</p>
            </div>
            <div className="stats">
              <Stat label="H₂O বাকি" value={bn(s.water)} />
              <Stat label="CO₂ বাকি" value={bn(s.co2)} />
              <Stat label="ATP" value={bn(s.atp)} />
              <Stat label="NADPH" value={bn(s.nadph)} />
              <Stat label="O₂ তৈরি" value={bn(s.o2)} />
              <Stat label="গ্লুকোজ" value={bn(s.glucose)} />
            </div>
            {finished ? (
              <div className="panel" role="status">
                <h3>সমীকরণ মিলে গেছে</h3>
                <p>তুমি ব্যবহার করলে ৬ CO₂ ও ১২ H₂O, আর পেলে ১ C₆H₁₂O₆, ৬ H₂O ও ৬ O₂।</p>
              </div>
            ) : (
              <p className="fb">চ্যালেঞ্জ: আলো বন্ধ করে দেখো CO₂ কতবার ঢোকানো যায়। তারপর ভাবো, একে "অন্ধকার পর্যায়" বললেও কেন আলোর ওপর পরোক্ষে নির্ভর করে।</p>
            )}
          </>
        }
      />
    </Stage>
  );
}
