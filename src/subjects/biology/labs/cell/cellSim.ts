/**
 * A small cause-and-effect model of one living cell. Levels run from 0 to 1, except water
 * where 1 is the normal volume. It teaches relationships, not measured values.
 *
 * The one number taken directly from the book: aerobic respiration yields 38 ATP per glucose
 * and anaerobic respiration yields 2.
 */
export type CellType = 'animal' | 'plant' | 'root' | 'muscle' | 'gland' | 'wbc' | 'rbc';
export type Solution = 'hypo' | 'iso' | 'hyper';
export type Cause = 'membrane' | 'burst' | 'rupture' | 'energy' | 'waste' | 'protein';

export interface Env {
  oxygen: boolean;
  glucose: boolean;
  light: boolean;
  solution: Solution;
}

export interface Profile {
  name: string;
  note: string;
  wall: boolean;
  bigVacuole: boolean;
  chloro: boolean;
  nucleus: boolean;
  mito: boolean;
  lyso: boolean;
  /** ATP the cell needs, as a share of what full aerobic respiration supplies. */
  demand: number;
  /** How quickly ATP and fuel are spent. */
  burn: number;
  proteinTurnover: number;
  wasteRate: number;
}

export const PROFILES: Record<CellType, Profile> = {
  animal: { name: 'সাধারণ প্রাণিকোষ', note: 'সব প্রধান অঙ্গাণু আছে, কোষপ্রাচীর নেই।', wall: false, bigVacuole: false, chloro: false, nucleus: true, mito: true, lyso: true, demand: 1, burn: 1, proteinTurnover: 0.04, wasteRate: 0.02 },
  plant: { name: 'পাতার মেসোফিল কোষ', note: 'ক্লোরোপ্লাস্টে ভরা; আলোতে নিজের খাদ্য তৈরি করে।', wall: true, bigVacuole: true, chloro: true, nucleus: true, mito: true, lyso: true, demand: 1, burn: 1, proteinTurnover: 0.04, wasteRate: 0.02 },
  root: { name: 'মূলের কোষ', note: 'উদ্ভিদকোষ হলেও ক্লোরোপ্লাস্ট নেই; খাদ্য আসে পাতা থেকে।', wall: true, bigVacuole: true, chloro: false, nucleus: true, mito: true, lyso: true, demand: 1, burn: 1, proteinTurnover: 0.04, wasteRate: 0.02 },
  muscle: { name: 'পেশিকোষ', note: 'নিরন্তর সংকোচনে বিপুল ATP লাগে, তাই মাইটোকন্ড্রিয়া অনেক।', wall: false, bigVacuole: false, chloro: false, nucleus: true, mito: true, lyso: true, demand: 1, burn: 2.2, proteinTurnover: 0.04, wasteRate: 0.03 },
  gland: { name: 'গ্রন্থিকোষ', note: 'প্রোটিন তৈরি ও নিঃসরণই কাজ, তাই অমসৃণ জালিকা ও গলজি বস্তু বেশি।', wall: false, bigVacuole: false, chloro: false, nucleus: true, mito: true, lyso: true, demand: 1, burn: 1, proteinTurnover: 0.05, wasteRate: 0.02 },
  wbc: { name: 'শ্বেত রক্তকণিকা', note: 'জীবাণু গ্রাস করে হজম করে, তাই লাইসোজোম অনেক।', wall: false, bigVacuole: false, chloro: false, nucleus: true, mito: true, lyso: true, demand: 1, burn: 1, proteinTurnover: 0.04, wasteRate: 0.05 },
  rbc: { name: 'লোহিত রক্তকণিকা', note: 'স্তন্যপায়ীর পরিণত কোষে নিউক্লিয়াস ও মাইটোকন্ড্রিয়া নেই; হিমোগ্লোবিনে ভরা।', wall: false, bigVacuole: false, chloro: false, nucleus: false, mito: false, lyso: false, demand: 2 / 38, burn: 0.4, proteinTurnover: 0.006, wasteRate: 0 },
};

export interface CellState {
  t: number;
  atp: number;
  fuel: number;
  protein: number;
  secretion: number;
  waste: number;
  water: number;
  damage: number;
  lowAtpFor: number;
  ruptured: boolean;
  dead: boolean;
  cause: Cause | null;
}

export const NORMAL_ENV: Env = { oxygen: true, glucose: true, light: true, solution: 'iso' };

export function freshCell(): CellState {
  return { t: 0, atp: 1, fuel: 1, protein: 1, secretion: 1, waste: 0.13, water: 1, damage: 0, lowAtpFor: 0, ruptured: false, dead: false, cause: null };
}

const BURST_AT = 1.3;
const RUPTURE_AFTER = 25;

export function isPlasmolysed(p: Profile, s: CellState) {
  return p.wall && s.water < 0.85;
}

export function step(s: CellState, p: Profile, off: ReadonlySet<string>, env: Env, dt = 1): CellState {
  if (s.dead) return s;
  const on = (id: string) => !off.has(id);
  const n = { ...s, t: s.t + dt };

  if (!on('membrane')) return { ...n, dead: true, cause: 'membrane', damage: 1 };

  const makesFood = p.chloro && on('chloro') && env.light;
  const gain = env.glucose || makesFood;
  n.fuel = Math.max(0, Math.min(1, s.fuel + (gain ? 0.05 : -0.012 * p.burn) * dt));

  const aerobic = p.mito && on('mito') && env.oxygen;
  const supply = n.fuel <= 0 ? 0 : aerobic ? 1 : 2 / 38;
  const atpTarget = Math.min(1, supply / p.demand);
  n.atp = s.atp + (atpTarget - s.atp) * Math.min(1, 0.14 * p.burn * dt);

  const canBuild = p.nucleus && on('nucleus') && on('ribosome');
  const buildRate = canBuild ? n.atp * (on('nucleolus') ? 1 : 0.5) : 0;
  n.protein = s.protein + (buildRate - s.protein) * Math.min(1, p.proteinTurnover * dt);

  const route = (on('rer') ? 1 : 0.1) * (on('golgi') ? 1 : 0) * (on('ser') ? 1 : 0.85);
  const secretionTarget = n.protein * route * (n.atp > 0.15 ? 1 : 0.3);
  n.secretion = s.secretion + (secretionTarget - s.secretion) * Math.min(1, 0.25 * dt);

  const cleaning = p.lyso && on('lyso') && !s.ruptured && n.atp > 0.15;
  n.waste = p.wasteRate === 0 ? 0 : Math.min(1, Math.max(0, s.waste + (p.wasteRate - (cleaning ? s.waste * 0.15 : 0)) * dt));

  let waterTarget = env.solution === 'hypo' ? 1.4 : env.solution === 'hyper' ? 0.68 : 1;
  if (p.wall && on('wall') && env.solution === 'hypo') waterTarget = 1.12;
  if (p.bigVacuole && !on('vacuole')) waterTarget = Math.min(waterTarget, 0.82);
  n.water = s.water + (waterTarget - s.water) * Math.min(1, 0.1 * dt);

  if (n.water >= BURST_AT) return { ...n, dead: true, cause: 'burst', damage: 1 };

  n.lowAtpFor = n.atp < 0.12 ? s.lowAtpFor + dt : Math.max(0, s.lowAtpFor - dt);
  if (n.lowAtpFor > RUPTURE_AFTER && p.lyso && on('lyso')) n.ruptured = true;

  let harm = 0;
  if (n.ruptured) harm += 0.05;
  if (n.atp < 0.1) harm += 0.012;
  if (n.waste > 0.7) harm += 0.012;
  if (n.protein < 0.1) harm += 0.01;
  if (n.water < 0.75) harm += 0.004;
  n.damage = Math.min(1, s.damage + harm * dt);

  if (n.damage >= 1) {
    n.dead = true;
    n.cause = n.ruptured ? 'rupture' : n.atp < 0.1 ? 'energy' : n.waste > 0.7 ? 'waste' : 'protein';
  }
  return n;
}

export function run(type: CellType, off: string[], env: Env, ticks: number): CellState {
  const p = PROFILES[type];
  const set = new Set(off);
  let s = freshCell();
  for (let i = 0; i < ticks; i++) s = step(s, p, set, env);
  return s;
}

export const CAUSE_TEXT: Record<Cause, string> = {
  membrane: 'কোষঝিল্লি নষ্ট হওয়ায় ভেতরের সব উপাদান বেরিয়ে গেছে।',
  burst: 'অভিস্রবণে পানি ঢুকে কোষ ফেটে গেছে। প্রাচীর না থাকায় ফোলা থামানোর কিছু ছিল না।',
  rupture: 'শক্তির অভাবে লাইসোজোমের পর্দা ফেটেছে; উৎসেচক কোষের নিজের অঙ্গাণু হজম করে ফেলেছে।',
  energy: 'ATP ফুরিয়ে গেছে। শক্তি ছাড়া কোষের কোনো কাজ চলেনি।',
  waste: 'বর্জ্য জমতে জমতে কোষের স্বাভাবিক কাজ থেমে গেছে।',
  protein: 'নতুন প্রোটিন ও উৎসেচক না আসায় পুরোনোগুলো নষ্ট হয়ে কোষ মারা গেছে।',
};
