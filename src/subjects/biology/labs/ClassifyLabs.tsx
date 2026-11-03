import { useMemo, useState } from 'react';
import { LabGrid, SortGame, Stage, Stat } from '../../../components/labkit';
import { bn, shuffle } from '../../../core/util';
import { KINGDOMS, SPECIMENS, checkName, classify, type Specimen } from './models/life';

interface Question {
  ask: string;
  truth: (s: Specimen) => boolean;
  /** Where each answer leads: another question, or a kingdom. */
  yes: number | string;
  no: number | string;
}

const KEY: Question[] = [
  { ask: 'সুগঠিত নিউক্লিয়াস আছে কি?', truth: (s) => s.nucleus, yes: 1, no: 'মনেরা' },
  { ask: 'শোষণ পদ্ধতিতে খাদ্য গ্রহণ করে কি?', truth: (s) => s.feeds === 'absorbs', yes: 'ফানজাই', no: 2 },
  { ask: 'সুগঠিত টিস্যু আছে কি?', truth: (s) => s.tissue, yes: 3, no: 'প্রোটিস্টা' },
  { ask: 'সালোকসংশ্লেষণে নিজের খাদ্য তৈরি করে কি?', truth: (s) => s.feeds === 'makes', yes: 'প্লান্টি', no: 'অ্যানিমেলিয়া' },
];

const FEEDS: Record<Specimen['feeds'], string> = { makes: 'নিজে তৈরি করে', absorbs: 'শোষণ করে', swallows: 'গলাধঃকরণ করে' };

function Observation({ s }: { s: Specimen }) {
  const row = (label: string, value: string) => (
    <div className="res-row"><span>{label}</span><strong>{value}</strong></div>
  );
  return (
    <div className="panel">
      <h3>{s.name}</h3>
      <h4>অণুবীক্ষণ ও পর্যবেক্ষণের ফল</h4>
      {row('নিউক্লিয়াস', s.nucleus ? 'সুগঠিত' : 'সুগঠিত নয়')}
      {row('কোষের সংখ্যা', s.many ? 'বহুকোষী' : 'এককোষী')}
      {row('ক্লোরোপ্লাস্ট', s.chloroplast ? 'আছে' : 'নেই')}
      {row('কোষপ্রাচীর', s.wall ? 'আছে' : 'নেই')}
      {row('টিস্যু', s.tissue ? 'সুগঠিত' : 'নেই')}
      {row('খাদ্য গ্রহণ', FEEDS[s.feeds])}
    </div>
  );
}

export function KeyLab() {
  const deck = useMemo(() => shuffle(SPECIMENS), []);
  const [i, setI] = useState(0);
  const [node, setNode] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [slips, setSlips] = useState(0);
  const [score, setScore] = useState(0);
  const specimen = deck[i];

  if (!specimen) {
    return (
      <Stage>
        <div className="panel" role="status">
          <h3>শেষ! {bn(deck.length)}টির মধ্যে {bn(score)}টি একবারও ভুল না করে শনাক্ত করেছ।</h3>
          <button type="button" className="btn btn-lab" onClick={() => { setI(0); setNode(0); setScore(0); }}>আবার করো</button>
        </div>
      </Stage>
    );
  }

  const q = KEY[node];
  const finished = node >= KEY.length;
  const kingdom = classify(specimen);

  const answer = (said: boolean) => {
    if (said !== q.truth(specimen)) {
      setWrong(true);
      setSlips(slips + 1);
      return;
    }
    setWrong(false);
    const next = said ? q.yes : q.no;
    if (typeof next === 'number') setNode(next);
    else {
      setNode(KEY.length);
      if (slips === 0) setScore(score + 1);
    }
  };

  return (
    <Stage>
      <LabGrid
        view={<Observation s={specimen} />}
        side={
          <>
            <Stat label="নমুনা" value={`${bn(i + 1)}/${bn(deck.length)}`} />
            {!finished ? (
              <div className="panel" aria-live="polite">
                <h4>শনাক্তকরণ কী: ধাপে ধাপে উত্তর দাও</h4>
                <h3>{q.ask}</h3>
                <div className="stepnav">
                  <button type="button" className="btn btn-hot" onClick={() => answer(true)}>হ্যাঁ</button>
                  <button type="button" className="btn btn-lab" onClick={() => answer(false)}>না</button>
                </div>
                {wrong && <p style={{ color: '#ffb199' }}>পর্যবেক্ষণের সাথে মিলছে না। বাম পাশের সারণি আবার দেখো।</p>}
              </div>
            ) : (
              <div className="panel" role="status">
                <h3>রাজ্য: {kingdom}</h3>
                <p>{specimen.note}</p>
                <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} onClick={() => { setI(i + 1); setNode(0); setSlips(0); }}>পরের নমুনা →</button>
              </div>
            )}
            <p className="fb">রাজ্য পাঁচটি: {KINGDOMS.join(', ')}। রং বা স্থির থাকা দেখে নয়, কোষের গঠন ও পুষ্টি দেখে সিদ্ধান্ত নাও।</p>
          </>
        }
      />
    </Stage>
  );
}

const NAMES: [string, string][] = [
  ['ধান', 'Oryza sativa'], ['পাট', 'Corchorus capsularis'], ['আম', 'Mangifera indica'], ['কাঁঠাল', 'Artocarpus heterophyllus'],
  ['জবা', 'Hibiscus rosa-sinensis'], ['ইলিশ', 'Tenualosa ilisha'], ['দোয়েল', 'Copsychus saularis'], ['রয়েল বেঙ্গল টাইগার', 'Panthera tigris'],
  ['কলেরা জীবাণু', 'Vibrio cholerae'], ['মানুষ', 'Homo sapiens'],
];

const RANKS: [string, string, string][] = [
  ['জগৎ', 'Animalia', 'সুকেন্দ্রিক, বহুকোষী, পরভোজী'],
  ['পর্ব', 'Chordata', 'জীবনের কোনো পর্যায়ে নটোকর্ড থাকে'],
  ['শ্রেণি', 'Mammalia', 'স্তন্যপায়ী, লোম আছে'],
  ['বর্গ', 'Primate', 'আঁকড়ে ধরার মতো হাত, উন্নত দৃষ্টি'],
  ['গোত্র', 'Hominidae', 'শিম্পাঞ্জি, গরিলা ইত্যাদির সাথে সাদৃশ্য'],
  ['গণ', 'Homo', 'বড় মস্তিষ্ক, দুই পায়ে হাঁটা'],
  ['প্রজাতি', 'Homo sapiens', 'চওড়া, খাড়া কপাল ও পাতলা খুলি'],
];

export function NameLab() {
  const [text, setText] = useState('Homo Sapiens');
  const [italic, setItalic] = useState(false);
  const [underlined, setUnderlined] = useState(false);
  const [deck] = useState(() => shuffle(NAMES));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [depth, setDepth] = useState(0);
  const problem = checkName(text, underlined, italic);
  const [common, correct] = deck[i % deck.length];
  const options = useMemo(() => shuffle([correct, ...shuffle(NAMES.filter((n) => n[1] !== correct)).slice(0, 2).map((n) => n[1])]), [correct]);

  return (
    <Stage>
      <LabGrid
        view={
          <>
            <div className="panel">
              <h4>নাম লেখো, নিয়ম মিলিয়ে দেখো</h4>
              <input className="cq-write" style={{ minHeight: 0, fontStyle: italic ? 'italic' : 'normal', textDecoration: underlined ? 'underline' : 'none' }} value={text} aria-label="বৈজ্ঞানিক নাম" onChange={(e) => setText(e.target.value)} />
              <div className="toggle-row" style={{ marginTop: 6 }}>
                <button type="button" className="chip-btn" aria-pressed={italic} onClick={() => setItalic(!italic)}>তির্যক (মুদ্রণে)</button>
                <button type="button" className="chip-btn" aria-pressed={underlined} onClick={() => setUnderlined(!underlined)}>দাগ (হাতে লেখায়)</button>
              </div>
              <p className={problem ? 'fb fb-no' : 'fb fb-ok'} role="status">{problem ?? 'নিয়ম মেনে লেখা হয়েছে।'}</p>
            </div>
            <div className="panel">
              <h4>{common}-এর বৈজ্ঞানিক নাম কোনটি?</h4>
              <div className="option-stack">
                {options.map((o) => {
                  const state = !picked ? '' : o === correct ? ' right' : o === picked ? ' wrong' : '';
                  return <button key={o} type="button" className={`lab-option${state}`} style={{ fontStyle: 'italic' }} disabled={!!picked} onClick={() => setPicked(o)}>{o}</button>;
                })}
              </div>
              {picked && <button type="button" className="btn btn-lab" style={{ marginTop: 8 }} onClick={() => { setI(i + 1); setPicked(null); }}>পরেরটি →</button>}
            </div>
          </>
        }
        side={
          <div className="panel">
            <h4>মানুষের শ্রেণিবিন্যাস: এক ধাপ করে নামো</h4>
            {RANKS.slice(0, depth + 1).map(([rank, name, why]) => (
              <div key={rank} className="res-row"><span>{rank}: <em>{name}</em></span><span className="panel-note">{why}</span></div>
            ))}
            <button type="button" className="btn btn-hot" style={{ marginTop: 8 }} onClick={() => setDepth(depth >= RANKS.length - 1 ? 0 : depth + 1)}>
              {depth >= RANKS.length - 1 ? 'আবার শুরু' : 'পরের ধাপ →'}
            </button>
            <p className="panel-note">প্রতি ধাপে নতুন বৈশিষ্ট্য যোগ হয়। তাই নিচের দিকে সদস্য কমে, কিন্তু মিল বাড়ে। একে বলে নেস্টেড হায়ারার্কি।</p>
          </div>
        }
      />
    </Stage>
  );
}

export function BranchSort() {
  return (
    <SortGame
      prompt="এই শাখাটি ভৌত না ফলিত?"
      bins={['ভৌত জীববিজ্ঞান', 'ফলিত জীববিজ্ঞান']}
      items={[
        { name: 'কোষবিদ্যা', bin: 'ভৌত জীববিজ্ঞান', why: 'কোষের গঠন ও কাজ।' },
        { name: 'ভ্রূণবিদ্যা', bin: 'ভৌত জীববিজ্ঞান', why: 'ভ্রূণের বিকাশের তত্ত্ব।' },
        { name: 'বংশগতিবিদ্যা', bin: 'ভৌত জীববিজ্ঞান', why: 'জিন ও বংশধারার তত্ত্ব।' },
        { name: 'বাস্তুবিদ্যা', bin: 'ভৌত জীববিজ্ঞান', why: 'জীব ও পরিবেশের সম্পর্ক।' },
        { name: 'শারীরবিদ্যা', bin: 'ভৌত জীববিজ্ঞান', why: 'দেহের কাজের তত্ত্ব।' },
        { name: 'মৎস্যবিজ্ঞান', bin: 'ফলিত জীববিজ্ঞান', why: 'মাছ উৎপাদন ও ব্যবস্থাপনা।' },
        { name: 'কৃষিবিজ্ঞান', bin: 'ফলিত জীববিজ্ঞান', why: 'ফসল উৎপাদনে প্রয়োগ।' },
        { name: 'ফার্মেসি', bin: 'ফলিত জীববিজ্ঞান', why: 'ঔষধশিল্প।' },
        { name: 'জীবপ্রযুক্তি', bin: 'ফলিত জীববিজ্ঞান', why: 'জীব ব্যবহার করে পণ্য তৈরি।' },
        { name: 'বায়োইনফরমেটিকস', bin: 'ফলিত জীববিজ্ঞান', why: 'কম্পিউটারে জীববৈজ্ঞানিক তথ্য বিশ্লেষণ।' },
      ]}
    />
  );
}

export function TissueSort() {
  return (
    <SortGame
      prompt="এই কোষ বা অংশটি কোন টিস্যুর?"
      bins={['সরল উদ্ভিদ টিস্যু', 'জটিল উদ্ভিদ টিস্যু', 'আবরণী', 'যোজক', 'পেশি ও স্নায়ু']}
      items={[
        { name: 'প্যারেনকাইমা', bin: 'সরল উদ্ভিদ টিস্যু', why: 'একই রকম জীবিত কোষ।' },
        { name: 'কোলেনকাইমা', bin: 'সরল উদ্ভিদ টিস্যু', why: 'কোনা পুরু জীবিত কোষ।' },
        { name: 'স্ক্লেরেনকাইমা', bin: 'সরল উদ্ভিদ টিস্যু', why: 'লিগনিনযুক্ত মৃত কোষ।' },
        { name: 'ভেসেল', bin: 'জটিল উদ্ভিদ টিস্যু', why: 'জাইলেমের অংশ।' },
        { name: 'সিভকোষ', bin: 'জটিল উদ্ভিদ টিস্যু', why: 'ফ্লোয়েমের অংশ।' },
        { name: 'সঙ্গীকোষ', bin: 'জটিল উদ্ভিদ টিস্যু', why: 'ফ্লোয়েমের অংশ।' },
        { name: 'ত্বকের স্তর', bin: 'আবরণী', why: 'দেহ ঢেকে রাখে।' },
        { name: 'অন্ত্রের ভেতরের স্তর', bin: 'আবরণী', why: 'শোষণ ও ক্ষরণ।' },
        { name: 'রক্ত', bin: 'যোজক', why: 'তরল যোজক টিস্যু।' },
        { name: 'অস্থি', bin: 'যোজক', why: 'কঙ্কাল যোজক টিস্যু।' },
        { name: 'তরুণাস্থি', bin: 'যোজক', why: 'নমনীয় কঙ্কাল টিস্যু।' },
        { name: 'হৃৎপেশি', bin: 'পেশি ও স্নায়ু', why: 'অনৈচ্ছিক পেশি।' },
        { name: 'নিউরন', bin: 'পেশি ও স্নায়ু', why: 'স্নায়ু টিস্যুর একক।' },
      ]}
    />
  );
}
