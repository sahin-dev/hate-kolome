import { useMemo, useState } from 'react';
import { StepNav, useSteps } from '../../../../components/labkit';
import { bn } from '../../../../core/util';
import { CLOSE_ART } from './CloseArt';
import { CLOSEUPS, MOLS, simulate, type Move, type Stock } from './closeups';
import { MembraneTester } from './Cutaway';
import { ORG } from './organelles';

const WIDTH = (label: string) => Math.max(44, label.length * 11 + 16);

/** A labelled molecule gliding along its path. Remounting by key restarts the journey. */
function Token({ move, delay }: { move: Move; delay: number }) {
  const mol = MOLS[move.m];
  const w = WIDTH(mol.label);
  return (
    <g opacity="0">
      <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;.1;.5;.9;1" dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
      <animateMotion dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" path={`M${move.from[0]} ${move.from[1]}L${move.to[0]} ${move.to[1]}`} />
      <rect x={-w / 2} y="-12" width={w} height="24" rx="12" fill={mol.color} stroke="#1a241f" strokeWidth="1.5" />
      <text textAnchor="middle" y="5" fontSize="13" fontWeight="700" fill="#10201c">{mol.label}</text>
    </g>
  );
}

function Ledger({ title, ids, stock, off, toggle }: { title: string; ids: string[]; stock: Stock; off?: ReadonlySet<string>; toggle?: (id: string) => void }) {
  return (
    <div className="ledger">
      <h4>{title}</h4>
      {ids.map((id) => {
        const mol = MOLS[id];
        const body = (
          <>
            <span className="mol-dot" style={{ background: mol.color }} aria-hidden="true" />
            <span className="mol-name">{mol.name}</span>
            <strong>{bn(stock[id] ?? 0)}</strong>
          </>
        );
        return toggle ? (
          <button key={id} type="button" className={off?.has(id) ? 'mol off' : 'mol'} aria-pressed={!off?.has(id)} onClick={() => toggle(id)}>
            {body}
          </button>
        ) : (
          <div key={id} className="mol">{body}</div>
        );
      })}
    </div>
  );
}

function CheckYourself({ id }: { id: string }) {
  const { q, options, answer, why } = CLOSEUPS[id].check;
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="panel">
      <h4>ভেবে বলো</h4>
      <p>{q}</p>
      <div className="option-stack">
        {options.map((o, i) => {
          const state = picked === null ? '' : i === answer ? ' right' : i === picked ? ' wrong' : '';
          return (
            <button key={o} type="button" className={`lab-option${state}`} disabled={picked !== null} onClick={() => setPicked(i)}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && <p>{why}</p>}
    </div>
  );
}

function Factory({ id }: { id: string }) {
  const c = CLOSEUPS[id];
  const [off, setOff] = useState<Set<string>>(new Set());
  const [part, setPart] = useState<number | null>(null);
  const steps = useSteps(c.steps.length, 3400);
  const run = useMemo(() => simulate(c, off), [c, off]);

  const index = steps.index;
  const step = c.steps[index];
  const state = run.states[index];
  const stock = run.stocks[index];
  const Art = CLOSE_ART[id];

  const toggle = (m: string) => {
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  // Show what is still on hand, so a removed input visibly reads zero from the very start.
  const inputStock: Stock = { ...stock };
  const stateNote = state === 'blocked' ? 'থেমে গেছে' : state === 'skipped' ? 'এবার এই পথে যায়নি' : 'চলছে';
  const missing = run.missing;

  return (
    <>
      <p className="close-headline">{c.headline}</p>
      <div className="close-grid">
        <Ledger title="ভেতরে যা ঢোকে (চাপ দিয়ে বন্ধ করো)" ids={c.inputs} stock={inputStock} off={off} toggle={toggle} />
        <div className={state === 'done' ? 'close-stage' : 'close-stage close-stalled'}>
          <svg viewBox="0 0 720 400" role="group" aria-label={`${ORG[id].name}: ${step.title}`}>
            <Art />
            <circle key={`ring${index}`} cx={step.at[0]} cy={step.at[1]} r="34" fill="none" stroke={state === 'done' ? '#ffd166' : '#ff6b5b'} strokeWidth="3.5" strokeDasharray="7 7" className="pulse" />
            {state === 'done' &&
              step.moves.map((m, i) => <Token key={`${id}${index}${i}`} move={m} delay={-i * 0.5} />)}
            {c.parts.map((p, i) => (
              <g
                key={p.name}
                className="close-pin"
                role="button"
                tabIndex={0}
                aria-label={p.name}
                aria-pressed={part === i}
                onClick={() => setPart(part === i ? null : i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPart(part === i ? null : i);
                  }
                }}
              >
                <circle cx={p.at[0]} cy={p.at[1]} r="17" fill="transparent" />
                <circle cx={p.at[0]} cy={p.at[1]} r="12" fill={part === i ? '#ffd166' : '#10201c'} stroke="#fff" strokeWidth="2" />
                <text x={p.at[0]} y={p.at[1] + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill={part === i ? '#10201c' : '#fff'}>{bn(i + 1)}</text>
              </g>
            ))}
          </svg>
          {state === 'blocked' && (
            <div className="close-stop" role="status">
              ✕ {missing ? MOLS[missing].name : ''} নেই: উৎপাদন থেমে গেছে
            </div>
          )}
        </div>
        <Ledger title="তৈরি হয়েছে (এখন পর্যন্ত)" ids={c.outputs} stock={run.made[index]} />
      </div>
      <StepNav steps={steps} />
      <div className="close-info">
        <div className="panel" aria-live="polite">
          <h4>ধাপ {bn(index + 1)}: {stateNote}</h4>
          <h3>{step.title}</h3>
          {state === 'blocked' && missing ? (
            <p style={{ color: '#ffb199' }}>{run.blockedAt === index ? c.why?.[missing] : `আগের ধাপ থেমে যাওয়ায় এই ধাপও চলতে পারছে না।`}</p>
          ) : (
            <p>{step.text}</p>
          )}
          {(step.uses || step.makes) && (
            <p className="close-reaction">
              {Object.entries(step.uses ?? {}).map(([m, n]) => `${bn(n)} ${MOLS[m].label}`).join(' + ') || '—'}
              {' → '}
              {Object.entries(step.makes ?? {}).map(([m, n]) => `${bn(n)} ${MOLS[m].label}`).join(' + ') || 'পরিবর্তন'}
            </p>
          )}
        </div>
        <div className="panel">
          <h4>পুরো কাজের হিসাব</h4>
          <p className="close-equation">{c.equation}</p>
          {part !== null ? (
            <>
              <h3>{c.parts[part].name}</h3>
              <p>{c.parts[part].text}</p>
            </>
          ) : (
            <p className="panel-note">ছবির সংখ্যায় চাপ দিলে সেই অংশের পরিচয় দেখবে।</p>
          )}
          {c.beyond && <p className="panel-note">এই ধাপগুলো বইয়ের চেয়ে কিছুটা বিস্তারিত, বোঝার সুবিধার জন্য।</p>}
        </div>
        <CheckYourself key={id} id={id} />
      </div>
      {id === 'membrane' && <MembraneTester />}
    </>
  );
}

export function Closeup({ id, onClose, options, onPick }: { id: string; onClose?: () => void; options?: string[]; onPick?: (id: string) => void }) {
  return (
    <div className="cutaway">
      <div className="stepnav" style={{ marginTop: 0, marginBottom: 8 }}>
        {onClose && <button type="button" className="btn btn-lab" onClick={onClose}>← কোষে ফেরো</button>}
        <strong>{ORG[id].name}: কাছ থেকে দেখো</strong>
      </div>
      {options && onPick && (
        <div className="chips cell-types" role="group" aria-label="অঙ্গাণু বাছাই">
          {options.map((o) => (
            <button key={o} type="button" className="chip-btn" aria-pressed={o === id} onClick={() => onPick(o)}>
              {ORG[o].name}
            </button>
          ))}
        </div>
      )}
      <Factory key={id} id={id} />
    </div>
  );
}
