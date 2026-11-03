import { useEffect, useRef, useState, type ReactNode } from 'react';
import { bn, shuffle } from '../core/util';

/** Runs `fn` every `ms` while `active`, always calling the latest closure. */
export function useTick(fn: () => void, ms: number, active = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => ref.current(), ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
}

export interface Scenario<S> {
  id: string;
  title: string;
  ask: string;
  options: string[];
  answer: number;
  why: string;
  /** A harder follow-up that sends the student back to the lab. */
  think?: string;
  set: Partial<S>;
  /** Confirms the model really shows the stated answer. Checked by the tests. */
  proves: (state: S) => boolean;
}

/**
 * Commit to a prediction, run the experiment, compare. Committing first is the point:
 * a wrong guess that the student then sees disproved is remembered far better than a fact.
 */
export function PredictBox<S>({ scenarios, onRun }: { scenarios: Scenario<S>[]; onRun: (set: Partial<S>) => void }) {
  const [active, setActive] = useState<Scenario<S> | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  if (!active) {
    return (
      <div className="panel">
        <h4>অনুমান পরীক্ষা বাছো</h4>
        <div className="chips">
          {scenarios.map((s) => (
            <button key={s.id} type="button" className="chip-btn" onClick={() => { setActive(s); setPicked(null); setDone(false); }}>
              {s.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const right = picked === active.answer;
  return (
    <div className="panel" aria-live="polite">
      <h4>আগে অনুমান করো, তারপর চালাও</h4>
      <h3>{active.title}</h3>
      <p>{active.ask}</p>
      <div className="option-stack">
        {active.options.map((o, i) => {
          const state = !done ? '' : i === active.answer ? ' right' : i === picked ? ' wrong' : '';
          return (
            <button key={o} type="button" className={`lab-option${state}`} aria-pressed={picked === i} disabled={done} onClick={() => setPicked(i)}>
              {o}
            </button>
          );
        })}
      </div>
      {!done ? (
        <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} disabled={picked === null} onClick={() => { onRun(active.set); setDone(true); }}>
          {picked === null ? 'আগে একটি উত্তর বেছে নাও' : '▶ পরীক্ষা চালাও'}
        </button>
      ) : (
        <>
          <p style={{ color: right ? '#8fe3b1' : '#ffb199' }}>{right ? 'তোমার অনুমান ঠিক!' : 'অনুমান মেলেনি। ফল দেখে কারণটা বোঝার চেষ্টা করো।'}</p>
          <p>{active.why}</p>
          {active.think && <p style={{ color: '#ffd166' }}>এবার ভাবো: {active.think}</p>}
        </>
      )}
      <button type="button" className="btn btn-lab" style={{ marginTop: 8 }} onClick={() => setActive(null)}>
        অন্য পরীক্ষা বাছো
      </button>
    </div>
  );
}

/** One measured quantity over time, with a read-out that follows the pointer. */
export function MiniChart({
  title, points, xLabel, yUnit, yMax, zones, marker,
}: {
  title: string;
  points: [number, number][];
  xLabel: string;
  yUnit: string;
  yMax: number;
  zones?: { from: number; to: number; label: string; color: string }[];
  marker?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 230;
  const pad = { l: 44, r: 12, t: 12, b: 36 };
  const xs = points.map((p) => p[0]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const px = (v: number) => pad.l + ((v - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r);
  const py = (v: number) => H - pad.b - (Math.min(v, yMax) / yMax) * (H - pad.t - pad.b);
  const nearest = (v: number) => points.reduce((a, b) => (Math.abs(b[0] - v) < Math.abs(a[0] - v) ? b : a));
  const shown = hover !== null ? nearest(hover) : marker !== undefined ? nearest(marker) : null;

  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - box.left) / box.width) * W;
          setHover(x0 + Math.min(1, Math.max(0, (x - pad.l) / (W - pad.l - pad.r))) * (x1 - x0));
        }}
      >
        {zones?.map((z) => (
          <g key={z.label}>
            <rect x={pad.l} width={W - pad.l - pad.r} y={py(z.to)} height={Math.max(0, py(z.from) - py(z.to))} fill={z.color} opacity="0.16" />
            <text x={W - pad.r - 4} y={py(z.to) + 14} textAnchor="end" fontSize="11" fill="#a6bfb4">{z.label}</text>
          </g>
        ))}
        {[0, 0.5, 1].map((k) => (
          <g key={k}>
            <line x1={pad.l} x2={W - pad.r} y1={py(yMax * k)} y2={py(yMax * k)} stroke="#2c4a46" />
            <text x={pad.l - 6} y={py(yMax * k) + 4} textAnchor="end" fontSize="12" fill="#a6bfb4">{bn(Math.round(yMax * k * 10) / 10)}</text>
          </g>
        ))}
        <text x={(W + pad.l) / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#a6bfb4">{xLabel}</text>
        <path d={`M${points.map((p) => `${px(p[0]).toFixed(1)} ${py(p[1]).toFixed(1)}`).join('L')}`} fill="none" stroke="#ffd166" strokeWidth="2" strokeLinejoin="round" />
        {shown && (
          <>
            <line x1={px(shown[0])} x2={px(shown[0])} y1={pad.t} y2={H - pad.b} stroke="#a6bfb4" strokeDasharray="3 4" />
            <circle cx={px(shown[0])} cy={py(shown[1])} r="5" fill="#ffd166" stroke="#0f2024" strokeWidth="2" />
            <text x={Math.min(W - 110, px(shown[0]) + 8)} y={pad.t + 12} fontSize="13" fill="#e8f2ec">{bn(Math.round(shown[1] * 10) / 10)} {yUnit}</text>
          </>
        )}
      </svg>
    </figure>
  );
}

export function Stage({ children }: { children: ReactNode }) {
  return <div className="stage">{children}</div>;
}

export function LabGrid({ view, side }: { view: ReactNode; side: ReactNode }) {
  return (
    <div className="lab-grid">
      <div className="lab-view">{view}</div>
      <aside className="lab-side">{side}</aside>
    </div>
  );
}

interface SegProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function Seg<T extends string>({ label, value, options, onChange }: SegProps<T>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  onChange: (v: number) => void;
}

export function Range({ label, value, min, max, step = 1, display, onChange }: RangeProps) {
  return (
    <label className="range">
      <span className="range-head">
        <span>{label}</span>
        <output>{display ?? bn(value)}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Meter({ label, value, color, display }: { label: string; value: number; color?: string; display?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="meter">
      <span className="meter-head">
        <span>{label}</span>
        <span>{display ?? `${bn(pct)}%`}</span>
      </span>
      <span className="meter-track">
        <span className="meter-fill" style={{ width: `${pct}%`, background: color }} />
      </span>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/** Previous / next / auto-play controls shared by every step-based lab. */
export function useSteps(count: number, autoMs = 3200) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  useTick(
    () =>
      setIndex((i) => {
        if (i >= count - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      }),
    autoMs,
    playing,
  );
  return { index, setIndex, playing, setPlaying, count };
}

export function StepNav({ steps }: { steps: ReturnType<typeof useSteps> }) {
  const { index, setIndex, playing, setPlaying, count } = steps;
  return (
    <div className="stepnav">
      <button type="button" className="btn btn-lab" disabled={index === 0} onClick={() => { setPlaying(false); setIndex(index - 1); }}>
        ← আগের
      </button>
      <button
        type="button"
        className="btn btn-lab"
        onClick={() => {
          if (index >= count - 1) setIndex(0);
          setPlaying(!playing);
        }}
      >
        {playing ? '⏸ থামাও' : '▶ চালাও'}
      </button>
      <button type="button" className="btn btn-lab" disabled={index >= count - 1} onClick={() => { setPlaying(false); setIndex(index + 1); }}>
        পরের →
      </button>
      <span className="stepnav-count">
        ধাপ {bn(index + 1)}/{bn(count)}
      </span>
    </div>
  );
}

export interface SortItem {
  name: string;
  bin: string;
  why: string;
}

/** Tap an item, then tap the group it belongs to. Works the same on touch and mouse. */
export function SortGame({ bins, items, prompt }: { bins: string[]; items: SortItem[]; prompt: string }) {
  const [round, setRound] = useState(0);
  const deck = useRef(shuffle(items));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const item = deck.current[current];

  const choose = (bin: string) => {
    if (!item) return;
    const ok = bin === item.bin;
    setFeedback({ ok, text: `${item.name}: ${item.why}` });
    if (ok) {
      setScore((s) => s + 1);
      setPlaced((p) => ({ ...p, [bin]: [...(p[bin] ?? []), item.name] }));
      setCurrent((c) => c + 1);
    }
  };

  const restart = () => {
    deck.current = shuffle(items);
    setCurrent(0);
    setScore(0);
    setPlaced({});
    setFeedback(null);
    setRound(round + 1);
  };

  return (
    <Stage>
      <div className="sort-top">
        <p className="sort-prompt">{prompt}</p>
        {item ? (
          <div className="sort-card" aria-live="polite">
            {item.name}
          </div>
        ) : (
          <div className="sort-card sort-done" role="status">
            সবগুলো ঠিক জায়গায়! {bn(items.length)}টি শেষ।
          </div>
        )}
      </div>
      <div className="sort-bins">
        {bins.map((b) => (
          <button key={b} type="button" className="sort-bin" onClick={() => choose(b)} disabled={!item}>
            <strong>{b}</strong>
            <span>{(placed[b] ?? []).join(', ') || ' '}</span>
          </button>
        ))}
      </div>
      <div className="sort-foot">
        {feedback ? (
          <p className={feedback.ok ? 'fb fb-ok' : 'fb fb-no'} role="status">
            {feedback.ok ? '✓ ' : '✗ আবার ভাবো। '}
            {feedback.ok ? feedback.text : `${item?.name ?? ''} এই দলে পড়ে না।`}
          </p>
        ) : (
          <p className="fb">একটি দল বেছে নাও।</p>
        )}
        <span className="stepnav-count">
          {bn(score)}/{bn(items.length)}
        </span>
        <button type="button" className="btn btn-lab" onClick={restart}>
          আবার
        </button>
      </div>
    </Stage>
  );
}

/** Tap the steps of a process in the correct order. */
export function OrderGame({ steps, prompt }: { steps: { name: string; detail: string }[]; prompt: string }) {
  const [cards, setCards] = useState(() => shuffle(steps));
  const [done, setDone] = useState<string[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const next = steps[done.length];

  const pick = (name: string) => {
    if (next && name === next.name) {
      setDone([...done, name]);
      setMiss(null);
    } else {
      setMiss(name);
    }
  };

  return (
    <Stage>
      <p className="sort-prompt">{prompt}</p>
      <ol className="order-done">
        {done.map((d, i) => (
          <li key={d}>
            <strong>
              {bn(i + 1)}. {d}
            </strong>
            <span>{steps[i].detail}</span>
          </li>
        ))}
      </ol>
      {next ? (
        <div className="order-cards">
          {cards
            .filter((c) => !done.includes(c.name))
            .map((c) => (
              <button key={c.name} type="button" className={miss === c.name ? 'order-card miss' : 'order-card'} onClick={() => pick(c.name)}>
                {c.name}
              </button>
            ))}
        </div>
      ) : (
        <p className="fb fb-ok" role="status">
          চমৎকার! পুরো ধারা ঠিকভাবে সাজিয়েছ।
        </p>
      )}
      <div className="sort-foot">
        <p className={miss ? 'fb fb-no' : 'fb'}>{miss ? 'এটি এখন নয়। আগে কী ঘটতে হবে ভাবো।' : 'পরের ধাপটি বেছে নাও।'}</p>
        <button
          type="button"
          className="btn btn-lab"
          onClick={() => {
            setCards(shuffle(steps));
            setDone([]);
            setMiss(null);
          }}
        >
          আবার
        </button>
      </div>
    </Stage>
  );
}
