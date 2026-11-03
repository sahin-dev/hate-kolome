/**
 * Each organelle as a small factory: what enters, what leaves, and the steps between.
 * Stock counts are real bookkeeping, so the tests can hold them to the book's equations:
 * one glucose gives 38 ATP, and 6CO₂ + 12H₂O gives C₆H₁₂O₆ + 6H₂O + 6O₂.
 */
export type Pt = [number, number];
export type Stock = Record<string, number>;

export interface Mol {
  name: string;
  label: string;
  color: string;
}

export const MOLS: Record<string, Mol> = {
  glucose: { name: 'গ্লুকোজ', label: 'গ্লুকোজ', color: '#fff2a8' },
  atp: { name: 'ATP', label: 'ATP', color: '#ffc23d' },
  adp: { name: 'ADP + Pi', label: 'ADP', color: '#e8d9a8' },
  c3: { name: '৩-কার্বন অণু', label: '৩C', color: '#ffe0b0' },
  pyruvate: { name: 'পাইরুভিক এসিড', label: 'পাইরুভিক', color: '#ffb37a' },
  acetyl: { name: 'অ্যাসিটাইল Co-A', label: 'Co-A', color: '#ff9f8a' },
  nadh: { name: 'NADH + H⁺', label: 'NADH', color: '#c6b5f5' },
  fadh: { name: 'FADH₂', label: 'FADH₂', color: '#e0b5f5' },
  gtp: { name: 'GTP', label: 'GTP', color: '#ffd98a' },
  o2: { name: 'অক্সিজেন (O₂)', label: 'O₂', color: '#bdeeff' },
  co2: { name: 'কার্বন ডাই-অক্সাইড (CO₂)', label: 'CO₂', color: '#cfd6db' },
  h2o: { name: 'পানি (H₂O)', label: 'H₂O', color: '#8fd3f4' },
  light: { name: 'সূর্যালোক', label: 'আলো', color: '#ffe066' },
  he: { name: 'H⁺ ও ইলেকট্রন', label: 'H⁺ e⁻', color: '#f7b0d0' },
  nadp: { name: 'NADP⁺', label: 'NADP⁺', color: '#dcd3f7' },
  nadph: { name: 'NADPH', label: 'NADPH', color: '#b7a3f2' },
  ethanol: { name: 'ইথাইল অ্যালকোহল', label: 'ইথানল', color: '#ffc9c9' },
  ntp: { name: 'নিউক্লিওটাইড', label: 'নিউক্লিও', color: '#9fe8ae' },
  mrna: { name: 'RNA বার্তা', label: 'RNA', color: '#7fe0c0' },
  rna: { name: 'রাইবোজোমাল RNA', label: 'RNA', color: '#a8ecd6' },
  protein: { name: 'প্রোটিন', label: 'প্রোটিন', color: '#ffd166' },
  subunit: { name: 'রাইবোজোম অংশ', label: 'অংশ', color: '#8fa8dc' },
  aa: { name: 'অ্যামিনো এসিড', label: 'অ্যামিনো', color: '#ffb0a0' },
  chain: { name: 'পলিপেপটাইড', label: 'পলিপেপটাইড', color: '#ff9d7a' },
  vesicle: { name: 'প্রোটিনের ভেসিকল', label: 'ভেসিকল', color: '#ffe08a' },
  fatty: { name: 'ফ্যাটি এসিড', label: 'ফ্যাটি', color: '#f1e29a' },
  glycerol: { name: 'গ্লিসারল', label: 'গ্লিসারল', color: '#e9efa5' },
  lipid: { name: 'লিপিড', label: 'লিপিড', color: '#f6c56b' },
  sugar: { name: 'শর্করার চিহ্ন', label: 'শর্করা', color: '#fff2a8' },
  parcel: { name: 'নিঃসরণের প্যাকেট', label: 'প্যাকেট', color: '#f1d06e' },
  germ: { name: 'জীবাণু', label: 'জীবাণু', color: '#b5e38a' },
  enzyme: { name: 'হজমকারী উৎসেচক', label: 'উৎসেচক', color: '#f49ac1' },
  bits: { name: 'ব্যবহারযোগ্য ক্ষুদ্র অণু', label: 'ক্ষুদ্র অণু', color: '#ffd9a8' },
  waste: { name: 'বর্জ্য', label: 'বর্জ্য', color: '#b5a493' },
  salt: { name: 'লবণ আয়ন', label: 'লবণ', color: '#e6e6f5' },
  sap: { name: 'কোষরস', label: 'কোষরস', color: '#a9dcf0' },
  turgor: { name: 'রসস্ফীতি চাপ', label: 'চাপ', color: '#7fb8ff' },
  pectin: { name: 'পেকটিন', label: 'পেকটিন', color: '#e9c98a' },
  cellulose: { name: 'সেলুলোজ', label: 'সেলুলোজ', color: '#a9d98f' },
  lignin: { name: 'লিগনিন', label: 'লিগনিন', color: '#b58e5e' },
  wall: { name: 'স্তরযুক্ত প্রাচীর', label: 'প্রাচীর', color: '#7fb97a' },
  tubulin: { name: 'টিউবিউলিন প্রোটিন', label: 'টিউবিউলিন', color: '#cfe8c0' },
  spindle: { name: 'স্পিন্ডল তন্তু', label: 'তন্তু', color: '#9fd8cf' },
  actin: { name: 'অ্যাকটিন প্রোটিন', label: 'অ্যাকটিন', color: '#e0c9a8' },
  track: { name: 'কোষকঙ্কাল তন্তু', label: 'তন্তু', color: '#c9a877' },
  delivered: { name: 'গন্তব্যে পৌঁছানো বস্তু', label: 'পৌঁছেছে', color: '#ffe08a' },
  hb: { name: 'হিমোগ্লোবিন', label: 'Hb', color: '#d9463c' },
  hbo2: { name: 'অক্সিহিমোগ্লোবিন', label: 'HbO₂', color: '#ff7a6b' },
  bicarb: { name: 'বাইকার্বনেট', label: 'HCO₃⁻', color: '#d8dee2' },
};

export interface Move {
  m: string;
  from: Pt;
  to: Pt;
}

export interface Step {
  title: string;
  text: string;
  at: Pt;
  moves: Move[];
  uses?: Stock;
  makes?: Stock;
  /** Inputs that must stay switched on even though the step does not consume them. */
  requires?: string[];
  /** The step happens only while this input is on (or, with a leading !, off). */
  when?: string;
}

export interface Part {
  name: string;
  text: string;
  at: Pt;
}

export interface Closeup {
  id: string;
  headline: string;
  equation: string;
  inputs: string[];
  outputs: string[];
  start: Stock;
  steps: Step[];
  parts: Part[];
  /** Inputs that redirect the process, instead of stopping it. */
  soft?: string[];
  why?: Record<string, string>;
  /** True when the steps go beyond the textbook's level of detail. */
  beyond?: boolean;
  check: { q: string; options: string[]; answer: number; why: string };
}

export type StepState = 'done' | 'blocked' | 'skipped';

export interface RunResult {
  states: StepState[];
  stocks: Stock[];
  /** Running total of what the steps have produced, separate from what was supplied. */
  made: Stock[];
  blockedAt: number;
  missing: string | null;
}

/** Runs the steps in order. One stalled step stops everything after it, as on a real assembly line. */
export function simulate(c: Closeup, off: ReadonlySet<string>): RunResult {
  const stock: Stock = { ...c.start };
  off.forEach((id) => {
    stock[id] = 0;
  });

  const states: StepState[] = [];
  const stocks: Stock[] = [];
  const made: Stock[] = [];
  const produced: Stock = {};
  const record = () => {
    stocks.push({ ...stock });
    made.push({ ...produced });
  };
  let blockedAt = -1;
  let missing: string | null = null;

  c.steps.forEach((s, i) => {
    if (blockedAt >= 0) {
      states.push('blocked');
      record();
      return;
    }
    if (s.when) {
      const negate = s.when.startsWith('!');
      const key = negate ? s.when.slice(1) : s.when;
      if (off.has(key) !== negate) {
        states.push('skipped');
        record();
        return;
      }
    }
    const lacking =
      s.requires?.find((m) => off.has(m)) ??
      Object.keys(s.uses ?? {}).find((m) => (stock[m] ?? 0) < (s.uses as Stock)[m]);
    if (lacking) {
      blockedAt = i;
      missing = lacking;
      states.push('blocked');
      record();
      return;
    }
    Object.entries(s.uses ?? {}).forEach(([m, n]) => {
      stock[m] -= n;
    });
    Object.entries(s.makes ?? {}).forEach(([m, n]) => {
      stock[m] = (stock[m] ?? 0) + n;
      produced[m] = (produced[m] ?? 0) + n;
    });
    states.push('done');
    record();
  });

  return { states, stocks, made, blockedAt, missing };
}

const list = (items: Closeup[]) => Object.fromEntries(items.map((c) => [c.id, c])) as Record<string, Closeup>;

export const CLOSEUPS: Record<string, Closeup> = list([
  {
    id: 'cytoplasm',
    headline: 'গ্লুকোজ ভাঙার প্রথম ধাপ এখানেই। অক্সিজেন থাকুক বা না থাকুক, এই ধাপ চলে।',
    equation: 'গ্লুকোজ → ২ পাইরুভিক এসিড + নিট ২ ATP + ২ NADH',
    inputs: ['glucose', 'atp', 'o2'],
    outputs: ['pyruvate', 'atp', 'nadh', 'ethanol', 'co2'],
    start: { glucose: 1, atp: 2, o2: 1 },
    soft: ['o2'],
    steps: [
      { title: 'শক্তি বিনিয়োগ', text: 'গ্লুকোজকে সক্রিয় করতে শুরুতেই ২ ATP খরচ হয়। ছয় কার্বনের অণুটি ভেঙে তিন কার্বনের দুটি অণু হয়।', at: [150, 200], uses: { glucose: 1, atp: 2 }, makes: { c3: 2 }, moves: [{ m: 'glucose', from: [20, 200], to: [150, 200] }, { m: 'atp', from: [150, 30], to: [150, 180] }] },
      { title: 'শক্তি আদায়', text: 'তিন কার্বনের অণু দুটি জারিত হয়। ৪ ATP ও ২ NADH তৈরি হয়। ২ ATP খরচ হয়েছিল, তাই নিট লাভ ২ ATP।', at: [360, 200], uses: { c3: 2 }, makes: { pyruvate: 2, atp: 4, nadh: 2 }, moves: [{ m: 'c3', from: [170, 200], to: [360, 200] }, { m: 'atp', from: [360, 210], to: [360, 380] }, { m: 'nadh', from: [370, 190], to: [450, 40] }] },
      { title: 'অক্সিজেন আছে: মাইটোকন্ড্রিয়ায় যাত্রা', text: 'পাইরুভিক এসিড মাইটোকন্ড্রিয়ায় ঢোকে। সেখানেই বাকি ৩৬ ATP তৈরি হবে। অক্সিজেন বন্ধ করে দেখো পথ কীভাবে বদলায়।', at: [610, 200], when: 'o2', moves: [{ m: 'pyruvate', from: [380, 200], to: [640, 200] }, { m: 'nadh', from: [450, 40], to: [640, 170] }] },
      { title: 'অক্সিজেন নেই: অবাত পথ', text: 'পাইরুভিক এসিড বিজারিত হয়ে ইথানল ও CO₂ হয় (ইস্টে)। পেশিতে হয় ল্যাকটিক এসিড। NADH ফিরে গিয়ে আবার কাজে লাগে, কিন্তু ATP আর মেলে না।', at: [520, 300], when: '!o2', uses: { pyruvate: 2, nadh: 2 }, makes: { ethanol: 2, co2: 2 }, moves: [{ m: 'pyruvate', from: [380, 200], to: [520, 300] }, { m: 'ethanol', from: [520, 300], to: [690, 330] }, { m: 'co2', from: [520, 300], to: [690, 270] }] },
    ],
    parts: [
      { name: 'উৎসেচক', text: 'সাইটোপ্লাজমের তরলে গ্লাইকোলাইসিসের উৎসেচক ভাসমান থাকে।', at: [255, 110] },
      { name: 'মাইটোকন্ড্রিয়ার দরজা', text: 'পাইরুভিক এসিড এখান দিয়ে ম্যাট্রিক্সে ঢোকে।', at: [650, 120] },
    ],
    why: { glucose: 'গ্লুকোজ নেই, ভাঙার মতো কিছু নেই।', atp: 'শুরুর ২ ATP নেই। কোষের একেবারে ATP শেষ হলে গ্লাইকোলাইসিসও শুরু হতে পারে না।' },
    check: { q: 'অবাত অবস্থায় নিট ATP কত?', options: ['০', '২', '৪', '৩৮'], answer: 1, why: '৪ ATP তৈরি হয়, ২ ATP খরচ হয়। তাই নিট ২ ATP।' },
  },
  {
    id: 'mito',
    headline: 'পাইরুভিক এসিডকে সম্পূর্ণ জারিত করে বিপুল ATP বানায়। অক্সিজেন এখানে শেষ গ্রহীতা।',
    equation: '২ পাইরুভিক এসিড + ২ NADH + ৬ O₂ → ৬ CO₂ + ৬ H₂O + ৩৬ ATP',
    inputs: ['pyruvate', 'nadh', 'o2', 'adp'],
    outputs: ['atp', 'co2', 'h2o'],
    start: { pyruvate: 2, nadh: 2, o2: 6, adp: 36 },
    steps: [
      { title: 'অ্যাসিটাইল Co-A তৈরি', text: 'ম্যাট্রিক্সে ঢুকে প্রতিটি পাইরুভিক এসিড ১ CO₂ হারায়। তৈরি হয় ২ অ্যাসিটাইল Co-A, ২ CO₂ ও ২ NADH।', at: [165, 200], requires: ['o2'], uses: { pyruvate: 2 }, makes: { acetyl: 2, co2: 2, nadh: 2 }, moves: [{ m: 'pyruvate', from: [5, 200], to: [165, 200] }, { m: 'co2', from: [165, 200], to: [165, 12] }] },
      { title: 'ক্রেবস চক্র', text: 'অ্যাসিটাইল Co-A চক্রে ঢোকে। দুই পাকে বের হয় ৪ CO₂, ৬ NADH, ২ FADH₂ ও ২ GTP। খাদ্যের শক্তি এখন NADH ও FADH₂-তে ভরা।', at: [345, 200], requires: ['o2'], uses: { acetyl: 2 }, makes: { co2: 4, nadh: 6, fadh: 2, gtp: 2 }, moves: [{ m: 'acetyl', from: [185, 200], to: [345, 200] }, { m: 'co2', from: [345, 200], to: [345, 12] }, { m: 'nadh', from: [345, 200], to: [545, 195] }] },
      { title: 'ইলেকট্রন প্রবাহতন্ত্র', text: 'ক্রিস্টির ঝিল্লিতে NADH ও FADH₂ ইলেকট্রন ছাড়ে। ১ NADH থেকে ৩ ATP, ১ FADH₂ থেকে ২ ATP। মোট ৩৪ ATP। অক্সিজেন ইলেকট্রন নিয়ে পানি হয়।', at: [545, 195], uses: { nadh: 10, fadh: 2, o2: 6, adp: 34 }, makes: { atp: 34, h2o: 6 }, moves: [{ m: 'o2', from: [705, 20], to: [545, 195] }, { m: 'atp', from: [545, 195], to: [710, 300] }, { m: 'h2o', from: [545, 195], to: [545, 392] }] },
      { title: 'GTP থেকে ATP', text: 'ক্রেবস চক্রের ২ GTP থেকে আরও ২ ATP। মাইটোকন্ড্রিয়ায় মোট ৩৬ ATP। সাইটোপ্লাজমের নিট ২ ATP মিলিয়ে হয় ৩৮ ATP।', at: [440, 200], uses: { gtp: 2, adp: 2 }, makes: { atp: 2 }, moves: [{ m: 'gtp', from: [345, 200], to: [440, 200] }, { m: 'atp', from: [440, 200], to: [710, 300] }] },
    ],
    parts: [
      { name: 'বহিঃঝিল্লি', text: 'মসৃণ বাইরের স্তর; অঙ্গাণুটিকে সাইটোপ্লাজম থেকে আলাদা রাখে।', at: [100, 72] },
      { name: 'ক্রিস্টি', text: 'অন্তঃঝিল্লির ভাঁজ। ভাঁজের জন্য অল্প জায়গায় বিশাল তল মেলে, তাই বেশি ATP তৈরি হয়।', at: [445, 118] },
      { name: 'অক্সিসোম', text: 'ক্রিস্টির গায়ের বৃন্তযুক্ত গোল বস্তু; উৎসেচক এখানে সাজানো থাকে।', at: [255, 110] },
      { name: 'ম্যাট্রিক্স', text: 'ভেতরের তরল। ক্রেবস চক্র এখানে ঘটে। এখানে DNA ও রাইবোজোমও থাকে।', at: [255, 200] },
    ],
    why: {
      o2: 'অক্সিজেন না থাকলে ইলেকট্রন যাওয়ার জায়গা নেই। পুরো প্রবাহ জমে যায়, আর NADH ফাঁকা না হলে ক্রেবস চক্রও থেমে যায়।',
      pyruvate: 'জ্বালানি নেই। গ্লাইকোলাইসিস বন্ধ হলে এখানেও কিছু আসে না।',
      nadh: 'সাইটোপ্লাজম থেকে আসা ২ NADH নেই। হিসাব মিলবে না, ATP-ও কম হবে।',
      adp: 'ADP ও ফসফেট না থাকলে শক্তি জমা রাখার পাত্রই নেই।',
    },
    check: { q: 'মাইটোকন্ড্রিয়ায় সবচেয়ে বেশি ATP তৈরি হয় কোথায়?', options: ['বহিঃঝিল্লিতে', 'ক্রিস্টির ইলেকট্রন প্রবাহতন্ত্রে', 'DNA-তে', 'রাইবোজোমে'], answer: 1, why: 'NADH ও FADH₂-এর শক্তি ক্রিস্টির ঝিল্লিতেই ATP হয়।' },
  },
  {
    id: 'chloro',
    headline: 'সৌরশক্তিকে খাদ্যের রাসায়নিক শক্তিতে বেঁধে ফেলে। গ্রানা শক্তি তোলে, স্ট্রোমা শর্করা গড়ে।',
    equation: '6CO₂ + 12H₂O → C₆H₁₂O₆ + 6H₂O + 6O₂ (আলো, ক্লোরোফিল)',
    inputs: ['light', 'h2o', 'co2', 'adp', 'nadp'],
    outputs: ['glucose', 'o2', 'h2o'],
    start: { light: 1, h2o: 12, co2: 6, adp: 18, nadp: 12 },
    steps: [
      { title: 'ক্লোরোফিল আলো ধরে', text: 'গ্রানার ক্লোরোফিল আলোর ফোটন শোষণ করে। শক্তি পেয়ে তার ইলেকট্রন উত্তেজিত হয়।', at: [200, 150], requires: ['light'], moves: [{ m: 'light', from: [20, 10], to: [200, 130] }] },
      { title: 'পানির ফটোলাইসিস', text: '১২ অণু পানি ভেঙে ৬ অণু O₂, H⁺ ও ইলেকট্রন হয়। অক্সিজেন উপজাত হিসেবে পাতা থেকে বেরিয়ে যায়।', at: [200, 270], uses: { h2o: 12 }, makes: { o2: 6, he: 24 }, moves: [{ m: 'h2o', from: [30, 395], to: [200, 270] }, { m: 'o2', from: [200, 150], to: [30, 25] }] },
      { title: 'ATP ও NADPH তৈরি', text: 'ইলেকট্রন ট্রান্সপোর্ট চেইনে শক্তি ADP-কে ATP-তে বদলায় (ফটোফসফোরাইলেশন)। H⁺ ও ইলেকট্রন নিয়ে NADP⁺ হয় NADPH।', at: [300, 200], uses: { he: 24, adp: 18, nadp: 12 }, makes: { atp: 18, nadph: 12 }, moves: [{ m: 'atp', from: [230, 200], to: [440, 200] }, { m: 'nadph', from: [230, 225], to: [440, 225] }] },
      { title: 'ক্যালভিন চক্রে CO₂ বিজারণ', text: 'স্ট্রোমায় ৬ CO₂ চক্রে ঢোকে। ATP শক্তি দেয়, NADPH হাইড্রোজেন দেয়। এই ধাপে আলোর সরাসরি দরকার নেই, তবে ATP ও NADPH আলো থেকেই আসে।', at: [525, 200], uses: { co2: 6, atp: 18, nadph: 12 }, makes: { glucose: 1, h2o: 6, adp: 18, nadp: 12 }, moves: [{ m: 'co2', from: [700, 15], to: [525, 140] }, { m: 'glucose', from: [525, 200], to: [705, 385] }, { m: 'adp', from: [460, 240], to: [240, 240] }] },
    ],
    parts: [
      { name: 'দ্বিস্তর ঝিল্লি', text: 'ক্লোরোপ্লাস্টকে ঘিরে রাখে, বস্তুর চলাচল নিয়ন্ত্রণ করে।', at: [65, 200] },
      { name: 'গ্রানা', text: 'থাইলাকয়েডের থাক। ক্লোরোফিল এখানে থাকে; আলোকনির্ভর পর্যায়ের কেন্দ্র।', at: [120, 150] },
      { name: 'স্ট্রোমা', text: 'তরল অংশ। উৎসেচক CO₂ থেকে শর্করা বানায়। এখানে শ্বেতসার দানা জমতে পারে।', at: [430, 320] },
    ],
    why: {
      light: 'আলো ছাড়া ক্লোরোফিল শক্তি পায় না। ATP ও NADPH না থাকায় কিছুক্ষণ পর স্ট্রোমার চক্রও থেমে যায়।',
      h2o: 'পানি না ভাঙলে ইলেকট্রন ও H⁺ মিলবে না। উপরন্তু পানির অভাবে পত্ররন্ধ্রও বন্ধ হয়।',
      co2: 'ATP ও NADPH তৈরি থাকলেও কার্বন ছাড়া শর্করা গড়া যায় না।',
      adp: 'ADP ফুরালে ATP বানানোর পাত্র থাকে না। ক্যালভিন চক্রই ADP ফিরিয়ে দেয়।',
      nadp: 'NADP⁺ না থাকলে H⁺ ও ইলেকট্রন ধরে রাখার বাহক থাকে না।',
    },
    check: { q: 'উৎপন্ন O₂ কোন অণু থেকে আসে?', options: ['CO₂', 'H₂O', 'গ্লুকোজ', 'ATP'], answer: 1, why: 'ফটোলাইসিসে পানি ভেঙেই O₂ বের হয়।' },
  },
  {
    id: 'nucleus',
    headline: 'DNA-র মূল নকশা ভেতরে সুরক্ষিত রাখে, আর দরকারি জিনের কপি RNA হিসেবে বাইরে পাঠায়।',
    equation: 'DNA (নকশা) + নিউক্লিওটাইড + ATP → RNA বার্তা',
    inputs: ['ntp', 'atp'],
    outputs: ['mrna'],
    start: { ntp: 9, atp: 2 },
    beyond: true,
    steps: [
      { title: 'জিন খুলে যায়', text: 'ক্রোমাটিনের যে অংশে দরকারি জিন আছে, তার DNA-র দুই সূত্র সাময়িকভাবে আলাদা হয়। শক্তি লাগে।', at: [330, 200], uses: { atp: 1 }, makes: { adp: 1 }, moves: [{ m: 'atp', from: [120, 330], to: [330, 200] }] },
      { title: 'RNA-তে কপি', text: 'নিউক্লিওটাইড একটি একটি করে DNA সূত্রের পরিপূরক হিসেবে বসে। A-র বিপরীতে U, T-র বিপরীতে A, G-র বিপরীতে C।', at: [360, 235], uses: { ntp: 9, atp: 1 }, makes: { mrna: 1, adp: 1 }, moves: [{ m: 'ntp', from: [150, 300], to: [320, 235] }, { m: 'ntp', from: [550, 320], to: [400, 235] }] },
      { title: 'রন্ধ্র দিয়ে বের হওয়া', text: 'RNA বার্তা নিউক্লিয়ার রন্ধ্র দিয়ে সাইটোপ্লাজমে যায়। DNA নিজে কখনো বের হয় না, তাই মূল নকশা নিরাপদ থাকে।', at: [530, 200], moves: [{ m: 'mrna', from: [360, 235], to: [535, 200] }, { m: 'mrna', from: [535, 200], to: [705, 200] }] },
    ],
    parts: [
      { name: 'নিউক্লিয়ার ঝিল্লি', text: 'দুই স্তরের পর্দা, নিউক্লিয়াসকে সাইটোপ্লাজম থেকে আলাদা রাখে।', at: [190, 75] },
      { name: 'নিউক্লিয়ার রন্ধ্র', text: 'ঝিল্লির ছিদ্র; এ পথে বস্তু চলাচল করে।', at: [535, 150] },
      { name: 'ক্রোমাটিন', text: 'DNA ও প্রোটিনের সুতার জট। বিভাজনের সময় কুণ্ডলিত হয়ে ক্রোমোজোম হয়।', at: [420, 110] },
      { name: 'নিউক্লিওলাস', text: 'রাইবোজোম তৈরির স্থান।', at: [255, 130] },
      { name: 'নিউক্লিওপ্লাজম', text: 'ভেতরের রস; নিউক্লিক এসিড, প্রোটিন, উৎসেচক ও লবণ থাকে।', at: [260, 300] },
    ],
    why: { ntp: 'কাঁচামাল নেই, RNA গড়া যাবে না।', atp: 'জিন খোলার ও কপি করার শক্তি নেই।' },
    check: { q: 'DNA নিজে না গিয়ে RNA বাইরে যায় কেন?', options: ['DNA খুব ছোট', 'মূল নকশা সুরক্ষিত থাকে', 'RNA-তে শক্তি বেশি', 'DNA তরল'], answer: 1, why: 'কপি নষ্ট হলে আবার বানানো যায়, মূল নকশা নষ্ট হলে নয়।' },
  },
  {
    id: 'nucleolus',
    headline: 'প্রোটিন তৈরির যন্ত্র রাইবোজোম এখানেই গড়া হয়।',
    equation: 'RNA + প্রোটিন → রাইবোজোমের দুই অংশ',
    inputs: ['rna', 'protein'],
    outputs: ['subunit'],
    start: { rna: 2, protein: 2 },
    steps: [
      { title: 'RNA তৈরি', text: 'নিউক্লিওলাসের সংলগ্ন ক্রোমোজোম অংশ থেকে রাইবোজোমের RNA তৈরি হয়।', at: [300, 200], moves: [{ m: 'rna', from: [120, 330], to: [300, 200] }] },
      { title: 'প্রোটিন আসে', text: 'সাইটোপ্লাজমে তৈরি প্রোটিন রন্ধ্র দিয়ে নিউক্লিওলাসে আসে।', at: [360, 200], moves: [{ m: 'protein', from: [700, 200], to: [380, 200] }] },
      { title: 'অংশ জোড়া লাগে', text: 'RNA ও প্রোটিন মিলে রাইবোজোমের একটি বড় ও একটি ছোট অংশ হয়।', at: [360, 200], uses: { rna: 2, protein: 2 }, makes: { subunit: 2 }, moves: [] },
      { title: 'বেরিয়ে যাওয়া', text: 'অংশ দুটি রন্ধ্র দিয়ে সাইটোপ্লাজমে যায়, সেখানে কাজের সময় এক হয়।', at: [530, 200], moves: [{ m: 'subunit', from: [380, 200], to: [705, 200] }] },
    ],
    parts: [
      { name: 'নিউক্লিওলাস', text: 'RNA ও প্রোটিনে গড়া গোলাকার বস্তু।', at: [360, 130] },
      { name: 'নিউক্লিয়ার রন্ধ্র', text: 'রাইবোজোমের অংশ এ পথে বের হয়।', at: [535, 150] },
    ],
    why: { rna: 'RNA নেই, রাইবোজোম গড়া যাবে না।', protein: 'প্রোটিন নেই। মজার ব্যাপার: রাইবোজোম গড়তেও প্রোটিন লাগে, যা আগের রাইবোজোমই বানায়।' },
    check: { q: 'যে কোষ অনেক প্রোটিন বানায়, তার নিউক্লিওলাস কেমন হবে বলে আশা করো?', options: ['ছোট', 'বড়', 'অনুপস্থিত', 'নিউক্লিয়াসের বাইরে'], answer: 1, why: 'বেশি প্রোটিন মানে বেশি রাইবোজোম দরকার, তাই নিউক্লিওলাস বড় হয়।' },
  },
  {
    id: 'ribosome',
    headline: 'RNA বার্তা পড়ে অ্যামিনো এসিড জুড়ে পলিপেপটাইড চেইন বানায়।',
    equation: 'RNA বার্তা + অ্যামিনো এসিড + শক্তি → পলিপেপটাইড + H₂O',
    inputs: ['mrna', 'aa', 'atp'],
    outputs: ['chain', 'h2o'],
    start: { mrna: 1, aa: 3, atp: 3 },
    beyond: true,
    steps: [
      { title: 'বার্তায় বসে', text: 'রাইবোজোমের ছোট ও বড় অংশ RNA বার্তাকে মাঝখানে ধরে। শুরুর সংকেত খোঁজে।', at: [200, 240], uses: { atp: 1, mrna: 1 }, moves: [{ m: 'mrna', from: [10, 262], to: [200, 262] }] },
      { title: 'তিন অক্ষর পড়ে', text: 'RNA-র তিনটি করে অক্ষর একটি অ্যামিনো এসিড নির্দেশ করে। ঠিক অ্যামিনো এসিডটি এসে বসে।', at: [330, 215], uses: { aa: 1 }, moves: [{ m: 'aa', from: [330, 15], to: [330, 200] }] },
      { title: 'বন্ধন গড়ে', text: 'পরের অ্যামিনো এসিড এসে আগেরটির সাথে পেপটাইড বন্ধনে জুড়ে যায়। প্রতি বন্ধনে ১ অণু পানি বের হয়।', at: [390, 215], uses: { aa: 1, atp: 1 }, makes: { h2o: 1 }, moves: [{ m: 'aa', from: [400, 15], to: [390, 200] }, { m: 'h2o', from: [390, 215], to: [700, 40] }] },
      { title: 'চেইন বাড়ে', text: 'রাইবোজোম তিন অক্ষর এগোয়, আরেকটি অ্যামিনো এসিড যুক্ত হয়। আসল প্রোটিনে শত শত অ্যামিনো এসিড থাকে।', at: [450, 215], uses: { aa: 1, atp: 1 }, makes: { h2o: 1 }, moves: [{ m: 'aa', from: [470, 15], to: [450, 200] }, { m: 'h2o', from: [450, 215], to: [700, 40] }] },
      { title: 'থেমে ছেড়ে দেয়', text: 'থামার সংকেতে এসে চেইন ছেড়ে দেয়। অংশ দুটি আলাদা হয়ে আবার কাজে লাগে।', at: [520, 170], makes: { chain: 1 }, moves: [{ m: 'chain', from: [420, 150], to: [705, 90] }] },
    ],
    parts: [
      { name: 'বড় অংশ', text: 'এখানে অ্যামিনো এসিড জোড়া লাগে। উৎসেচকের জোগানও রাইবোজোম দেয়।', at: [260, 110] },
      { name: 'ছোট অংশ', text: 'RNA বার্তা ধরে রাখে ও পড়তে সাহায্য করে।', at: [260, 305] },
    ],
    why: { mrna: 'নির্দেশ ছাড়া রাইবোজোম জানে না কোন প্রোটিন বানাবে।', aa: 'কাঁচামাল অ্যামিনো এসিড নেই।', atp: 'জোড়া লাগানোর শক্তি নেই।' },
    check: { q: 'রাইবোজোমের পর্দা নেই, তবু এটিকে অঙ্গাণু বলা হয় কেন?', options: ['এটি বড়', 'কোষে নির্দিষ্ট কাজ করে', 'এতে DNA আছে', 'এটি নিউক্লিয়াসে থাকে'], answer: 1, why: 'নির্দিষ্ট কাজের সংগঠিত অংশই অঙ্গাণু; পর্দা থাকা শর্ত নয়।' },
  },
  {
    id: 'rer',
    headline: 'গায়ের রাইবোজোমে তৈরি চেইন নালির ভেতর ঢুকে ভাঁজ হয়, তারপর ভেসিকলে ভরে এগোয়।',
    equation: 'পলিপেপটাইড + শক্তি → ভাঁজ করা প্রোটিন (ভেসিকলে)',
    inputs: ['chain', 'atp'],
    outputs: ['vesicle'],
    start: { chain: 1, atp: 1 },
    steps: [
      { title: 'চেইন নালিতে ঢোকে', text: 'রাইবোজোম চেইন বানাতে বানাতেই সেটি পর্দা ভেদ করে নালির ভেতরে ঠেলে দেয়।', at: [230, 120], moves: [{ m: 'chain', from: [230, 15], to: [230, 165] }] },
      { title: 'ভাঁজ হয়', text: 'নালির ভেতরে চেইন নির্দিষ্ট আকারে ভাঁজ হয়। আকারই প্রোটিনের কাজ ঠিক করে।', at: [370, 195], uses: { chain: 1, atp: 1 }, makes: { protein: 1 }, moves: [{ m: 'protein', from: [240, 195], to: [420, 195] }] },
      { title: 'ভেসিকল গড়ে', text: 'নালির একটি অংশ ফুলে কেটে বেরিয়ে ভেসিকল হয়। ভেতরে প্রোটিন, গন্তব্য গলজি বস্তু।', at: [560, 195], uses: { protein: 1 }, makes: { vesicle: 1 }, moves: [{ m: 'vesicle', from: [430, 195], to: [705, 195] }] },
    ],
    parts: [
      { name: 'রাইবোজোম', text: 'গায়ে লেগে থাকে, তাই এটি অমসৃণ।', at: [150, 95] },
      { name: 'নালির ভেতর', text: 'উৎপাদিত পদার্থের প্রবাহপথ।', at: [150, 200] },
    ],
    why: { chain: 'রাইবোজোম চেইন না দিলে এখানে কিছু আসে না।', atp: 'ভাঁজ ও পরিবহনের শক্তি নেই।' },
    check: { q: 'গ্রন্থিকোষে অমসৃণ জালিকা বেশি থাকে কেন?', options: ['চর্বি জমাতে', 'প্রচুর প্রোটিন বানিয়ে বাইরে পাঠাতে', 'আলো ধরতে', 'ক্রোমোজোম রাখতে'], answer: 1, why: 'হরমোন বা উৎসেচক প্রোটিন বেশি পরিমাণে তৈরি ও পরিবহন করতে হয়।' },
  },
  {
    id: 'ser',
    headline: 'রাইবোজোমহীন নালি। উৎসেচক এখানে লিপিড জাতীয় পদার্থ গড়ে এবং বস্তু পরিবহন করে।',
    equation: 'গ্লিসারল + ৩ ফ্যাটি এসিড + শক্তি → লিপিড',
    inputs: ['glycerol', 'fatty', 'atp'],
    outputs: ['lipid'],
    start: { glycerol: 1, fatty: 3, atp: 1 },
    beyond: true,
    steps: [
      { title: 'কাঁচামাল জড়ো হয়', text: 'নালির গায়ের উৎসেচকের কাছে গ্লিসারল ও ফ্যাটি এসিড আসে।', at: [240, 200], moves: [{ m: 'glycerol', from: [40, 60], to: [230, 190] }, { m: 'fatty', from: [40, 340], to: [230, 210] }] },
      { title: 'জোড়া লাগে', text: 'উৎসেচক শক্তি ব্যবহার করে তিনটি ফ্যাটি এসিড গ্লিসারলের সাথে জোড়ে।', at: [360, 200], uses: { glycerol: 1, fatty: 3, atp: 1 }, makes: { lipid: 1 }, moves: [] },
      { title: 'পাঠিয়ে দেয়', text: 'লিপিড নালি দিয়ে এগিয়ে ঝিল্লি মেরামত বা সঞ্চয়ের কাজে যায়।', at: [540, 200], moves: [{ m: 'lipid', from: [370, 200], to: [705, 200] }] },
    ],
    parts: [{ name: 'উৎসেচক', text: 'নালির পর্দায় উৎসেচক সাজানো থাকে।', at: [240, 130] }],
    why: { glycerol: 'গ্লিসারল নেই।', fatty: 'ফ্যাটি এসিড নেই।', atp: 'শক্তি নেই।' },
    check: { q: 'মসৃণ ও অমসৃণ জালিকার মূল পার্থক্য কী?', options: ['রাইবোজোম লেগে থাকা', 'রং', 'DNA', 'আকার'], answer: 0, why: 'রাইবোজোম থাকলে অমসৃণ, না থাকলে মসৃণ।' },
  },
  {
    id: 'golgi',
    headline: 'প্রোটিন বুঝে নিয়ে শেষ পরিবর্তন করে, ঠিকানা লাগিয়ে প্যাকেট করে পাঠায়।',
    equation: 'প্রোটিনের ভেসিকল + শর্করার চিহ্ন + শক্তি → নিঃসরণের প্যাকেট',
    inputs: ['vesicle', 'sugar', 'atp'],
    outputs: ['parcel'],
    start: { vesicle: 1, sugar: 1, atp: 1 },
    steps: [
      { title: 'গ্রহণ', text: 'জালিকা থেকে আসা ভেসিকল গলজি বস্তুর এক পাশে মিশে যায়।', at: [150, 200], moves: [{ m: 'vesicle', from: [10, 200], to: [165, 200] }] },
      { title: 'পরিবর্তন', text: 'প্রোটিন এক সিস্টার্নি থেকে আরেকটিতে এগোয়। উৎসেচক তাতে শর্করা জুড়ে দেয়।', at: [340, 200], uses: { vesicle: 1, sugar: 1, atp: 1 }, makes: { protein: 1 }, moves: [{ m: 'sugar', from: [340, 15], to: [340, 190] }, { m: 'protein', from: [180, 200], to: [460, 200] }] },
      { title: 'প্যাকেট ও নিঃসরণ', text: 'গন্তব্য অনুযায়ী ভেসিকল তৈরি হয়। ভেসিকল কোষঝিল্লিতে মিশে পদার্থ বাইরে ছাড়ে। হরমোন নিঃসরণ এভাবেই হয়।', at: [560, 200], uses: { protein: 1 }, makes: { parcel: 1 }, moves: [{ m: 'parcel', from: [470, 200], to: [705, 200] }] },
    ],
    parts: [
      { name: 'সিস্টার্নি', text: 'চ্যাপ্টা থলির স্তূপ; এখানে উৎসেচকের কাজ চলে।', at: [340, 95] },
      { name: 'ভেসিকল', text: 'ক্ষুদ্র থলি, যা বস্তু বয়ে নেয়।', at: [560, 110] },
    ],
    why: { vesicle: 'জালিকা থেকে কিছু আসেনি।', sugar: 'শর্করার চিহ্ন না থাকলে প্রোটিন ঠিকানা পায় না।', atp: 'শক্তি নেই।' },
    check: { q: 'ভেতরে প্রোটিন আছে, বাইরে নেই। কোন অঙ্গাণু সন্দেহ করবে?', options: ['মাইটোকন্ড্রিয়া', 'গলজি বস্তু', 'নিউক্লিওলাস', 'সেন্ট্রোজোম'], answer: 1, why: 'উৎপাদন ঠিক, পাঠানো বন্ধ। প্যাকেট করে পাঠানো গলজি বস্তুর কাজ।' },
  },
  {
    id: 'lyso',
    headline: 'উৎসেচকের থলি। পানি যোগ করে বড় অণু ভাঙে, ভালো অংশ ফেরত দেয়, বর্জ্য বাইরে ফেলে।',
    equation: 'জীবাণু + পানি (উৎসেচকের সাহায্যে) → ক্ষুদ্র অণু + বর্জ্য',
    inputs: ['germ', 'enzyme', 'h2o'],
    outputs: ['bits', 'waste'],
    start: { germ: 1, enzyme: 1, h2o: 2 },
    steps: [
      { title: 'গ্রাস', text: 'কোষঝিল্লি জীবাণুকে ঘিরে ভেতরে আনে। এটি একটি থলিতে বন্দী থাকে।', at: [170, 200], moves: [{ m: 'germ', from: [10, 200], to: [170, 200] }] },
      { title: 'মিলন', text: 'লাইসোজোম থলির সাথে মিশে যায়। উৎসেচক পর্দার ভেতরেই থাকে, তাই কোষ নিরাপদ।', at: [340, 200], uses: { germ: 1, enzyme: 1 }, makes: { enzyme: 1 }, moves: [{ m: 'enzyme', from: [340, 20], to: [340, 190] }] },
      { title: 'হজম', text: 'উৎসেচক পানি যোগ করে প্রোটিন, শর্করা ও চর্বির বন্ধন ভাঙে। এটিকে পানি বিয়োজন বলে।', at: [360, 200], uses: { h2o: 2 }, makes: { bits: 3, waste: 1 }, moves: [{ m: 'h2o', from: [360, 385], to: [360, 215] }] },
      { title: 'ফেরত ও বর্জন', text: 'অ্যামিনো এসিড ও শর্করা কোষে ফিরে আবার কাজে লাগে। অপাচ্য অংশ ঝিল্লি দিয়ে বেরিয়ে যায়।', at: [540, 200], moves: [{ m: 'bits', from: [380, 190], to: [705, 90] }, { m: 'waste', from: [380, 215], to: [705, 320] }] },
    ],
    parts: [
      { name: 'লিপিড পর্দা', text: 'উৎসেচকগুলোকে আলাদা রাখে। এটি ফাটলে কোষ নিজেই হজম হতে পারে।', at: [440, 90] },
      { name: 'উৎসেচক', text: 'বড় অণু ভাঙার রাসায়নিক কাঁচি।', at: [280, 270] },
    ],
    why: { germ: 'হজম করার কিছু নেই।', enzyme: 'উৎসেচক ছাড়া জীবাণু টিকে থাকবে। শ্বেত কণিকা তখন দেহ রক্ষা করতে পারবে না।', h2o: 'পানি বিয়োজনে পানি লাগে।' },
    check: { q: 'অক্সিজেনের অভাবে কোষে লাইসোজোমের বিপদ কেন?', options: ['এটি শক্তি বানায়', 'পর্দা নষ্ট হয়ে উৎসেচক ছড়ায়', 'এটি পানি শোষে', 'এটি DNA ভাঙে না'], answer: 1, why: 'শক্তির অভাবে পর্দা ক্ষতিগ্রস্ত হলে উৎসেচক অঙ্গাণু হজম করে।' },
  },
  {
    id: 'vacuole',
    headline: 'কোষরসের গুদাম। লবণ ও শর্করা জমিয়ে পানি টানে, আর সেই চাপে কোষ টানটান থাকে।',
    equation: 'লবণ + শর্করা + পানি → কোষরস ও রসস্ফীতি চাপ',
    inputs: ['salt', 'sugar', 'h2o', 'atp'],
    outputs: ['sap', 'turgor'],
    start: { salt: 2, sugar: 1, h2o: 6, atp: 1 },
    steps: [
      { title: 'দ্রব জমা হয়', text: 'টনোপ্লাস্ট নামের পর্দা শক্তি খরচ করে লবণ ও শর্করা ভেতরে তোলে। কোষরস ঘন হয়।', at: [250, 200], uses: { salt: 2, sugar: 1, atp: 1 }, makes: { sap: 1 }, moves: [{ m: 'salt', from: [15, 90], to: [240, 180] }, { m: 'sugar', from: [15, 300], to: [240, 220] }] },
      { title: 'পানি ঢোকে', text: 'ভেতরের দ্রবণ ঘন হওয়ায় অভিস্রবণে পানি পর্দা পেরিয়ে ঢোকে।', at: [400, 200], uses: { h2o: 6 }, moves: [{ m: 'h2o', from: [705, 40], to: [420, 180] }, { m: 'h2o', from: [705, 360], to: [420, 220] }] },
      { title: 'চাপ তৈরি', text: 'ফোলা কোষগহ্বর সাইটোপ্লাজমকে প্রাচীরের দিকে ঠেলে। এই রসস্ফীতি চাপ গাছের নরম অংশ সোজা রাখে।', at: [560, 200], makes: { turgor: 1 }, moves: [{ m: 'turgor', from: [430, 200], to: [640, 200] }] },
    ],
    parts: [
      { name: 'টনোপ্লাস্ট', text: 'কোষগহ্বরের পর্দা।', at: [165, 100] },
      { name: 'কোষরস', text: 'পানিতে লবণ, শর্করা, জৈব এসিড, রঞ্জক ইত্যাদি।', at: [360, 300] },
    ],
    why: { salt: 'দ্রব কম হলে পানি টানার শক্তি কমে।', sugar: 'দ্রব কম হলে পানি টানার শক্তি কমে।', h2o: 'পানি নেই। চাপ না থাকায় পাতা নেতিয়ে পড়ে।', atp: 'দ্রব তোলার শক্তি নেই।' },
    check: { q: 'দুপুরে পাতা নেতিয়ে সন্ধ্যায় আবার সতেজ হয় কেন?', options: ['পাতা ঘুমায়', 'পানি হারিয়ে রসস্ফীতি কমে, পরে ফেরে', 'ক্লোরোফিল বদলায়', 'প্রাচীর গলে যায়'], answer: 1, why: 'রোদে প্রস্বেদন বেশি, শোষণ কম। পরে পানি ফিরলে চাপও ফেরে।' },
  },
  {
    id: 'wall',
    headline: 'প্রোটোপ্লাজম থেকে নিঃসৃত পদার্থ স্তরে স্তরে জমে শক্ত আবরণ গড়ে।',
    equation: 'পেকটিন + সেলুলোজ + লিগনিন → স্তরযুক্ত কোষপ্রাচীর',
    inputs: ['pectin', 'cellulose', 'lignin'],
    outputs: ['wall'],
    start: { pectin: 1, cellulose: 2, lignin: 1 },
    steps: [
      { title: 'মধ্য পর্দা', text: 'দুটি কোষের মাঝে পেকটিনের স্তর জমে। এটি পাশের কোষকে জুড়ে রাখে।', at: [360, 200], uses: { pectin: 1 }, moves: [{ m: 'pectin', from: [150, 200], to: [350, 200] }] },
      { title: 'প্রাথমিক প্রাচীর', text: 'সেলুলোজ জমে পাতলা প্রাথমিক প্রাচীর গড়ে। এটি তখনো কিছুটা প্রসারিত হতে পারে, তাই কোষ বাড়ে।', at: [320, 200], uses: { cellulose: 1 }, moves: [{ m: 'cellulose', from: [100, 90], to: [315, 200] }] },
      { title: 'গৌণ প্রাচীর', text: 'আরও সেলুলোজ ও লিগনিন জমে তিন স্তরের গৌণ প্রাচীর হয়। মাঝে মাঝে কূপ থাকে, যাতে আদান-প্রদান চলে।', at: [260, 200], uses: { cellulose: 1, lignin: 1 }, makes: { wall: 1 }, moves: [{ m: 'cellulose', from: [100, 90], to: [265, 170] }, { m: 'lignin', from: [100, 310], to: [265, 230] }] },
    ],
    parts: [
      { name: 'মধ্য পর্দা', text: 'দুই কোষের মাঝের স্তর।', at: [360, 60] },
      { name: 'প্রাথমিক প্রাচীর', text: 'প্রথম ও পাতলা স্তর।', at: [318, 340] },
      { name: 'গৌণ প্রাচীর', text: 'তিন স্তরের পুরু অংশ।', at: [262, 60] },
      { name: 'প্লাজমোডেজমাটা', text: 'অণুবীক্ষণিক নালি; পাশের কোষের সাথে পানি ও লবণ চলাচল করে।', at: [360, 340] },
    ],
    why: { pectin: 'পেকটিন না থাকলে কোষ পরস্পর জুড়ে থাকে না।', cellulose: 'সেলুলোজই প্রাচীরের প্রধান উপাদান।', lignin: 'লিগনিন ছাড়া প্রাচীর ততটা শক্ত হয় না।' },
    check: { q: 'কোষপ্রাচীর মৃত হয়েও কোষকে জীবিত রাখতে সাহায্য করে কীভাবে?', options: ['শক্তি বানিয়ে', 'আকৃতি ও সুরক্ষা দিয়ে', 'খাদ্য তৈরি করে', 'DNA বহন করে'], answer: 1, why: 'দৃঢ়তা দেয় এবং পানিতে ফেটে যাওয়া থেকে রক্ষা করে।' },
  },
  {
    id: 'centro',
    headline: 'কোষ বিভাজনের আগে দুই মেরুতে গিয়ে তন্তু তৈরি করে ক্রোমোজোম টানার কাঠামো গড়ে।',
    equation: 'টিউবিউলিন + শক্তি → স্পিন্ডল তন্তু',
    inputs: ['tubulin', 'atp'],
    outputs: ['spindle'],
    start: { tubulin: 4, atp: 2 },
    steps: [
      { title: 'দুই ভাগ হয়', text: 'সেন্ট্রিওল জোড়া দ্বিগুণ হয়ে দুই দিকে সরে যায়।', at: [360, 200], uses: { atp: 1 }, moves: [] },
      { title: 'মেরুতে পৌঁছায়', text: 'সেন্ট্রিওল বিপরীত মেরুতে বসে। চারপাশে রশ্মি বিচ্ছুরিত হয়, একে অ্যাস্টার রে বলে।', at: [100, 200], moves: [] },
      { title: 'তন্তু গড়ে', text: 'টিউবিউলিন জুড়ে দীর্ঘ তন্তু হয়। কিছু তন্তু ক্রোমোজোমের সেন্ট্রোমিয়ারে যুক্ত হয়।', at: [360, 200], uses: { tubulin: 4, atp: 1 }, makes: { spindle: 1 }, moves: [{ m: 'tubulin', from: [360, 15], to: [360, 120] }, { m: 'tubulin', from: [360, 385], to: [360, 280] }] },
    ],
    parts: [
      { name: 'সেন্ট্রিওল', text: 'ফাঁপা দণ্ডের মতো, জোড়ায় থাকে।', at: [100, 110] },
      { name: 'অ্যাস্টার রে', text: 'সেন্ট্রিওলের চারদিকের রশ্মি।', at: [165, 300] },
      { name: 'সেন্ট্রোমিয়ার', text: 'যেখানে তন্তু যুক্ত হয়।', at: [360, 320] },
    ],
    why: { tubulin: 'তন্তু গড়ার প্রোটিন নেই। ক্রোমোজোম আলাদা হবে না।', atp: 'নড়াচড়া ও গঠনের শক্তি নেই।' },
    check: { q: 'উন্নত উদ্ভিদে সেন্ট্রোজোম না থাকলেও বিভাজন হয় কীভাবে?', options: ['বিভাজন হয় না', 'স্পিন্ডল অন্যভাবে তৈরি হয়', 'DNA নিজে সরে', 'প্রাচীর টানে'], answer: 1, why: 'উদ্ভিদকোষেও স্পিন্ডল তৈরি হয়, তবে অ্যাস্টার থাকে না।' },
  },
  {
    id: 'cytoskel',
    headline: 'প্রোটিনের তন্তু কোষকে ধরে রাখে এবং ভেতরের চলাচলের রাস্তা হিসেবে কাজ করে।',
    equation: 'অ্যাকটিন/টিউবিউলিন + শক্তি → তন্তু; ভেসিকল + ATP → গন্তব্য',
    inputs: ['actin', 'atp', 'vesicle'],
    outputs: ['track', 'delivered'],
    start: { actin: 4, atp: 2, vesicle: 1 },
    beyond: true,
    steps: [
      { title: 'তন্তু গড়ে', text: 'ছোট প্রোটিন অণু জুড়ে লম্বা তন্তু হয়।', at: [200, 200], uses: { actin: 4, atp: 1 }, makes: { track: 1 }, moves: [{ m: 'actin', from: [120, 20], to: [200, 190] }] },
      { title: 'কাঠামো ধরে রাখে', text: 'তন্তুগুলো কোষজুড়ে ছড়িয়ে আকৃতি ধরে রাখে, অঙ্গাণু জায়গায় রাখে।', at: [360, 200], moves: [] },
      { title: 'মাল বহন', text: 'বাহক প্রোটিন ATP খরচ করে ভেসিকলকে তন্তু বেয়ে টেনে নিয়ে যায়।', at: [520, 200], uses: { atp: 1, vesicle: 1 }, makes: { delivered: 1 }, moves: [{ m: 'vesicle', from: [30, 200], to: [700, 200] }] },
    ],
    parts: [{ name: 'তন্তু', text: 'অ্যাকটিন, মায়োসিন, টিউবিউলিন ইত্যাদি প্রোটিনে গঠিত।', at: [360, 130] }],
    why: { actin: 'তন্তু গড়া যাবে না, কোষ আকৃতি হারাবে।', atp: 'শক্তি নেই, পরিবহন থামবে।', vesicle: 'বহন করার কিছু নেই।' },
    check: { q: 'কোষকঙ্কাল ঝিল্লিযুক্ত অঙ্গাণু কি?', options: ['হ্যাঁ', 'না, এটি ঝিল্লিবিহীন প্রোটিনের কাঠামো', 'শুধু উদ্ভিদে', 'শুধু নিউক্লিয়াসে'], answer: 1, why: 'এটি প্রোটিনের তন্তু, ঝিল্লি নেই।' },
  },
  {
    id: 'membrane',
    headline: 'কোষের ফটক। কে ঢুকবে আর কে বেরোবে, লিপিড ও প্রোটিনের এই পর্দাই বেছে নেয়।',
    equation: 'ব্যাপন + অভিস্রবণ + প্রোটিন পথ + সক্রিয় পরিবহন',
    inputs: ['o2', 'h2o', 'glucose', 'salt', 'atp'],
    outputs: ['co2', 'waste'],
    start: { o2: 1, h2o: 1, glucose: 1, salt: 1, atp: 1 },
    steps: [
      { title: 'ব্যাপন', text: 'O₂ বাইরে বেশি, তাই ভেতরে যায়। CO₂ ভেতরে বেশি, তাই বাইরে আসে। কোনো শক্তি লাগে না।', at: [150, 200], uses: { o2: 1 }, makes: { co2: 1 }, moves: [{ m: 'o2', from: [150, 15], to: [150, 385] }, { m: 'co2', from: [110, 385], to: [110, 15] }] },
      { title: 'অভিস্রবণ', text: 'পানি পর্দা পেরিয়ে ঘন দ্রবণের দিকে যায়। এতেও শক্তি লাগে না।', at: [270, 200], uses: { h2o: 1 }, moves: [{ m: 'h2o', from: [270, 15], to: [270, 385] }] },
      { title: 'প্রোটিন পথ', text: 'গ্লুকোজ বড় অণু, লিপিড পেরোতে পারে না। প্রোটিনের পথ দিয়ে ঢোকে।', at: [400, 200], uses: { glucose: 1 }, moves: [{ m: 'glucose', from: [400, 15], to: [400, 385] }] },
      { title: 'সক্রিয় পরিবহন', text: 'কম ঘনত্ব থেকে বেশি ঘনত্বের দিকে আয়ন তুলতে হলে পাম্প ATP খরচ করে।', at: [530, 200], uses: { salt: 1, atp: 1 }, moves: [{ m: 'salt', from: [530, 15], to: [530, 385] }, { m: 'atp', from: [600, 385], to: [535, 225] }] },
      { title: 'ভেসিকলে নিঃসরণ', text: 'বড় অণু পর্দা পেরোতে পারে না। ভেসিকল পর্দায় মিশে বাইরে ছেড়ে দেয়।', at: [640, 200], makes: { waste: 1 }, moves: [{ m: 'waste', from: [640, 385], to: [640, 15] }] },
    ],
    parts: [
      { name: 'লিপিড', text: 'দুই স্তর; ছোট অণু ফাঁক দিয়ে পেরোয়।', at: [60, 165] },
      { name: 'প্রোটিন', text: 'ঝিল্লিতে গাঁথা; পথ ও পাম্প হিসেবে কাজ করে।', at: [460, 120] },
    ],
    why: { o2: 'অক্সিজেন ঢুকছে না।', h2o: 'পানি নেই।', glucose: 'গ্লুকোজ নেই, জ্বালানি ঢুকবে না।', salt: 'আয়ন নেই।', atp: 'পাম্প চলবে না। ব্যাপন কিন্তু ATP ছাড়াই চলে।' },
    check: { q: 'ATP ফুরালে কোনটি বন্ধ হবে?', options: ['O₂-র ব্যাপন', 'অভিস্রবণ', 'সক্রিয় পরিবহন', 'কোনোটিই না'], answer: 2, why: 'ঘনত্বের বিপরীতে চলাচলে শক্তি লাগে; ব্যাপনে লাগে না।' },
  },
  {
    id: 'hb',
    headline: 'লৌহযুক্ত প্রোটিন। ফুসফুসে অক্সিজেন ধরে, টিস্যুতে ছেড়ে দেয়। বন্ধনটি অস্থায়ী, সেটিই এর শক্তি।',
    equation: 'হিমোগ্লোবিন + অক্সিজেন ⇌ অক্সিহিমোগ্লোবিন',
    inputs: ['hb', 'o2'],
    outputs: ['hbo2', 'o2'],
    start: { hb: 1, o2: 4 },
    steps: [
      { title: 'ফুসফুসে অক্সিজেন ধরে', text: 'বায়ুথলিতে O₂ বেশি। O₂ রক্তে ব্যাপিত হয়ে হিমোগ্লোবিনের লৌহের সাথে অস্থায়ীভাবে যুক্ত হয়।', at: [170, 200], uses: { hb: 1, o2: 4 }, makes: { hbo2: 1 }, moves: [{ m: 'o2', from: [20, 60], to: [170, 190] }] },
      { title: 'রক্তের স্রোতে', text: 'লোহিত কণিকা অক্সিহিমোগ্লোবিন নিয়ে ধমনি বেয়ে দেহের টিস্যুতে যায়। রক্ত উজ্জ্বল লাল হয়।', at: [360, 200], moves: [{ m: 'hbo2', from: [190, 200], to: [540, 200] }] },
      { title: 'টিস্যুতে ছেড়ে দেয়', text: 'টিস্যুতে O₂ কম, তাই অক্সিজেন আলাদা হয়ে কোষে যায়। মুক্ত হিমোগ্লোবিন ফিরে আসে।', at: [550, 200], uses: { hbo2: 1 }, makes: { hb: 1, o2: 4 }, moves: [{ m: 'o2', from: [550, 200], to: [705, 320] }, { m: 'hb', from: [540, 240], to: [190, 240] }] },
    ],
    parts: [
      { name: 'লৌহ', text: 'হিমোগ্লোবিনের লৌহেই O₂ বসে। লৌহের অভাবে রক্তশূন্যতা হয়।', at: [360, 110] },
      { name: 'ফুসফুস', text: 'এখানে O₂ বেশি।', at: [90, 300] },
      { name: 'টিস্যু', text: 'এখানে O₂ কম।', at: [640, 90] },
    ],
    why: { hb: 'হিমোগ্লোবিন কম মানে রক্তশূন্যতা: অক্সিজেন বহনের ক্ষমতা কমে।', o2: 'ফুসফুসে অক্সিজেন না পেলে রক্ত খালি ফেরে।' },
    check: { q: 'অক্সিহিমোগ্লোবিন অস্থায়ী হওয়া জরুরি কেন?', options: ['রক্ত লাল রাখতে', 'টিস্যুতে O₂ ছাড়তে পারে', 'ওজন কমাতে', 'পানি ধরতে'], answer: 1, why: 'স্থায়ী হলে অক্সিজেন কোষে পৌঁছাত না।' },
  },
]);
