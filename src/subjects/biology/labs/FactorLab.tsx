import { useState } from 'react';
import { LabGrid, Range, Seg, Stage, Stat } from '../../../components/labkit';
import { bn, smooth } from '../../../core/util';

type Colour = 'red' | 'blue' | 'orange' | 'yellow' | 'green' | 'white';
type Factor = 'light' | 'co2' | 'temp' | 'water';

interface Env {
  light: number;
  co2: number;
  temp: number;
  water: number;
  colour: Colour;
}

const COLOURS: Record<Colour, { label: string; eff: number; hex: string }> = {
  white: { label: 'সাদা', eff: 0.8, hex: '#ffffff' },
  red: { label: 'লাল', eff: 1, hex: '#ff5a4f' },
  blue: { label: 'নীল', eff: 0.92, hex: '#5a8dff' },
  orange: { label: 'কমলা', eff: 0.55, hex: '#ff9f43' },
  yellow: { label: 'হলুদ', eff: 0.28, hex: '#ffe066' },
  green: { label: 'সবুজ', eff: 0.15, hex: '#5cd67a' },
};

const fLight = (l: number) => (1 - Math.exp(-l / 24)) * (1 - 0.35 * smooth(85, 100, l));
const fCo2 = (c: number) => (c / (c + 0.06)) * (1 - 0.7 * smooth(1, 2, c));
const fTemp = (t: number) => smooth(0, 22, t) * (1 - smooth(35, 45, t));
const fWater = (w: number) => smooth(5, 40, w);

/** A teaching model built on Blackman's limiting-factor idea, not measured data. */
function rate(e: Env) {
  const light = fLight(e.light) * COLOURS[e.colour].eff;
  const co2 = fCo2(e.co2);
  return Math.min(light, co2) * fTemp(e.temp) * fWater(e.water);
}

function limiting(e: Env) {
  const parts: [string, number][] = [
    ['আলো', fLight(e.light) * COLOURS[e.colour].eff],
    ['CO₂', fCo2(e.co2)],
    ['তাপমাত্রা', fTemp(e.temp)],
    ['পানি', fWater(e.water)],
  ];
  return parts.reduce((a, b) => (b[1] < a[1] ? b : a));
}

const AXES: Record<Factor, { label: string; unit: string; min: number; max: number; step: number }> = {
  light: { label: 'আলোর তীব্রতা', unit: '%', min: 0, max: 100, step: 1 },
  co2: { label: 'CO₂', unit: '%', min: 0.01, max: 2, step: 0.01 },
  temp: { label: 'তাপমাত্রা', unit: '°C', min: 0, max: 50, step: 1 },
  water: { label: 'পানি', unit: '%', min: 0, max: 100, step: 1 },
};

const W = 560;
const H = 250;
const PAD = { l: 46, r: 14, t: 14, b: 40 };

function RateChart({ env, axis }: { env: Env; axis: Factor }) {
  const [hover, setHover] = useState<number | null>(null);
  const a = AXES[axis];
  const px = (v: number) => PAD.l + ((v - a.min) / (a.max - a.min)) * (W - PAD.l - PAD.r);
  const py = (r: number) => H - PAD.b - r * (H - PAD.t - PAD.b);
  const at = (v: number) => rate({ ...env, [axis]: v });

  const points = Array.from({ length: 81 }, (_, i) => {
    const v = a.min + ((a.max - a.min) * i) / 80;
    return `${px(v).toFixed(1)} ${py(at(v)).toFixed(1)}`;
  });

  const current = env[axis] as number;
  const shown = hover ?? current;

  return (
    <figure className="chart">
      <figcaption>সালোকসংশ্লেষণের হার বনাম {a.label}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${a.label} বাড়ালে হার কীভাবে বদলায়। এখন হার ${bn(Math.round(rate(env) * 100))}%`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - box.left) / box.width) * W;
          const k = Math.min(1, Math.max(0, (x - PAD.l) / (W - PAD.l - PAD.r)));
          setHover(a.min + k * (a.max - a.min));
        }}
      >
        {[0, 0.5, 1].map((r) => (
          <g key={r}>
            <line x1={PAD.l} x2={W - PAD.r} y1={py(r)} y2={py(r)} stroke="#2c4a46" strokeWidth="1" />
            <text x={PAD.l - 8} y={py(r) + 4} textAnchor="end" fontSize="12" fill="#a6bfb4">
              {bn(r * 100)}
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((k) => {
          const v = a.min + (a.max - a.min) * k;
          return (
            <text key={k} x={px(v)} y={H - PAD.b + 18} textAnchor={k === 0 ? 'start' : k === 1 ? 'end' : 'middle'} fontSize="12" fill="#a6bfb4">
              {bn(axis === 'co2' ? v.toFixed(2) : Math.round(v))}{a.unit}
            </text>
          );
        })}
        <text x={(W + PAD.l) / 2} y={H - 4} textAnchor="middle" fontSize="12" fill="#a6bfb4">{a.label}</text>
        <path d={`M${points.join('L')}`} fill="none" stroke="#ffd166" strokeWidth="2" strokeLinejoin="round" />
        <line x1={px(shown)} x2={px(shown)} y1={PAD.t} y2={H - PAD.b} stroke="#a6bfb4" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx={px(current)} cy={py(at(current))} r="6" fill="#ffd166" stroke="#0f2024" strokeWidth="2" />
        {hover !== null && <circle cx={px(hover)} cy={py(at(hover))} r="4" fill="#fff" />}
        <text x={Math.min(W - 80, px(shown) + 8)} y={PAD.t + 14} fontSize="13" fill="#e8f2ec">
          হার {bn(Math.round(at(shown) * 100))}%
        </text>
      </svg>
    </figure>
  );
}

function Tank({ env, value }: { env: Env; value: number }) {
  const bubbles = Math.round(value * 9);
  const glow = COLOURS[env.colour].hex;
  return (
    <svg viewBox="0 0 560 300" role="img" aria-label={`জলজ উদ্ভিদ থেকে ${bn(bubbles)}টি অক্সিজেন বুদবুদ উঠছে`} style={{ background: '#16292c' }}>
      <circle cx="60" cy="50" r="30" fill={glow} opacity={0.2 + (0.8 * env.light) / 100} />
      <polygon points="85,60 292,150 292,270 60,100" fill={glow} opacity={(0.16 * env.light) / 100} />
      <rect x="170" y="70" width="240" height="210" rx="10" fill="#3a8fb7" fillOpacity="0.35" stroke="#b9e0ee" strokeWidth="4" />
      <rect x="172" y="104" width="236" height="174" fill="#3a8fb7" fillOpacity="0.3" />
      <path d="M290 275C286 230 300 200 292 150" stroke="#2c8a4a" strokeWidth="6" fill="none" />
      {[250, 225, 200, 175].flatMap((y) => [-1, 1].map((d) => (
        <path key={`${y}${d}`} d={`M292 ${y}q${d * 22}-14 ${d * 40} 0q${d * -20} 12 ${d * -40} 0Z`} fill="#3fa862" />
      )))}
      {Array.from({ length: bubbles }, (_, i) => (
        <circle key={i} r={4 + (i % 3)} fill="#dff7ff" opacity="0.9">
          <animate attributeName="cy" from="160" to="100" dur={`${1.1 + (i % 4) * 0.3}s`} begin={`${-i * 0.25}s`} repeatCount="indefinite" />
          <animate attributeName="cx" values={`${262 + (i % 5) * 15};${268 + (i % 5) * 15};${262 + (i % 5) * 15}`} dur="1.6s" repeatCount="indefinite" />
        </circle>
      ))}
      <text x="480" y="170" textAnchor="middle" fontSize="42" fontWeight="700" fill="#ffd166">{bn(bubbles * 6)}</text>
      <text x="480" y="196" textAnchor="middle" className="svg-label" fontSize="14">বুদবুদ/মিনিট</text>
    </svg>
  );
}

export default function FactorLab() {
  const [env, setEnv] = useState<Env>({ light: 60, co2: 0.03, temp: 28, water: 80, colour: 'white' });
  const [axis, setAxis] = useState<Factor>('light');
  const set = (patch: Partial<Env>) => setEnv({ ...env, ...patch });
  const value = rate(env);
  const [limitName] = limiting(env);

  return (
    <Stage>
      <LabGrid
        view={
          <>
            <Tank env={env} value={value} />
            <div className="stage-bar" style={{ marginTop: 10, marginBottom: 4 }}>
              <Seg
                label="গ্রাফের অক্ষ"
                value={axis}
                onChange={setAxis}
                options={(Object.keys(AXES) as Factor[]).map((f) => ({ value: f, label: AXES[f].label }))}
              />
            </div>
            <RateChart env={env} axis={axis} />
          </>
        }
        side={
          <>
            <Range label="আলোর তীব্রতা" value={env.light} min={0} max={100} display={`${bn(env.light)}%`} onChange={(light) => set({ light })} />
            <Range label="CO₂" value={env.co2} min={0.01} max={2} step={0.01} display={`${bn(env.co2.toFixed(2))}%`} onChange={(co2) => set({ co2 })} />
            <Range label="তাপমাত্রা" value={env.temp} min={0} max={50} display={`${bn(env.temp)}°C`} onChange={(temp) => set({ temp })} />
            <Range label="পানি" value={env.water} min={0} max={100} display={`${bn(env.water)}%`} onChange={(water) => set({ water })} />
            <div>
              <span style={{ fontSize: 15 }}>আলোর রঙ</span>
              <div className="chips" style={{ marginTop: 3 }}>
                {(Object.keys(COLOURS) as Colour[]).map((c) => (
                  <button key={c} type="button" className="chip-btn" aria-pressed={env.colour === c} onClick={() => set({ colour: c })}>
                    {COLOURS[c].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="stats">
              <Stat label="হার" value={`${bn(Math.round(value * 100))}%`} />
              <Stat label="সীমিতকারী" value={<span style={{ fontSize: 17 }}>{limitName}</span>} />
            </div>
            <p className="panel-note" style={{ color: 'var(--stage-soft)', fontSize: 14, margin: 0 }}>
              সবচেয়ে কম থাকা প্রভাবকটিই হার ঠিক করে দেয়। CO₂ ০.০৩% থেকে বাড়িয়ে দেখো। সংখ্যাগুলো শেখার মডেল, বাস্তব পরিমাপ নয়; তবে তাপমাত্রা ও রঙের ধারা বইয়ের সাথে মেলে।
            </p>
          </>
        }
      />
    </Stage>
  );
}
