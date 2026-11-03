import { useRef, useState } from 'react';
import { LabGrid, Meter, Range, SortGame, Stage, Stat, useTick } from '../../../components/labkit';
import { bn } from '../../../core/util';
import { START_POPS, WEB_EDGES, WEB_ORDER, energyAt, foodChains, peopleFed, webStep, type Pops, type Species } from './models/life';

const SPECIES: Record<Species, { name: string; x: number; y: number; color: string }> = {
  algae: { name: 'শৈবাল', x: 110, y: 330, color: '#4fae72' },
  zoo: { name: 'জুপ্লাংকটন', x: 270, y: 230, color: '#8fc4ef' },
  small: { name: 'ছোট মাছ', x: 170, y: 120, color: '#ffd166' },
  big: { name: 'বড় মাছ', x: 430, y: 150, color: '#ff9f6b' },
  hawk: { name: 'বাজ পাখি', x: 330, y: 40, color: '#e6a3b5' },
};

function trend(now: number) {
  if (now === 0) return 'বিলুপ্ত';
  if (now > 1.08) return 'বাড়ছে';
  if (now < 0.92) return 'কমছে';
  return 'স্থির';
}

export function FoodWebLab() {
  const [removed, setRemoved] = useState<Set<Species>>(new Set());
  const [pops, setPops] = useState<Pops>(START_POPS);
  const [year, setYear] = useState(0);
  const pending = useRef(removed);
  pending.current = removed;

  useTick(() => {
    setPops((p) => webStep(p, pending.current));
    setYear((y) => y + 1);
  }, 120, removed.size > 0 && year < 400);

  const toggle = (id: Species) => {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setYear(0);
    if (removed.has(id)) setPops((p) => ({ ...p, [id]: 0.3 }));
  };

  const reset = () => {
    setRemoved(new Set());
    setPops(START_POPS);
    setYear(0);
  };

  return (
    <Stage>
      <LabGrid
        view={
          <svg viewBox="0 0 560 390" role="group" aria-label="পুকুরের খাদ্যজাল" style={{ background: '#16292c' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0L10 5L0 10Z" fill="#a6bfb4" />
              </marker>
            </defs>
            {WEB_EDGES.map(([a, b]) => {
              const p = SPECIES[a];
              const q = SPECIES[b];
              const dx = q.x - p.x;
              const dy = q.y - p.y;
              const d = Math.hypot(dx, dy);
              return (
                <line key={a + b} x1={p.x + (dx / d) * 40} y1={p.y + (dy / d) * 40} x2={q.x - (dx / d) * 44} y2={q.y - (dy / d) * 44} stroke="#a6bfb4" strokeWidth="2.5" opacity={pops[a] && pops[b] ? 0.9 : 0.15} markerEnd="url(#arrow)" />
              );
            })}
            {WEB_ORDER.map((id) => {
              const s = SPECIES[id];
              const r = 18 + 20 * Math.min(1.6, pops[id]);
              return (
                <g
                  key={id}
                  className="part"
                  role="button"
                  tabIndex={0}
                  aria-label={`${s.name}: ${trend(pops[id])}`}
                  aria-pressed={removed.has(id)}
                  onClick={() => toggle(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(id);
                    }
                  }}
                >
                  <circle cx={s.x} cy={s.y} r="38" fill="transparent" />
                  <circle cx={s.x} cy={s.y} r={r} fill={s.color} opacity={pops[id] ? 1 : 0.18} style={{ transition: 'r .2s' }} />
                  <text x={s.x} y={s.y + 5} textAnchor="middle" className="svg-label svg-label-dark" fontSize="14">{s.name}</text>
                </g>
              );
            })}
          </svg>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              <h4>জীবে চাপ দিয়ে সরাও, তারপর দেখো পুকুর কীভাবে বদলায়</h4>
              {WEB_ORDER.map((id) => (
                <Meter key={id} label={SPECIES[id].name} value={pops[id] / 2} color={SPECIES[id].color} display={trend(pops[id])} />
              ))}
              <button type="button" className="btn btn-lab" style={{ marginTop: 8 }} onClick={reset}>পুকুর আগের মতো করো</button>
            </div>
            <Stat label="খাদ্যশিকল" value={bn(foodChains().length)} />
            <p className="fb">তীর শক্তির প্রবাহ দেখায়: যাকে খাওয়া হয় তার থেকে যে খায় তার দিকে। বাজ পাখি সরালে শুধু তার শিকার নয়, দুই-তিন ধাপ নিচেও প্রভাব পড়ে। শৈবাল সরালে কী হয়?</p>
            <p className="panel-note" style={{ color: 'var(--stage-soft)', fontSize: 14, margin: 0 }}>পরিবর্তনের ধারা দেখানোর সরল মডেল, প্রকৃত গণনা নয়।</p>
          </>
        }
      />
    </Stage>
  );
}

const LEVELS = ['উৎপাদক', '১ম স্তরের খাদক', '২য় স্তরের খাদক', '৩য় স্তরের খাদক', 'সর্বোচ্চ খাদক'];

export function PyramidLab() {
  const [sun, setSun] = useState(100000);
  const [share, setShare] = useState(10);
  const values = LEVELS.map((_, i) => energyAt(sun, i, share / 100));
  const crop = energyAt(sun, 0);
  const each = 100;

  return (
    <Stage>
      <LabGrid
        view={
          <div className="pyramid" role="list" aria-label="শক্তি পিরামিড">
            {[...LEVELS].reverse().map((name, r) => {
              const i = LEVELS.length - 1 - r;
              const width = Math.max(1.5, (Math.log10(values[i] + 1) / Math.log10(values[0] + 1)) * 100);
              return (
                <div key={name} className="pyr-row" role="listitem">
                  <span className="pyr-name">{name}</span>
                  <span className="pyr-bar"><span style={{ width: `${width}%` }} /></span>
                  <span className="pyr-val">{bn(values[i] < 10 ? values[i].toFixed(2) : Math.round(values[i]))}</span>
                </div>
              );
            })}
          </div>
        }
        side={
          <>
            <Range label="সূর্য থেকে আসা শক্তি" value={sun} min={10000} max={500000} step={10000} onChange={setSun} />
            <Range label="পরের স্তরে যায়" value={share} min={5} max={20} display={`${bn(share)}%`} onChange={setShare} />
            <div className="stats">
              <Stat label="উৎপাদকে ধরা পড়ে" value="২%" />
              <Stat label="ভাত খেলে কতজন" value={bn(peopleFed(each, crop, false))} />
              <Stat label="মাছ খাইয়ে খেলে" value={bn(peopleFed(each, crop, true))} />
            </div>
            <p className="fb">একই ফসল সরাসরি খেলে অনেক বেশি মানুষের খাদ্য হয়; মাঝে এক স্তর বাড়লে প্রায় ৯০% শক্তি হারায়। শক্তির প্রবাহ একমুখী, তাই খাদ্যশিকল ৪–৫ ধাপের বেশি লম্বা হয় না। বার লগ স্কেলে আঁকা; পাশের সংখ্যাটিই প্রকৃত মান।</p>
          </>
        }
      />
    </Stage>
  );
}

export function RelationSort() {
  return (
    <SortGame
      prompt="দুই জীবের এই সম্পর্কটি কোন ধরনের?"
      bins={['মিউচুয়ালিজম', 'কমেনসালিজম', 'শোষণ', 'প্রতিযোগিতা', 'অ্যান্টিবায়োসিস']}
      items={[
        { name: 'লাইকেনে শৈবাল ও ছত্রাক', bin: 'মিউচুয়ালিজম', why: 'শৈবাল খাদ্য দেয়, ছত্রাক আশ্রয় ও পানি। দুজনই লাভবান।' },
        { name: 'শিমের মূলে রাইজোবিয়াম', bin: 'মিউচুয়ালিজম', why: 'ব্যাকটেরিয়া নাইট্রোজেন দেয়, গাছ খাদ্য দেয়।' },
        { name: 'মৌমাছি ও ফুল', bin: 'মিউচুয়ালিজম', why: 'মৌমাছি মধু পায়, ফুলের পরাগায়ন হয়।' },
        { name: 'বড় গাছের ডালে পরাশ্রয়ী অর্কিড', bin: 'কমেনসালিজম', why: 'অর্কিড আশ্রয় পায়, গাছের ক্ষতি নেই।' },
        { name: 'স্বর্ণলতা ও পোষক গাছ', bin: 'শোষণ', why: 'স্বর্ণলতা পোষকের খাদ্য শুষে নেয়।' },
        { name: 'একই জমিতে আগাছা ও ধান', bin: 'প্রতিযোগিতা', why: 'আলো, পানি ও পুষ্টি নিয়ে লড়াই।' },
        { name: 'Penicillium ও ব্যাকটেরিয়া', bin: 'অ্যান্টিবায়োসিস', why: 'ছত্রাকের রাসায়নিক ব্যাকটেরিয়ার বৃদ্ধি থামায়।' },
      ]}
    />
  );
}
