/** Models for chapters 1, 3, 4, 11, 12, 13 and 14. */

/* ---------- Classification (chapter 1) ---------- */
export interface Specimen {
  name: string;
  nucleus: boolean;
  many: boolean;
  chloroplast: boolean;
  wall: boolean;
  /** How it feeds: makes food, absorbs it, or swallows it. */
  feeds: 'makes' | 'absorbs' | 'swallows';
  tissue: boolean;
  note: string;
}

export const SPECIMENS: Specimen[] = [
  { name: 'ব্যাকটেরিয়া', nucleus: false, many: false, chloroplast: false, wall: true, feeds: 'absorbs', tissue: false, note: 'নিউক্লিয়ার পর্দা নেই।' },
  { name: 'নীলাভ সবুজ শৈবাল (Nostoc)', nucleus: false, many: false, chloroplast: false, wall: true, feeds: 'makes', tissue: false, note: 'সবুজ দেখালেও নিউক্লিয়াস সুগঠিত নয়। রং দেখে ভুল করা সহজ।' },
  { name: 'অ্যামিবা', nucleus: true, many: false, chloroplast: false, wall: false, feeds: 'swallows', tissue: false, note: 'এককোষী, নিউক্লিয়াস আছে, টিস্যু নেই।' },
  { name: 'ডায়াটম', nucleus: true, many: false, chloroplast: true, wall: true, feeds: 'makes', tissue: false, note: 'খাদ্য তৈরি করলেও এককোষী, তাই প্লান্টি নয়।' },
  { name: 'মাশরুম', nucleus: true, many: true, chloroplast: false, wall: true, feeds: 'absorbs', tissue: false, note: 'স্থির থাকলেও উদ্ভিদ নয়: ক্লোরোপ্লাস্ট নেই, শোষণে খায়।' },
  { name: 'ইস্ট', nucleus: true, many: false, chloroplast: false, wall: true, feeds: 'absorbs', tissue: false, note: 'এককোষী হলেও ছত্রাক: শোষণে খায়, প্রাচীরে কাইটিন।' },
  { name: 'কাঁঠাল গাছ', nucleus: true, many: true, chloroplast: true, wall: true, feeds: 'makes', tissue: true, note: 'উন্নত টিস্যু, সালোকসংশ্লেষণ করে।' },
  { name: 'ইলিশ মাছ', nucleus: true, many: true, chloroplast: false, wall: false, feeds: 'swallows', tissue: true, note: 'কোষপ্রাচীর ও প্লাস্টিড নেই।' },
];

export const KINGDOMS = ['মনেরা', 'প্রোটিস্টা', 'ফানজাই', 'প্লান্টি', 'অ্যানিমেলিয়া'] as const;

/** The key follows the book's order of criteria. */
export function classify(s: Specimen): (typeof KINGDOMS)[number] {
  if (!s.nucleus) return 'মনেরা';
  if (s.feeds === 'absorbs') return 'ফানজাই';
  if (!s.tissue) return 'প্রোটিস্টা';
  return s.feeds === 'makes' ? 'প্লান্টি' : 'অ্যানিমেলিয়া';
}

/** Returns the broken rule of binomial nomenclature, or null when the written name is valid. */
export function checkName(written: string, underlined: boolean, italic: boolean) {
  const parts = written.trim().split(/\s+/);
  if (parts.length !== 2) return 'নামে ঠিক দুটি অংশ থাকবে: গণ ও প্রজাতি।';
  if (!/^[A-Z][a-z]+$/.test(parts[0])) return 'গণের প্রথম অক্ষর বড় হাতের, বাকিগুলো ছোট হাতের হবে।';
  if (!/^[a-z]+(-[a-z]+)?$/.test(parts[1])) return 'প্রজাতি পদের সব অক্ষর ছোট হাতের হবে।';
  if (!italic && !underlined) return 'মুদ্রণে তির্যক, হাতে লিখলে দুই পদের নিচে আলাদা দাগ দিতে হবে।';
  return null;
}

/* ---------- Growth of a tissue (chapter 3) ---------- */
/** Whole doublings needed to reach a count: thirty trillion cells take about 45 (book: 40–50 days). */
export const doublingsFor = (cells: number) => Math.ceil(Math.log2(cells));

export const SIDE = 11;

function neighbours(i: number) {
  const r = Math.floor(i / SIDE);
  const c = i % SIDE;
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < SIDE && b < SIDE).map(([a, b]) => a * SIDE + b);
}

/** A wounded sheet of cells: 0 is empty, 1 is one layer, more is a pile. */
export function wounded(): number[] {
  const middle = (SIDE - 1) / 2;
  return Array.from({ length: SIDE * SIDE }, (_, i) => {
    const r = Math.floor(i / SIDE);
    const c = i % SIDE;
    return Math.hypot(r - middle, c - middle) < 3 ? 0 : 1;
  });
}

/** Healthy cells divide only into empty space. Without that control they pile up: a tumour. */
export function growthStep(cells: number[], controlled: boolean): number[] {
  return cells.map((n, i) => {
    const near = neighbours(i).reduce((a, j) => a + (cells[j] > 0 ? 1 : 0), 0);
    if (n === 0) return near > 0 ? 1 : 0;
    if (controlled) return n;
    const seed = i === Math.floor((SIDE * SIDE) / 2) || neighbours(i).some((j) => cells[j] > 1);
    return seed && near >= 1 ? Math.min(6, n + 1) : n;
  });
}

/** Chromosomes after each generation, with or without halving at gamete formation. */
export function ploidyAcross(start: number, generations: number, meiosis: boolean) {
  const out = [start];
  for (let i = 0; i < generations; i++) {
    const gamete = meiosis ? out[i] / 2 : out[i];
    out.push(gamete * 2);
  }
  return out;
}

/* ---------- Respiration flasks (chapter 4) ---------- */
export interface FlaskState {
  alive: boolean;
  wet: boolean;
  sealed: boolean;
}

/** The temperature rise over hours in the book's thermos experiment. */
export function flaskTemp(s: FlaskState, hours: number) {
  const rate = s.alive && s.wet ? 0.9 : s.alive ? 0.05 : 0;
  return 30 + rate * hours * (s.sealed ? 1 : 0.35);
}

export interface GasDayState {
  light: number;
}

/** Respiration runs day and night; photosynthesis follows the light. */
export function gasBalance(s: GasDayState) {
  const photosynthesis = s.light * 0.1;
  const respiration = 2;
  return { photosynthesis, respiration, net: photosynthesis - respiration };
}

/* ---------- Flowers (chapter 11) ---------- */
export interface FlowerState {
  anthers: boolean;
  stigma: boolean;
  petals: boolean;
  insect: boolean;
  pollinatorNeeded: boolean;
}

export function flowerFate(s: FlowerState) {
  const pollen = s.anthers || s.insect;
  const reached = s.stigma && pollen && (s.pollinatorNeeded ? s.insect && s.petals : true);
  return { pollinated: reached, fruit: reached };
}

export const PLOIDY = { pollenMother: 2, pollen: 1, maleGamete: 1, egg: 1, secondary: 2, zygote: 2, endosperm: 3 };

/* ---------- Heredity (chapter 12) ---------- */
export interface Parent {
  label: string;
  gametes: [string, string];
}

export interface CrossDef {
  id: string;
  label: string;
  a: Parent;
  b: Parent;
  /** Plain reading of one child's genes. */
  read: (g: string) => string;
  note: string;
}

const tall = (g: string) => (g.includes('T') ? 'লম্বা' : 'খাটো');
const thal = (g: string) => (g === 'tt' ? 'রোগী' : g.includes('t') ? 'বাহক' : 'সুস্থ');
const sex = (g: string) => (g.includes('Y') ? 'ছেলে' : 'মেয়ে');
const colour = (g: string) => {
  if (g.includes('Y')) return g.includes("X'") ? 'বর্ণান্ধ ছেলে' : 'সুস্থ ছেলে';
  return g === "X'X'" ? 'বর্ণান্ধ মেয়ে' : g.includes("X'") ? 'বাহক মেয়ে' : 'সুস্থ মেয়ে';
};

export const CROSSES: CrossDef[] = [
  { id: 'p', label: 'TT × tt', a: { label: 'বিশুদ্ধ লম্বা', gametes: ['T', 'T'] }, b: { label: 'বিশুদ্ধ খাটো', gametes: ['t', 't'] }, read: tall, note: 'F₁-এর সব গাছই লম্বা, কারণ T প্রকট।' },
  { id: 'f1', label: 'Tt × Tt', a: { label: 'F₁ লম্বা', gametes: ['T', 't'] }, b: { label: 'F₁ লম্বা', gametes: ['T', 't'] }, read: tall, note: 'F₂-তে ৩ লম্বা : ১ খাটো। খাটো বৈশিষ্ট্য হারিয়ে যায়নি, ঢাকা ছিল।' },
  { id: 'sex', label: 'XX × XY', a: { label: 'মা', gametes: ['X', 'X'] }, b: { label: 'বাবা', gametes: ['X', 'Y'] }, read: sex, note: 'মা সবসময় X দেন। সন্তান ছেলে না মেয়ে, তা ঠিক করে বাবার শুক্রাণু।' },
  { id: 'thal', label: 'বাহক × বাহক', a: { label: 'বাহক মা', gametes: ['T', 't'] }, b: { label: 'বাহক বাবা', gametes: ['T', 't'] }, read: thal, note: 'থ্যালাসেমিয়া অটোজোমাল রিসেসিভ। প্রতি সন্তানে রোগী হওয়ার সম্ভাবনা ২৫%।' },
  { id: 'colour', label: 'বাহক মা × সুস্থ বাবা', a: { label: 'বাহক মা', gametes: ["X'", 'X'] }, b: { label: 'সুস্থ বাবা', gametes: ['X', 'Y'] }, read: colour, note: 'বর্ণান্ধতা X-লিংকড। ছেলের একটিই X, তাই তার ঝুঁকি বেশি।' },
  { id: 'colour2', label: 'সুস্থ মা × বর্ণান্ধ বাবা', a: { label: 'সুস্থ মা', gametes: ['X', 'X'] }, b: { label: 'বর্ণান্ধ বাবা', gametes: ["X'", 'Y'] }, read: colour, note: 'বাবা ছেলেকে Y দেন, তাই ছেলে আক্রান্ত হয় না। সব মেয়ে বাহক।' },
];

const order = (x: string, y: string) => {
  if (y === 'Y') return x + y;
  if (x === 'Y') return y + x;
  if (x === x.toLowerCase() && y !== y.toLowerCase()) return y + x;
  return x + y;
};

export function punnett(c: CrossDef) {
  return c.a.gametes.flatMap((x) => c.b.gametes.map((y) => order(x, y)));
}

export function ratio(c: CrossDef) {
  const out: Record<string, number> = {};
  punnett(c).forEach((g) => {
    const key = c.read(g);
    out[key] = (out[key] ?? 0) + 1;
  });
  return out;
}

/** Evidence bands for the DNA fingerprint lab. Lane positions are percentages down the gel. */
export const EVIDENCE = [12, 27, 41, 58, 73, 88];
export const SUSPECTS: { name: string; bands: number[] }[] = [
  { name: 'সন্দেহভাজন ১', bands: [12, 30, 41, 62, 73, 88] },
  { name: 'সন্দেহভাজন ২', bands: [12, 27, 41, 58, 73, 88] },
  { name: 'সন্দেহভাজন ৩', bands: [18, 27, 50, 58, 80, 92] },
];
export const matches = (bands: number[]) => bands.length === EVIDENCE.length && bands.every((b, i) => b === EVIDENCE[i]);

export function selection(green: number, onGrass: boolean) {
  const g = green * (onGrass ? 0.8 : 0.4);
  const b = (100 - green) * (onGrass ? 0.4 : 0.8);
  return Math.round((g / (g + b)) * 100);
}

/* ---------- Ecosystem (chapter 13) ---------- */
export const WEB_ORDER = ['algae', 'zoo', 'small', 'big', 'hawk'] as const;
export type Species = (typeof WEB_ORDER)[number];

/** The book's pond web, which contains exactly its five food chains. */
export const WEB_EDGES: [Species, Species][] = [
  ['algae', 'zoo'], ['algae', 'small'], ['zoo', 'small'], ['zoo', 'big'], ['small', 'big'], ['small', 'hawk'], ['big', 'hawk'],
];

export function foodChains(): Species[][] {
  const walk = (path: Species[]): Species[][] => {
    const next = WEB_EDGES.filter(([prey]) => prey === path[path.length - 1]).map(([, eater]) => eater);
    return next.length ? next.flatMap((n) => walk([...path, n])) : [path];
  };
  return walk(['algae']);
}

export type Pops = Record<Species, number>;
export const START_POPS: Pops = { algae: 1, zoo: 1, small: 1, big: 1, hawk: 1 };

/** All values sit at 1 in balance. Removing a species shifts its neighbours, then theirs. */
export function webStep(p: Pops, removed: ReadonlySet<Species>): Pops {
  const next = { ...p };
  for (const s of WEB_ORDER) {
    if (removed.has(s)) {
      next[s] = 0;
      continue;
    }
    const prey = WEB_EDGES.filter(([, e]) => e === s).map(([a]) => a);
    const eaters = WEB_EDGES.filter(([a]) => a === s).map(([, e]) => e);
    const gain = prey.length ? prey.reduce((a, x) => a + p[x], 0) / prey.length : 2 - p[s];
    const loss = (1 + eaters.reduce((a, x) => a + p[x], 0)) / (1 + eaters.length);
    // Crowding holds each population near its limit, but nothing recovers once its food is gone.
    const crowding = gain > 0.15 ? 0.6 * (p[s] - 1) : 0;
    const v = p[s] + 0.09 * p[s] * (gain - loss - crowding);
    next[s] = v < 0.03 ? 0 : Math.min(3, v);
  }
  return next;
}

export function settle(removed: ReadonlySet<Species>, ticks = 400) {
  let p = START_POPS;
  for (let i = 0; i < ticks; i++) p = webStep(p, removed);
  return p;
}

/** Book: about 2% of sunlight is captured; about 10% passes up each level. */
export const energyAt = (sunlight: number, level: number, share = 0.1) => sunlight * 0.02 * share ** level;

export function peopleFed(energyPerPerson: number, cropEnergy: number, viaFish: boolean) {
  return Math.floor((viaFish ? cropEnergy * 0.1 : cropEnergy) / energyPerPerson);
}

/* ---------- Biotechnology (chapter 14) ---------- */
export interface RdnaState {
  plasmidCut: 'EcoRI' | 'BamHI';
  donorCut: 'EcoRI' | 'BamHI';
  ligase: boolean;
  transform: boolean;
  antibiotic: boolean;
}

export function rdna(s: RdnaState) {
  if (s.plasmidCut !== s.donorCut) return { stage: 'join' as const, ok: false, text: 'দুটি ভিন্ন এনজাইমে কাটায় প্রান্ত মেলেনি। জিন প্লাজমিডে বসেনি।' };
  if (!s.ligase) return { stage: 'join' as const, ok: false, text: 'প্রান্ত মিলেছে, কিন্তু লাইগেজ না থাকায় জোড়া স্থায়ী হয়নি।' };
  if (!s.transform) return { stage: 'enter' as const, ok: false, text: 'রিকম্বিনেন্ট প্লাজমিড তৈরি, কিন্তু ব্যাকটেরিয়ায় ঢোকানো হয়নি।' };
  if (!s.antibiotic) return { stage: 'pick' as const, ok: false, text: 'প্লেটে সব ব্যাকটেরিয়া জন্মেছে। কোনগুলোতে জিন আছে বোঝার উপায় নেই।' };
  return { stage: 'done' as const, ok: true, text: 'কেবল প্লাজমিডবাহী ব্যাকটেরিয়া বেঁচেছে। এখন ক্লোনিং করে জিনের অসংখ্য কপি মিলবে।' };
}

export interface CultureState {
  sterile: boolean;
  healthyParent: boolean;
  temp: number;
  sugar: boolean;
  rootStage: boolean;
}

/** Book conditions: autoclave at 121°C and 15 lb for 20 minutes, then 25 ± 2°C. */
export function culture(s: CultureState) {
  if (!s.sterile) return { ok: false, fate: 'contaminated' as const, text: 'জীবাণুমুক্ত না করায় মাধ্যমে ছত্রাক ও ব্যাকটেরিয়া জন্মেছে। চিনি ও পুষ্টি তাদেরও খাবার।' };
  if (!s.sugar) return { ok: false, fate: 'starved' as const, text: 'কালচারের টিস্যু শুরুতে নিজের খাদ্য তৈরি করতে পারে না, তাই সুক্রোজ দরকার।' };
  if (s.temp < 23 || s.temp > 27) return { ok: false, fate: 'slow' as const, text: 'তাপমাত্রা ২৫±২°C-এর বাইরে; কোষ বিভাজন ব্যাহত হয়েছে।' };
  if (!s.rootStage) return { ok: false, fate: 'noroot' as const, text: 'অণুচারা তৈরি হয়েছে, কিন্তু মূল নেই। মাটিতে পানি শোষণ করতে পারবে না।' };
  return { ok: true, fate: s.healthyParent ? ('clean' as const) : ('virus' as const), text: s.healthyParent ? 'সুস্থ অণুচারা তৈরি। ধীরে ধীরে মাটিতে অভ্যস্ত করা যাবে।' : 'চারা হয়েছে, তবে সব চারা মাতৃগাছের রোগ পেয়েছে। তাই রোগমুক্ত মাতৃগাছ বাছা জরুরি।' };
}

export const SITE = { EcoRI: 'GAATTC', BamHI: 'GGATCC' } as const;
