import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stage, Stat } from '../../../components/labkit';
import { bn, shuffle } from '../../../core/util';
import { CASES, CQ_MARKS, scoreReasons, type Case, type Reasoned } from './cell/cases';

function ReasonPicker({ part, marks, onDone }: { part: Reasoned; marks: number; onDone: (score: number) => void }) {
  const options = useMemo(() => shuffle([...part.good, ...part.bad]), [part]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const toggle = (text: string) => {
    if (checked) return;
    if (chosen.includes(text)) setChosen(chosen.filter((c) => c !== text));
    else if (chosen.length < part.good.length) setChosen([...chosen, text]);
  };

  return (
    <>
      <div className="option-stack">
        {options.map((o) => {
          const state = !checked ? '' : part.good.includes(o) ? ' right' : chosen.includes(o) ? ' wrong' : '';
          return (
            <button key={o} type="button" className={`lab-option${state}`} aria-pressed={chosen.includes(o)} disabled={checked} onClick={() => toggle(o)}>
              {o}
            </button>
          );
        })}
      </div>
      {!checked ? (
        <button
          type="button"
          className="btn btn-hot"
          style={{ marginTop: 8 }}
          disabled={chosen.length < part.good.length}
          onClick={() => {
            setChecked(true);
            onDone(scoreReasons(chosen, part.good, marks));
          }}
        >
          {chosen.length < part.good.length ? `আরও ${bn(part.good.length - chosen.length)}টি বাছো` : 'উত্তর যাচাই করো'}
        </button>
      ) : (
        <div className="cq-model" role="status">
          <strong>আদর্শ উত্তর:</strong> {part.model}
        </div>
      )}
    </>
  );
}

function CaseView({ item }: { item: Case }) {
  const [ka, setKa] = useState<number | null>(null);
  const [kha, setKha] = useState<number | null>(null);
  const [ga, setGa] = useState<number | null>(null);
  const [claim, setClaim] = useState<number | null>(null);
  const [ghaScore, setGhaScore] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const claimRight = claim === item.gha.claim;
  const kaMarks = ka === null ? null : ka === item.ka.answer ? CQ_MARKS.ka : 0;
  const ghaMarks = ghaScore === null ? null : ghaScore + (claimRight ? 1 : 0);
  const done = kaMarks !== null && kha !== null && ga !== null && ghaMarks !== null;
  const total = (kaMarks ?? 0) + (kha ?? 0) + (ga ?? 0) + (ghaMarks ?? 0);

  return (
    <>
      <div className="cq-stimulus">
        <p>{item.stimulus}</p>
        {item.table && (
          <div className="table-wrap">
            <table className="cq-table">
              <thead><tr>{item.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{item.table.rows.map((r) => <tr key={r[0]}>{r.map((c) => <td key={c}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        {item.labTry && (
          <Link className="lab-link fb" to={item.labTry.startsWith('/') ? item.labTry : `/biology/ch02/lab/cell?try=${item.labTry}`}>
            🔬 উত্তর দেওয়ার আগে জীবন্ত কোষে নিজে পরীক্ষা করো →
          </Link>
        )}
      </div>

      <section className="cq-level">
        <h3>ক. {item.ka.q}<span>জ্ঞান · {bn(1)} নম্বর</span></h3>
        <div className="option-stack">
          {item.ka.options.map((o, i) => {
            const state = ka === null ? '' : i === item.ka.answer ? ' right' : i === ka ? ' wrong' : '';
            return <button key={o} type="button" className={`lab-option${state}`} disabled={ka !== null} onClick={() => setKa(i)}>{o}</button>;
          })}
        </div>
        {ka !== null && <div className="cq-model" role="status">{item.ka.why}</div>}
      </section>

      <section className="cq-level">
        <h3>খ. {item.kha.q}<span>অনুধাবন · {bn(2)} নম্বর</span></h3>
        <ReasonPicker part={item.kha} marks={CQ_MARKS.kha} onDone={setKha} />
      </section>

      <section className="cq-level">
        <h3>গ. {item.ga.q}<span>প্রয়োগ · {bn(3)} নম্বর</span></h3>
        <ReasonPicker part={item.ga} marks={CQ_MARKS.ga} onDone={setGa} />
      </section>

      <section className="cq-level">
        <h3>ঘ. {item.gha.q}<span>উচ্চতর দক্ষতা · {bn(4)} নম্বর</span></h3>
        <p className="fb" style={{ marginTop: 6 }}>আগে তোমার সিদ্ধান্ত নাও, তারপর তার পক্ষে তিনটি প্রমাণ বাছো।</p>
        <div className="option-stack">
          {item.gha.claims.map((c, i) => {
            const state = ghaScore === null ? '' : i === item.gha.claim ? ' right' : i === claim ? ' wrong' : '';
            return <button key={c} type="button" className={`lab-option${state}`} aria-pressed={claim === i} disabled={ghaScore !== null} onClick={() => setClaim(i)}>{c}</button>;
          })}
        </div>
        {claim !== null && (
          <>
            <h4 style={{ marginTop: 10 }}>প্রমাণ</h4>
            <ReasonPicker part={item.gha} marks={3} onDone={setGhaScore} />
          </>
        )}
        <label className="fb" style={{ display: 'block', marginTop: 10 }}>
          পরীক্ষার খাতার মতো নিজের ভাষায় লিখে আদর্শ উত্তরের সাথে মিলিয়ে নাও:
          <textarea className="cq-write" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </label>
      </section>

      {done && (
        <div className="stats" style={{ marginTop: 12 }} role="status">
          <Stat label="মোট নম্বর" value={`${bn(total)}/১০`} />
          <Stat label="ঘ অংশ" value={`${bn(ghaMarks ?? 0)}/৪`} />
        </div>
      )}
    </>
  );
}

export function CaseRunner({ cases }: { cases: Case[] }) {
  const [id, setId] = useState(cases[0].id);
  const item = cases.find((c) => c.id === id)!;

  return (
    <Stage>
      <div className="chips cell-types" role="group" aria-label="অনুশীলনের উদ্দীপক">
        {cases.map((c) => (
          <button key={c.id} type="button" className="chip-btn" aria-pressed={c.id === id} onClick={() => setId(c.id)}>
            {c.title}
          </button>
        ))}
      </div>
      <CaseView key={id} item={item} />
    </Stage>
  );
}

export default function CaseLab() {
  return <CaseRunner cases={CASES} />;
}
