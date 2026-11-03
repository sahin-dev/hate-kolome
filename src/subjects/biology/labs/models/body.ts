/**
 * Cause-and-effect models for chapters 5 to 10. They teach relationships. Where a number
 * comes from the textbook the comment says so; the rest are round teaching values.
 */
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/* ---------- Digestion (chapter 5) ---------- */
export type Food = 'rice' | 'egg' | 'oil' | 'mixed';

export interface DigestState {
  food: Food;
  bile: boolean;
  pancreas: boolean;
  acid: boolean;
}

export const FOODS: Record<Food, { name: string; starch: number; protein: number; fat: number }> = {
  rice: { name: 'ভাত', starch: 1, protein: 0.1, fat: 0 },
  egg: { name: 'ডিম', starch: 0, protein: 1, fat: 0.6 },
  oil: { name: 'তেলে ভাজা', starch: 0.2, protein: 0, fat: 1 },
  mixed: { name: 'ভাত-ডাল-মাছ', starch: 0.8, protein: 0.7, fat: 0.4 },
};

export const GUT = ['মুখ', 'পাকস্থলী', 'ডিওডেনাম', 'ইলিয়াম'] as const;

/** Unbroken share of each food after each stage, in the order of GUT. */
export function digest(s: DigestState) {
  const food = FOODS[s.food];
  // Pepsin is released as an inactive form that only HCl can switch on.
  const pepsin = s.acid ? 0.6 : 1;
  const trypsin = s.pancreas ? 0.3 : 1;
  // Bile breaks fat into droplets, so without it lipase reaches little of the surface.
  const lipase = s.pancreas ? (s.bile ? 0.15 : 0.7) : s.bile ? 0.85 : 1;
  const amylase = s.pancreas ? 0.1 : 1;

  const starch = [0.75, 0.75, 0.75 * amylase, 0.75 * amylase * (s.pancreas ? 0 : 0.55)];
  const protein = [1, pepsin, pepsin * trypsin, pepsin * trypsin * (s.pancreas ? 0 : 0.55)];
  const fat = [1, 1, lipase, lipase * (s.pancreas && s.bile ? 0 : 0.8)];

  const left = (values: number[], share: number) => values.map((v) => v * share);
  return { starch: left(starch, food.starch), protein: left(protein, food.protein), fat: left(fat, food.fat) };
}

/* ---------- Food energy (chapter 5). Values per 100 g are the book's table. ---------- */
export const FOOD_TABLE: [string, number][] = [
  ['চাল', 346], ['আটা', 341], ['ছোলা', 360], ['মসুর', 343], ['গোল আলু', 97], ['গাজর', 48], ['বেগুন', 24], ['বাঁধাকপি', 27],
  ['ইলিশ', 273], ['কাতলা', 111], ['মুরগির মাংস', 109], ['গরুর মাংস', 114], ['ডিম', 173], ['গরুর দুধ', 67], ['রান্নার তেল', 900],
];

/** Book formula, in kilocalories. */
export function bmr(sex: 'f' | 'm', weight: number, height: number, age: number) {
  return sex === 'f' ? 655 + 9.6 * weight + 1.8 * height - 4.7 * age : 66 + 13.7 * weight + 5 * height - 6.8 * age;
}

export const bmi = (weight: number, cm: number) => weight / (cm / 100) ** 2;

/** Bands and advice follow the book's table. */
export function bmiBand(value: number) {
  if (value < 18.5) return { name: 'ওজন কম', advice: 'পরিমিত খাদ্য গ্রহণ করে ওজন বাড়ানো প্রয়োজন।' };
  if (value < 25) return { name: 'আদর্শ সীমা', advice: 'স্বাস্থ্যের জন্য আদর্শ মান।' };
  if (value < 30) return { name: 'অতিরিক্ত ওজন', advice: 'ব্যায়াম করে অতিরিক্ত ওজন কমানো প্রয়োজন।' };
  if (value < 35) return { name: 'স্থূলতা, প্রথম ধাপ', advice: 'খাদ্যগ্রহণ ও ব্যায়াম নিয়ন্ত্রণ করা দরকার।' };
  if (value < 40) return { name: 'স্থূলতা, দ্বিতীয় ধাপ', advice: 'পরিমিত খাদ্য ও ব্যায়াম অত্যন্ত জরুরি।' };
  return { name: 'গুরুতর স্থূলতা', advice: 'ডাক্তারের পরামর্শ নিন।' };
}

/* ---------- Food tests (chapter 5) ---------- */
export interface Sample {
  name: string;
  starch: boolean;
  protein: boolean;
  fat: boolean;
}

export const SAMPLES: Sample[] = [
  { name: 'ভাতের মাড়', starch: true, protein: false, fat: false },
  { name: 'ডিমের সাদা অংশ', starch: false, protein: true, fat: false },
  { name: 'সয়াবিন তেল', starch: false, protein: false, fat: true },
  { name: 'দুধ', starch: false, protein: true, fat: true },
  { name: 'ডাল বাটা', starch: true, protein: true, fat: false },
  { name: 'চিনির শরবত', starch: false, protein: false, fat: false },
];

export type FoodTest = 'iodine' | 'biuret' | 'paper';

/** Colour of the result, as RGB, plus whether the test is positive. */
export function foodTest(s: Sample, test: FoodTest) {
  if (test === 'iodine') return { positive: s.starch, color: s.starch ? '#1d1a3e' : '#c8862c' };
  if (test === 'biuret') return { positive: s.protein, color: s.protein ? '#7a3fae' : '#7fb2e0' };
  return { positive: s.fat, color: s.fat ? 'spot' : 'dry' };
}

export interface SalivaTube {
  temp: number;
  boiled: boolean;
  saliva: boolean;
}

/** Share of starch left after some minutes. The enzyme works best near body temperature. */
export function starchLeft(t: SalivaTube, minutes: number) {
  if (!t.saliva || t.boiled) return 1;
  const fit = Math.exp(-(((t.temp - 37) / 16) ** 2));
  return Math.exp(-0.34 * fit * minutes);
}

/* ---------- Blood groups (chapter 6) ---------- */
export type Abo = 'A' | 'B' | 'AB' | 'O';
export interface BloodGroup {
  abo: Abo;
  rh: boolean;
}

export const ALL_GROUPS: BloodGroup[] = (['O', 'A', 'B', 'AB'] as Abo[]).flatMap((abo) => [{ abo, rh: false }, { abo, rh: true }]);
export const groupName = (g: BloodGroup) => `${g.abo}${g.rh ? '+' : '−'}`;

const antigens = (abo: Abo) => (abo === 'AB' ? ['A', 'B'] : abo === 'O' ? [] : [abo]);

/** A drop of anti-A, anti-B or anti-D clumps red cells that carry the matching antigen. */
export const clumps = (g: BloodGroup, serum: 'A' | 'B' | 'D') => (serum === 'D' ? g.rh : antigens(g.abo).includes(serum));

export function canGive(donor: BloodGroup, recipient: BloodGroup) {
  const aboOk = antigens(donor.abo).every((a) => antigens(recipient.abo).includes(a));
  return aboOk && (!donor.rh || recipient.rh);
}

/* ---------- Heart (chapter 6) ---------- */
export const HEART_PHASES = [
  { name: 'অলিন্দের সিস্টোল', atria: 'সংকুচিত', ventricles: 'প্রসারিত', av: true, semi: false, text: 'অলিন্দ সংকুচিত হয়। ট্রাইকাসপিড ও বাইকাসপিড কপাটিকা খোলা, রক্ত নিলয়ে নামে।' },
  { name: 'নিলয়ের সিস্টোল', atria: 'প্রসারিত', ventricles: 'সংকুচিত', av: false, semi: true, text: 'নিলয় সংকুচিত হয়। চাপে দ্বিপত্রী-ত্রিপত্রী কপাটিকা বন্ধ হয়, অর্ধচন্দ্রাকৃতি কপাটিকা খুলে রক্ত ধমনিতে যায়। চাপ এখন সর্বোচ্চ।' },
  { name: 'ডায়াস্টোল', atria: 'প্রসারিত', ventricles: 'প্রসারিত', av: true, semi: false, text: 'দুই প্রকোষ্ঠই শিথিল। অর্ধচন্দ্রাকৃতি কপাটিকা বন্ধ হয়, শিরা থেকে রক্ত অলিন্দে আসে। চাপ এখন সর্বনিম্ন।' },
];

/** Book thresholds: ideal about 120/80, high above 140/90. */
export function bpBand(sys: number, dia: number) {
  if (sys > 140 || dia > 90) return 'উচ্চ রক্তচাপ';
  if (sys <= 120 && dia <= 80) return 'আদর্শের কাছাকাছি';
  return 'স্বাভাবিকের চেয়ে কিছুটা বেশি';
}

export const BP_PATIENTS = [
  { name: 'রোগী ১', age: 24, sys: 118, dia: 76 },
  { name: 'রোগী ২', age: 56, sys: 156, dia: 98 },
  { name: 'রোগী ৩', age: 41, sys: 134, dia: 86 },
];

/* ---------- Transpiration (chapter 6) ---------- */
export interface TransState {
  light: boolean;
  temp: number;
  humidity: number;
  wind: boolean;
  soil: number;
  sealed: boolean;
}

/** Stomata open in light with enough water. Returns a relative rate from 0 to 1. */
export function transpiration(s: TransState) {
  const stoma = s.light && s.soil >= 20 && !s.sealed ? 1 : 0.06;
  const drying = clamp((100 - s.humidity) / 70) * clamp((s.temp - 5) / 30, 0, 1.2);
  return clamp(stoma * drying * (s.wind ? 1.3 : 1));
}

/** The plant wilts once it loses water faster than the roots can replace it. */
export const wilts = (s: TransState) => transpiration(s) > s.soil / 100 + 0.1 || s.soil < 12;

/* ---------- Oxygen delivery (chapter 7) ---------- */
export interface GasState {
  air: number;
  wall: number;
  hb: number;
}

/** Oxygen carried is haemoglobin × how fully it loads. Loading falls with thin air or a thick wall. */
export function oxygenCarried(s: GasState) {
  const pull = clamp(s.air / 21);
  const loading = clamp(1.25 * pull ** 0.6 - (s.wall - 1) * 0.4);
  return { loading, carried: loading * s.hb };
}

/* ---------- Kidney (chapter 8) ---------- */
export interface KidneyState {
  drink: number;
  glucoseHigh: boolean;
  filterDamage: boolean;
  dialysisDue: boolean;
}

export const SOLUTES = ['রক্তকণিকা', 'বড় প্রোটিন', 'গ্লুকোজ', 'অ্যামিনো এসিড', 'লবণ', 'ইউরিয়া'] as const;
export type Solute = (typeof SOLUTES)[number];

/** Whether each substance is filtered, and whether any reaches the urine. */
export function nephron(s: KidneyState) {
  const filtered = (x: Solute) => (x === 'রক্তকণিকা' || x === 'বড় প্রোটিন' ? s.filterDamage : true);
  const inUrine = (x: Solute): boolean => {
    if (x === 'রক্তকণিকা' || x === 'বড় প্রোটিন') return s.filterDamage;
    if (x === 'গ্লুকোজ') return s.glucoseHigh; // Reabsorption pumps saturate above a limit.
    if (x === 'অ্যামিনো এসিড') return false;
    return true;
  };
  // About 1.5 L a day with a normal intake (book); it follows what is drunk.
  const urine = clamp(0.5 + (s.drink - 0.5) * 0.65, 0.4, 3);
  return { filtered, inUrine, urine, strength: clamp(1.5 / urine, 0.3, 2) };
}

export interface DialysisState {
  fluidUrea: boolean;
  fluidGlucose: boolean;
  fluidSalt: boolean;
  hours: number;
}

/** Each substance drifts towards the concentration in the fluid; blood starts high in urea. */
export function dialysis(s: DialysisState) {
  const k = 1 - Math.exp(-s.hours / 1.6);
  const towards = (start: number, target: number) => start + (target - start) * k;
  return { urea: towards(100, s.fluidUrea ? 100 : 0), glucose: towards(100, s.fluidGlucose ? 100 : 0), salt: towards(100, s.fluidSalt ? 100 : 0) };
}

/* ---------- Bones (chapter 9) ---------- */
export interface BoneState {
  calcium: boolean;
  sun: boolean;
  exercise: boolean;
  female: boolean;
}

/** Bone strength by age: it builds to a peak near 30, then falls, faster after menopause. */
export function boneAt(age: number, s: BoneState) {
  const built = (s.calcium ? 0.45 : 0.3) + (s.sun ? 0.3 : 0.15) + (s.exercise ? 0.25 : 0.15);
  const peak = 100 * built;
  if (age <= 30) return peak * clamp(0.35 + (0.65 * age) / 30);
  const yearly = (s.exercise ? 0.4 : 0.8) * (s.calcium ? 1 : 1.3);
  const after = (age - 30) * yearly + (s.female && age > 48 ? (age - 48) * 1 : 0);
  return Math.max(0, peak - after);
}

export const FRACTURE_RISK = 45;

export type Joint = 'hinge' | 'ball' | 'slight' | 'fixed';
export const JOINTS: Record<Joint, { name: string; where: string; bend: boolean; rotate: boolean; note: string }> = {
  hinge: { name: 'কব্জা সন্ধি', where: 'কনুই ও হাঁটু', bend: true, rotate: false, note: 'দরজার কব্জার মতো, শুধু এক দিকে নড়ে।' },
  ball: { name: 'বল ও কোটর সন্ধি', where: 'কাঁধ ও শ্রোণিচক্র', bend: true, rotate: true, note: 'গোল মাথা কোটরে ঘোরে, তাই সব দিকে নড়ে।' },
  slight: { name: 'ঈষৎ সচল সন্ধি', where: 'মেরুদণ্ড', bend: true, rotate: false, note: 'প্রতিটি জোড়ায় সামান্য নড়াচড়া, মিলিয়ে দেহ বাঁকে।' },
  fixed: { name: 'নিশ্চল সন্ধি', where: 'করোটি', bend: false, rotate: false, note: 'অনড়, মস্তিষ্ককে সুরক্ষা দেয়।' },
};

/* ---------- Nerves and hormones (chapter 10) ---------- */
export type Lesion = 'none' | 'sensory' | 'relay' | 'motor' | 'upward';
export const REFLEX_ARC: { id: Lesion; name: string }[] = [
  { id: 'sensory', name: 'সংবেদী নিউরন' },
  { id: 'relay', name: 'সংযোগকারী নিউরন' },
  { id: 'motor', name: 'আজ্ঞাবাহী নিউরন' },
  { id: 'upward', name: 'মস্তিষ্কগামী পথ' },
];

export function reflex(lesion: Lesion) {
  return {
    moves: lesion === 'none' || lesion === 'upward',
    feels: lesion === 'none' || lesion === 'relay' || lesion === 'motor',
  };
}

/** Milliseconds for a signal over a path, at the book's 100 m per second. */
export const signalMs = (metres: number) => (metres / 100) * 1000;

export type Pancreas = 'healthy' | 'type1' | 'type2';
export interface SugarState {
  pancreas: Pancreas;
  meal: boolean;
  walk: boolean;
  injection: boolean;
}

/** Blood glucose over twelve hours, in steps of a quarter hour. Normal fasting is near 5 mmol/L. */
export function glucoseDay(s: SugarState) {
  const points: [number, number][] = [];
  let g = s.pancreas === 'healthy' ? 5 : 8;
  let gut = s.meal ? 16 : 0;
  let shot = s.injection ? 1 : 0;

  for (let i = 0; i <= 48; i++) {
    const hour = i / 4;
    points.push([hour, g]);
    const absorbed = gut * 0.12;
    gut -= absorbed;
    const own = s.pancreas === 'type1' ? 0 : s.pancreas === 'type2' ? 0.05 : 0.45;
    const action = own + shot * 0.4;
    shot *= 0.9;
    // Glucagon releases stored glucose from the liver when the level drops too low.
    const glucagon = g < 4 && !s.injection ? (4 - g) * 0.5 : 0;
    g = Math.max(1.5, g + absorbed - action * Math.max(0, g - 5) - (s.injection ? shot * 0.5 : 0) - (s.walk ? 0.06 : 0) + glucagon);
  }
  return points;
}

export const peak = (p: [number, number][]) => Math.max(...p.map((x) => x[1]));
export const lowest = (p: [number, number][]) => Math.min(...p.map((x) => x[1]));

export type DayPlant = 'short' | 'long' | 'neutral';
export const DAY_PLANTS: Record<DayPlant, { name: string; plant: string; range: string }> = {
  short: { name: 'ছোট দিনের উদ্ভিদ', plant: 'চন্দ্রমল্লিকা', range: '৮–১২ ঘণ্টা আলো' },
  long: { name: 'বড় দিনের উদ্ভিদ', plant: 'লেটুস', range: '১২–১৬ ঘণ্টা আলো' },
  neutral: { name: 'দিন-নিরপেক্ষ উদ্ভিদ', plant: 'সূর্যমুখী', range: 'আলোর দৈর্ঘ্যে নির্ভর করে না' },
};

/** Ranges from the book. */
export function flowers(plant: DayPlant, hours: number) {
  if (plant === 'short') return hours >= 8 && hours <= 12;
  if (plant === 'long') return hours > 12 && hours <= 16;
  return true;
}
