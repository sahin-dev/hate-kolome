import { useState } from 'react';
import { LabGrid, Stage, Stat, StepNav, useSteps } from '../../../components/labkit';
import { bn } from '../../../core/util';

const STEPS = [
  { name: 'জনন মাতৃকোষ', text: 'ডিপ্লয়েড কোষ (2n = 4)। DNA অনুলিপি হয়ে গেছে, তাই প্রতিটি ক্রোমোজোমে দুটি ক্রোমাটিড।', chrom: '৪টি', cells: 1 },
  { name: 'প্রোফেজ-১: জোড় বাঁধা', text: 'সমসংস্থ ক্রোমোজোম পাশাপাশি জোড় বাঁধে। এখানেই ক্রসিং ওভারে অংশ বিনিময় হতে পারে।', chrom: '৪টি', cells: 1 },
  { name: 'মেটাফেজ-১', text: 'জোড়াগুলো বিষুবীয় অঞ্চলে সারি বাঁধে। প্রতিটি জোড়া যেকোনো মুখে বসতে পারে। নিচের বোতামে উল্টে দেখো।', chrom: '৪টি', cells: 1 },
  { name: 'অ্যানাফেজ-১', text: 'সমসংস্থ জোড়া আলাদা হয়ে বিপরীত মেরুতে যায়। ক্রোমাটিড এখনো জোড়া লাগানো।', chrom: '৪টি', cells: 1 },
  { name: 'টেলোফেজ-১', text: 'দুটি কোষ হলো। প্রতিটিতে ২টি ক্রোমোজোম। ক্রোমোজোম সংখ্যা অর্ধেক হয়ে গেল: এটিই হ্রাসমূলক ধাপ।', chrom: '২টি', cells: 2 },
  { name: 'মেটাফেজ-২', text: 'দুই কোষেই ক্রোমোজোম মাঝখানে সারি বাঁধে, মাইটোসিসের মতো।', chrom: '২টি', cells: 2 },
  { name: 'অ্যানাফেজ-২', text: 'সেন্ট্রোমিয়ার ভাগ হয়, ক্রোমাটিড আলাদা হয়ে দুই মেরুতে যায়।', chrom: '২টি', cells: 2 },
  { name: 'টেলোফেজ-২: চার গ্যামেট', text: 'একটি 2n কোষ থেকে চারটি n কোষ। এদের মিলিয়ে দেখো, সবগুলো কি এক রকম?', chrom: '২টি', cells: 4 },
];

const BLUE = '#4da3ff';
const ORANGE = '#ff8a5c';
const homologColor = (h: number) => (h === 0 ? BLUE : ORANGE);

interface Chromatid {
  p: number; // pair
  h: number; // homolog
  s: number; // sister
}

const ALL: Chromatid[] = [0, 1].flatMap((p) => [0, 1].flatMap((h) => [0, 1].map((s) => ({ p, h, s }))));

/** Inner sisters swap their tips when crossing over happens on that pair. */
const isCrossed = (c: Chromatid) => (c.h === 0 ? c.s === 1 : c.s === 0);

function position(c: Chromatid, step: number, flip: boolean[]): { x: number; y: number } {
  const side = (c.h === 1) !== flip[c.p] ? 1 : -1;
  const sis = c.s === 0 ? -1 : 1;
  const rowY = 150 + c.p * 170;
  const cellX = 400 + side * 195;

  switch (step) {
    case 0:
      return { x: [315, 480][c.h] + (c.p ? 26 : -18) + sis * 7, y: [170, 300][c.p] + (c.h ? 16 : -14) };
    case 1:
      return { x: 340 + c.p * 130 + (c.h ? 16 : -16) + sis * 7, y: 240 };
    case 2:
      return { x: 400 + side * 18 + sis * 7, y: rowY };
    case 3:
      return { x: 400 + side * 165 + sis * 7, y: rowY };
    case 4:
    case 5:
      return { x: cellX + sis * 7, y: rowY };
    case 6:
      return { x: cellX + sis * 72, y: rowY };
    default:
      return { x: cellX + sis * 96, y: rowY };
  }
}

function ChromatidShape({ c, crossed }: { c: Chromatid; crossed: boolean }) {
  const len = c.p === 0 ? 58 : 36;
  const swapped = crossed && isCrossed(c);
  const tipColor = homologColor(swapped ? 1 - c.h : c.h);
  return (
    <>
      <line y1={-len} y2={len * 0.4} stroke={homologColor(c.h)} strokeWidth="10" strokeLinecap="round" />
      <line y1={len * 0.4} y2={len} stroke={tipColor} strokeWidth="10" strokeLinecap="round" />
      <circle r="5" fill="#fff4cc" />
    </>
  );
}

function Cells({ step }: { step: number }) {
  const cells: [number, number, number, number][] =
    step <= 3
      ? [[400, 240, 345, 215]]
      : step <= 6
        ? [[205, 240, 170, 205], [595, 240, 170, 205]]
        : [[108, 240, 84, 175], [302, 240, 84, 175], [498, 240, 84, 175], [692, 240, 84, 175]];
  return (
    <>
      {cells.map(([cx, cy, rx, ry]) => (
        <ellipse key={`${cx}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="#f4dcae" stroke="#cf9440" strokeWidth="5" />
      ))}
    </>
  );
}

export default function MeiosisLab() {
  const steps = useSteps(STEPS.length, 2800);
  const [crossed, setCrossed] = useState([false, false]);
  const [flip, setFlip] = useState([false, false]);
  const step = steps.index;
  const info = STEPS[step];

  const gameteKey = (group: Chromatid[]) =>
    group
      .map((c) => `${c.p}${c.h}${crossed[c.p] && isCrossed(c) ? 'x' : ''}`)
      .sort()
      .join('-');

  const gametes = [-1, 1].flatMap((side) =>
    [0, 1].map((s) => ALL.filter((c) => ((c.h === 1) !== flip[c.p] ? 1 : -1) === side && c.s === s)),
  );
  const unique = new Set(gametes.map(gameteKey)).size;

  return (
    <Stage>
      <LabGrid
        view={
          <>
            <svg viewBox="0 0 800 480" role="img" aria-label={`মিয়োসিস: ${info.name}`} style={{ background: '#16292c' }}>
              <Cells step={step} />
              {step >= 2 && step <= 3 && <line x1="400" y1="40" x2="400" y2="440" stroke="#9fd8cf" strokeDasharray="6 8" strokeWidth="2" />}
              {step === 5 &&
                [205, 595].map((x) => <line key={x} x1={x} y1="60" x2={x} y2="420" stroke="#9fd8cf" strokeDasharray="6 8" strokeWidth="2" />)}
              {ALL.map((c) => {
                const { x, y } = position(c, step, flip);
                return (
                  <g
                    key={`${c.p}${c.h}${c.s}`}
                    style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 1s ease-in-out' }}
                  >
                    <ChromatidShape c={c} crossed={crossed[c.p] && step >= 1} />
                  </g>
                );
              })}
              {step === 1 &&
                crossed.map((on, p) =>
                  on ? (
                    <text key={p} x={340 + p * 130} y="320" textAnchor="middle" fontSize="30" fill="#ffd166">
                      ✕
                    </text>
                  ) : null,
                )}
            </svg>
            <StepNav steps={steps} />
          </>
        }
        side={
          <>
            <div className="panel" aria-live="polite">
              <h4>{step < 5 ? 'প্রথম বিভাজন' : 'দ্বিতীয় বিভাজন'}</h4>
              <h3>{info.name}</h3>
              <p>{info.text}</p>
            </div>
            <div className="stats">
              <Stat label="কোষ" value={bn(info.cells)} />
              <Stat label="কোষ প্রতি ক্রোমোজোম" value={info.chrom} />
              <Stat label="দশা" value={step >= 4 ? 'n' : '2n'} />
            </div>
            <div className="panel">
              <h4>বৈচিত্র্য তৈরি করো</h4>
              <div className="chips">
                {[0, 1].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="chip-btn"
                    aria-pressed={crossed[p]}
                    onClick={() => setCrossed(crossed.map((v, i) => (i === p ? !v : v)))}
                  >
                    ক্রসিং ওভার: {p === 0 ? 'লম্বা' : 'খাটো'} জোড়া
                  </button>
                ))}
                {[0, 1].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="chip-btn"
                    aria-pressed={flip[p]}
                    disabled={step > 2}
                    onClick={() => setFlip(flip.map((v, i) => (i === p ? !v : v)))}
                  >
                    উল্টাও: {p === 0 ? 'লম্বা' : 'খাটো'} জোড়া
                  </button>
                ))}
              </div>
              {step === STEPS.length - 1 ? (
                <p role="status">
                  চার গ্যামেটে ধরন পাওয়া গেল <strong>{bn(unique)}টি</strong>।{' '}
                  {unique === 4 ? 'সবগুলো আলাদা! বৈচিত্র্য এভাবেই আসে।' : 'ক্রসিং ওভার চালু করে আবার দেখো।'}
                </p>
              ) : (
                <p className="panel-note">উল্টানো যায় মেটাফেজ-১ পর্যন্ত। শেষ ধাপে গ্যামেটের ধরন গোনা হবে।</p>
              )}
            </div>
          </>
        }
      />
    </Stage>
  );
}
