import { useState } from 'react';
import { LabGrid, Seg, Stage, Stat, StepNav, useSteps } from '../../../components/labkit';
import { bn } from '../../../core/util';

interface Phase {
  name: string;
  place: string;
  text: string;
  atp: number;
  co2: number;
  x: number;
}

const AEROBIC: Phase[] = [
  { name: 'গ্লাইকোলাইসিস', place: 'সাইটোপ্লাজম', text: '১ অণু গ্লুকোজ ভেঙে ২ অণু পাইরুভিক এসিড হয়। ৪ ATP তৈরি হয়, ২ ATP খরচ; সাথে ২ NADH + H⁺ থেকে আসে ৬ ATP। মোট লাভ ৮ ATP।', atp: 8, co2: 0, x: 130 },
  { name: 'অ্যাসিটাইল Co-A সৃষ্টি', place: 'মাইটোকন্ড্রিয়ার ম্যাট্রিক্স', text: '২ অণু পাইরুভিক এসিড থেকে ২ CO₂ বের হয়, তৈরি হয় ২ NADH + H⁺, অর্থাৎ ৬ ATP।', atp: 6, co2: 2, x: 345 },
  { name: 'ক্রেবস চক্র', place: 'মাইটোকন্ড্রিয়া', text: 'চক্র ঘুরে ৪ CO₂ বের হয়। ৬ NADH + H⁺ থেকে ১৮, ২ FADH₂ থেকে ৪ ও ২ GTP থেকে ২ ATP: মোট ২৪ ATP।', atp: 24, co2: 4, x: 530 },
  { name: 'ইলেকট্রন প্রবাহতন্ত্র', place: 'মাইটোকন্ড্রিয়া', text: 'আগের ধাপের NADH ও FADH₂ এখানেই ইলেকট্রন ছাড়ে, ATP ও পানি তৈরি হয়। ওপরের ATP-র হিসাব এই ধাপ ধরেই করা। O₂ শেষ ইলেকট্রন গ্রহীতা।', atp: 0, co2: 0, x: 700 },
];

const ANAEROBIC: Phase[] = [
  { name: 'গ্লুকোজের অসম্পূর্ণ জারণ', place: 'সাইটোপ্লাজম', text: 'গ্লাইকোলাইসিসে ১ অণু গ্লুকোজ থেকে ২ অণু পাইরুভিক এসিড ও নিট ২ ATP হয়। O₂ লাগে না।', atp: 2, co2: 0, x: 200 },
  { name: 'পাইরুভিক এসিডের বিজারণ', place: 'সাইটোপ্লাজম', text: 'পাইরুভিক এসিড ইথানল ও CO₂ বা ল্যাকটিক এসিডে পরিণত হয়। অক্সিডেটিভ ফসফোরাইলেশন হয় না, তাই আর ATP মেলে না।', atp: 0, co2: 2, x: 520 },
];

function Tokens({ count, color, y }: { count: number; color: string; y: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={40 + (i % 19) * 38} cy={y + Math.floor(i / 19) * 30} r="12" fill={color} stroke="#0f2024" strokeWidth="2" />
      ))}
    </g>
  );
}

export default function RespirationLab() {
  const [type, setType] = useState<'aerobic' | 'anaerobic'>('aerobic');
  const phases = type === 'aerobic' ? AEROBIC : ANAEROBIC;
  const steps = useSteps(phases.length, 3200);
  const index = Math.min(steps.index, phases.length - 1);
  const phase = phases[index];
  const atp = phases.slice(0, index + 1).reduce((a, p) => a + p.atp, 0);
  const co2 = phases.slice(0, index + 1).reduce((a, p) => a + p.co2, 0);

  return (
    <Stage>
      <div className="stage-bar">
        <Seg
          label="শ্বসনের ধরন"
          value={type}
          onChange={(t) => { setType(t); steps.setIndex(0); steps.setPlaying(false); }}
          options={[{ value: 'aerobic', label: 'সবাত শ্বসন' }, { value: 'anaerobic', label: 'অবাত শ্বসন' }]}
        />
      </div>
      <LabGrid
        view={
          <>
            <svg viewBox="0 0 800 400" role="img" aria-label={`${phase.name}: এ পর্যন্ত ${bn(atp)} ATP`} style={{ background: '#16292c' }}>
              <rect x="16" y="40" width="240" height="170" rx="16" fill="#f4dcae" />
              <text x="136" y="70" textAnchor="middle" className="svg-label svg-label-dark">সাইটোপ্লাজম</text>
              {type === 'aerobic' && (
                <>
                  <rect x="270" y="40" width="514" height="170" rx="80" fill="#f08a63" stroke="#b5401f" strokeWidth="4" />
                  <text x="527" y="70" textAnchor="middle" className="svg-label svg-label-dark">মাইটোকন্ড্রিয়া</text>
                </>
              )}
              {phases.map((p, i) => (
                <g key={p.name} opacity={i <= index ? 1 : 0.35}>
                  <circle cx={p.x} cy="130" r="44" fill={i === index ? '#ffd166' : '#fff4d6'} stroke="#3b2c0a" strokeWidth="2" />
                  <text x={p.x} y="136" textAnchor="middle" fontSize="20" fontWeight="700" fill="#20302a">
                    {p.atp ? `+${bn(p.atp)}` : '—'}
                  </text>
                </g>
              ))}
              <text x="24" y="246" className="svg-label">মোট ATP: {bn(atp)}</text>
              <Tokens count={atp} color="#ffd166" y={268} />
            </svg>
            <StepNav steps={steps} />
          </>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              <h4>{phase.place}</h4>
              <h3>{phase.name}</h3>
              <p>{phase.text}</p>
            </div>
            <div className="stats">
              <Stat label="মোট ATP" value={bn(atp)} />
              <Stat label="CO₂ অণু" value={bn(co2)} />
              <Stat label="শক্তি (kCal/মোল)" value={bn(type === 'aerobic' ? 686 : 56)} />
            </div>
            <p className="fb">
              {type === 'aerobic'
                ? 'হিসাব: ১ NADH + H⁺ = ৩ ATP, ১ FADH₂ = ২ ATP, ১ GTP = ১ ATP। শেষে ৩৮ ATP পাওয়া যায়।'
                : 'তুলনা করো: অবাত শ্বসনে মাত্র ২ ATP। তাই অক্সিজেন থাকলে জীব অনেক বেশি শক্তি পায়।'}
            </p>
          </>
        }
      />
    </Stage>
  );
}
