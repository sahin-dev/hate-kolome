import { describe, expect, it } from 'vitest';
import * as B from './body';
import * as L from './life';

describe('digestion', () => {
  const base: B.DigestState = { food: 'mixed', bile: true, pancreas: true, acid: true };
  const end = (s: Partial<B.DigestState>) => {
    const d = B.digest({ ...base, ...s });
    return { starch: d.starch[3], protein: d.protein[3], fat: d.fat[3] };
  };

  it('a healthy gut leaves nothing undigested', () => {
    expect(end({})).toEqual({ starch: 0, protein: 0, fat: 0 });
  });
  it('rice is untouched in the stomach', () => {
    const d = B.digest({ ...base, food: 'rice' });
    expect(d.starch[1]).toBe(d.starch[0]);
  });
  it('without bile fat escapes but protein and starch do not', () => {
    const r = end({ food: 'oil', bile: false });
    expect(r.fat).toBeGreaterThan(0.4);
    expect(r.starch).toBe(0);
  });
  it('a blocked pancreas harms all three foods', () => {
    const r = end({ pancreas: false });
    expect(r.starch).toBeGreaterThan(0.1);
    expect(r.protein).toBeGreaterThan(0.1);
    expect(r.fat).toBeGreaterThan(0.1);
  });
  it('without acid pepsin stops but trypsin still finishes protein', () => {
    const d = B.digest({ ...base, food: 'egg', acid: false });
    expect(d.protein[1]).toBe(1);
    expect(d.protein[3]).toBe(0);
  });
});

describe('food tests', () => {
  const by = (n: string) => B.SAMPLES.find((s) => s.name === n)!;
  it('each test finds only its own food', () => {
    expect(B.foodTest(by('ভাতের মাড়'), 'iodine').positive).toBe(true);
    expect(B.foodTest(by('ডিমের সাদা অংশ'), 'iodine').positive).toBe(false);
    expect(B.foodTest(by('ডিমের সাদা অংশ'), 'biuret').positive).toBe(true);
    expect(B.foodTest(by('সয়াবিন তেল'), 'paper').positive).toBe(true);
    expect(B.foodTest(by('চিনির শরবত'), 'paper').positive).toBe(false);
  });
  it('every sample has a different result pattern', () => {
    const sig = B.SAMPLES.map((s) => `${B.foodTest(s, 'iodine').positive}${B.foodTest(s, 'biuret').positive}${B.foodTest(s, 'paper').positive}`);
    expect(new Set(sig).size).toBe(B.SAMPLES.length);
  });
  it('saliva clears starch fastest at body heat', () => {
    const body = B.starchLeft({ temp: 37, boiled: false, saliva: true }, 10);
    const cold = B.starchLeft({ temp: 5, boiled: false, saliva: true }, 10);
    expect(body).toBeLessThan(0.05);
    expect(cold).toBeGreaterThan(0.5);
  });
  it('boiled saliva and no saliva do nothing', () => {
    expect(B.starchLeft({ temp: 37, boiled: true, saliva: true }, 10)).toBe(1);
    expect(B.starchLeft({ temp: 37, boiled: false, saliva: false }, 10)).toBe(1);
  });
});

describe('energy', () => {
  it('reproduces the book worked examples', () => {
    expect(B.bmr('f', 94, 165, 33)).toBeCloseTo(1699.3, 1);
    expect(B.bmi(50, 125)).toBeCloseTo(32, 1);
    expect(B.bmiBand(32).name).toContain('প্রথম');
  });
});

describe('blood', () => {
  const g = (name: string) => B.ALL_GROUPS.find((x) => B.groupName(x) === name)!;
  it('O− gives to everyone and AB+ receives from everyone', () => {
    for (const x of B.ALL_GROUPS) {
      expect(B.canGive(g('O−'), x)).toBe(true);
      expect(B.canGive(x, g('AB+'))).toBe(true);
    }
  });
  it('Rh positive blood is never given to an Rh negative patient', () => {
    expect(B.canGive(g('O+'), g('O−'))).toBe(false);
    expect(B.canGive(g('A−'), g('A+'))).toBe(true);
  });
  it('serum reactions identify every group uniquely', () => {
    const sig = B.ALL_GROUPS.map((x) => `${B.clumps(x, 'A')}${B.clumps(x, 'B')}${B.clumps(x, 'D')}`);
    expect(new Set(sig).size).toBe(8);
  });
});

it('blood pressure bands follow the book', () => {
  expect(B.bpBand(120, 80)).toBe('আদর্শের কাছাকাছি');
  expect(B.bpBand(150, 85)).toBe('উচ্চ রক্তচাপ');
  expect(B.bpBand(130, 95)).toBe('উচ্চ রক্তচাপ');
});

describe('transpiration', () => {
  const base: B.TransState = { light: true, temp: 30, humidity: 50, wind: false, soil: 70, sealed: false };
  it('falls at night, in humid air and on a sealed leaf', () => {
    const r = B.transpiration(base);
    expect(B.transpiration({ ...base, light: false })).toBeLessThan(r * 0.2);
    expect(B.transpiration({ ...base, humidity: 95 })).toBeLessThan(r * 0.3);
    expect(B.transpiration({ ...base, sealed: true })).toBeLessThan(r * 0.2);
  });
  it('rises with wind and heat', () => {
    expect(B.transpiration({ ...base, wind: true })).toBeGreaterThan(B.transpiration(base));
    expect(B.transpiration({ ...base, temp: 34 })).toBeGreaterThan(B.transpiration(base));
  });
  it('dry soil closes the stomata', () => {
    expect(B.transpiration({ ...base, soil: 10 })).toBeLessThan(0.1);
    expect(B.wilts({ ...base, soil: 10 })).toBe(true);
    expect(B.wilts(base)).toBe(false);
  });
});

describe('oxygen', () => {
  const base: B.GasState = { air: 21, wall: 1, hb: 1 };
  it('is full in a healthy person', () => {
    expect(B.oxygenCarried(base).carried).toBe(1);
  });
  it('anaemia cuts the amount carried, not how fully it loads', () => {
    const r = B.oxygenCarried({ ...base, hb: 0.6 });
    expect(r.loading).toBe(1);
    expect(r.carried).toBeCloseTo(0.6);
  });
  it('a thick wall and thin air both reduce loading', () => {
    expect(B.oxygenCarried({ ...base, wall: 2.5 }).loading).toBeLessThan(0.7);
    expect(B.oxygenCarried({ ...base, air: 11 }).loading).toBeLessThan(0.95);
  });
});

describe('kidney', () => {
  const base: B.KidneyState = { drink: 2.1, glucoseHigh: false, filterDamage: false, dialysisDue: false };
  it('healthy urine has urea and salt only, about 1.5 L a day', () => {
    const n = B.nephron(base);
    expect(n.urine).toBeCloseTo(1.54, 1);
    expect(n.inUrine('ইউরিয়া')).toBe(true);
    expect(n.inUrine('গ্লুকোজ')).toBe(false);
    expect(n.inUrine('বড় প্রোটিন')).toBe(false);
    expect(n.filtered('গ্লুকোজ')).toBe(true);
    expect(n.filtered('রক্তকণিকা')).toBe(false);
  });
  it('diabetes spills glucose; damage spills protein', () => {
    expect(B.nephron({ ...base, glucoseHigh: true }).inUrine('গ্লুকোজ')).toBe(true);
    expect(B.nephron({ ...base, filterDamage: true }).inUrine('বড় প্রোটিন')).toBe(true);
  });
  it('less water gives less, darker urine', () => {
    const low = B.nephron({ ...base, drink: 0.8 });
    expect(low.urine).toBeLessThan(0.8);
    expect(low.strength).toBeGreaterThan(1.5);
  });
  it('dialysis removes urea but needs glucose and salt in the fluid', () => {
    const good = B.dialysis({ fluidUrea: false, fluidGlucose: true, fluidSalt: true, hours: 4 });
    expect(good.urea).toBeLessThan(12);
    expect(good.glucose).toBe(100);
    expect(B.dialysis({ fluidUrea: false, fluidGlucose: false, fluidSalt: true, hours: 4 }).glucose).toBeLessThan(12);
    expect(B.dialysis({ fluidUrea: true, fluidGlucose: true, fluidSalt: true, hours: 4 }).urea).toBe(100);
  });
});

describe('bones', () => {
  const good: B.BoneState = { calcium: true, sun: true, exercise: true, female: false };
  const poor: B.BoneState = { calcium: false, sun: false, exercise: false, female: true };
  it('peak near 30 then falls', () => {
    expect(B.boneAt(30, good)).toBeGreaterThan(B.boneAt(15, good));
    expect(B.boneAt(70, good)).toBeLessThan(B.boneAt(30, good));
  });
  it('risk comes much earlier with poor habits, and after menopause', () => {
    expect(B.boneAt(65, good)).toBeGreaterThan(B.FRACTURE_RISK);
    expect(B.boneAt(65, poor)).toBeLessThan(B.FRACTURE_RISK);
    expect(B.boneAt(70, { ...good, female: true })).toBeLessThan(B.boneAt(70, good));
  });
});

describe('reflex', () => {
  it('each lesion gives its own signature', () => {
    expect(B.reflex('none')).toEqual({ moves: true, feels: true });
    expect(B.reflex('sensory')).toEqual({ moves: false, feels: false });
    expect(B.reflex('motor')).toEqual({ moves: false, feels: true });
    expect(B.reflex('upward')).toEqual({ moves: true, feels: false });
  });
  it('a metre takes ten milliseconds at the book speed', () => {
    expect(B.signalMs(1)).toBe(10);
  });
});

describe('blood sugar', () => {
  const base: B.SugarState = { pancreas: 'healthy', meal: true, walk: false, injection: false };
  it('a healthy person returns to normal after a meal', () => {
    const p = B.glucoseDay(base);
    expect(B.peak(p)).toBeGreaterThan(6);
    expect(B.peak(p)).toBeLessThan(10);
    expect(p[p.length - 1][1]).toBeLessThan(6);
  });
  it('type 1 runs far higher, and insulin brings it down', () => {
    const t1 = { ...base, pancreas: 'type1' as const };
    expect(B.peak(B.glucoseDay(t1))).toBeGreaterThan(15);
    expect(B.glucoseDay({ ...t1, injection: true }).at(-1)![1]).toBeLessThan(B.glucoseDay(t1).at(-1)![1]);
  });
  it('type 2 lies between healthy and type 1', () => {
    const t2 = B.peak(B.glucoseDay({ ...base, pancreas: 'type2' }));
    expect(t2).toBeGreaterThan(B.peak(B.glucoseDay(base)));
    expect(t2).toBeLessThan(B.peak(B.glucoseDay({ ...base, pancreas: 'type1' })) + 0.01);
  });
  it('insulin without food drives sugar dangerously low', () => {
    const s = { pancreas: 'type1' as const, meal: false, walk: false, injection: true };
    expect(B.lowest(B.glucoseDay(s))).toBeLessThan(4);
  });
});

it('flowering follows the book ranges', () => {
  expect(B.flowers('short', 10)).toBe(true);
  expect(B.flowers('short', 14)).toBe(false);
  expect(B.flowers('long', 14)).toBe(true);
  expect(B.flowers('long', 10)).toBe(false);
  expect(B.flowers('neutral', 6)).toBe(true);
});

describe('classification', () => {
  it('the key puts each specimen in the expected kingdom', () => {
    const want = ['মনেরা', 'মনেরা', 'প্রোটিস্টা', 'প্রোটিস্টা', 'ফানজাই', 'ফানজাই', 'প্লান্টি', 'অ্যানিমেলিয়া'];
    expect(L.SPECIMENS.map(L.classify)).toEqual(want);
  });
  it('checks written names', () => {
    expect(L.checkName('Homo sapiens', false, true)).toBeNull();
    expect(L.checkName('Oryza sativa', true, false)).toBeNull();
    expect(L.checkName('homo sapiens', false, true)).toBeTruthy();
    expect(L.checkName('Homo Sapiens', false, true)).toBeTruthy();
    expect(L.checkName('Homo sapiens', false, false)).toBeTruthy();
    expect(L.checkName('Homo', false, true)).toBeTruthy();
  });
});

describe('cell growth', () => {
  it('about 45 doublings give thirty trillion cells', () => {
    expect(L.doublingsFor(30e12)).toBe(45);
  });
  it('healthy tissue heals and stops', () => {
    let c = L.wounded();
    for (let i = 0; i < 12; i++) c = L.growthStep(c, true);
    expect(c.every((n) => n === 1)).toBe(true);
  });
  it('without control cells pile up', () => {
    let c = L.wounded();
    for (let i = 0; i < 12; i++) c = L.growthStep(c, false);
    expect(Math.max(...c)).toBeGreaterThan(1);
  });
  it('without meiosis chromosomes double every generation', () => {
    expect(L.ploidyAcross(46, 3, true)).toEqual([46, 46, 46, 46]);
    expect(L.ploidyAcross(4, 3, false)).toEqual([4, 8, 16, 32]);
  });
});

describe('respiration flask', () => {
  it('only live wet seeds warm up', () => {
    expect(L.flaskTemp({ alive: true, wet: true, sealed: true }, 6)).toBeGreaterThan(34);
    expect(L.flaskTemp({ alive: false, wet: true, sealed: true }, 6)).toBe(30);
    expect(L.flaskTemp({ alive: true, wet: false, sealed: true }, 6)).toBeLessThan(31);
  });
  it('a plant gives out CO₂ in the dark and O₂ in bright light', () => {
    expect(L.gasBalance({ light: 0 }).net).toBeLessThan(0);
    expect(L.gasBalance({ light: 80 }).net).toBeGreaterThan(0);
    expect(L.gasBalance({ light: 20 }).net).toBe(0);
  });
});

describe('flower', () => {
  const base: L.FlowerState = { anthers: true, stigma: true, petals: true, insect: true, pollinatorNeeded: true };
  it('needs pollen to reach a stigma', () => {
    expect(L.flowerFate(base).fruit).toBe(true);
    expect(L.flowerFate({ ...base, stigma: false }).fruit).toBe(false);
    expect(L.flowerFate({ ...base, insect: false }).fruit).toBe(false);
    expect(L.flowerFate({ ...base, petals: false }).fruit).toBe(false);
  });
  it('double fertilisation counts add up', () => {
    expect(L.PLOIDY.maleGamete + L.PLOIDY.egg).toBe(L.PLOIDY.zygote);
    expect(L.PLOIDY.maleGamete + L.PLOIDY.secondary).toBe(L.PLOIDY.endosperm);
  });
});

describe('heredity', () => {
  const by = (id: string) => L.CROSSES.find((c) => c.id === id)!;
  it('gives Mendel ratios', () => {
    expect(L.ratio(by('p'))).toEqual({ লম্বা: 4 });
    expect(L.ratio(by('f1'))).toEqual({ লম্বা: 3, খাটো: 1 });
  });
  it('gives a half for sex', () => {
    expect(L.ratio(by('sex'))).toEqual({ মেয়ে: 2, ছেলে: 2 });
  });
  it('gives 1:2:1 for carrier parents', () => {
    expect(L.ratio(by('thal'))).toEqual({ সুস্থ: 1, বাহক: 2, রোগী: 1 });
  });
  it('matches the book colour blindness cross', () => {
    expect(L.ratio(by('colour'))).toEqual({ 'বাহক মেয়ে': 1, 'বর্ণান্ধ ছেলে': 1, 'সুস্থ মেয়ে': 1, 'সুস্থ ছেলে': 1 });
    expect(L.ratio(by('colour2'))).toEqual({ 'বাহক মেয়ে': 2, 'সুস্থ ছেলে': 2 });
  });
  it('exactly one suspect matches', () => {
    expect(L.SUSPECTS.filter((s) => L.matches(s.bands)).map((s) => s.name)).toEqual(['সন্দেহভাজন ২']);
  });
  it('selection favours the camouflaged colour', () => {
    expect(L.selection(50, true)).toBeGreaterThan(50);
    expect(L.selection(50, false)).toBeLessThan(50);
  });
});

describe('pond web', () => {
  it('contains exactly the five chains in the book', () => {
    expect(L.foodChains()).toHaveLength(5);
  });
  it('stays balanced when nothing is removed', () => {
    const p = L.settle(new Set());
    for (const s of L.WEB_ORDER) expect(p[s]).toBeCloseTo(1, 6);
  });
  it('without algae everything dies', () => {
    const p = L.settle(new Set(['algae']));
    for (const s of L.WEB_ORDER) expect(p[s]).toBe(0);
  });
  it('losing the top predator cascades down the chain', () => {
    const p = L.settle(new Set(['hawk']));
    expect(p.big).toBeGreaterThan(1.2);
    expect(p.zoo).toBeLessThan(0.9);
    expect(p.algae).toBeGreaterThan(1);
  });
  it('energy falls tenfold at each level', () => {
    expect(L.energyAt(1000, 0)).toBe(20);
    expect(L.energyAt(1000, 1)).toBeCloseTo(2);
    expect(L.peopleFed(10, 100, false)).toBe(10);
    expect(L.peopleFed(10, 100, true)).toBe(1);
  });
});

describe('biotechnology', () => {
  const good: L.RdnaState = { plasmidCut: 'EcoRI', donorCut: 'EcoRI', ligase: true, transform: true, antibiotic: true };
  it('stops at the right stage', () => {
    expect(L.rdna(good).ok).toBe(true);
    expect(L.rdna({ ...good, donorCut: 'BamHI' }).stage).toBe('join');
    expect(L.rdna({ ...good, ligase: false }).stage).toBe('join');
    expect(L.rdna({ ...good, transform: false }).stage).toBe('enter');
    expect(L.rdna({ ...good, antibiotic: false }).stage).toBe('pick');
  });
  const c: L.CultureState = { sterile: true, healthyParent: true, temp: 25, sugar: true, rootStage: true };
  it('tissue culture fails for the right reason', () => {
    expect(L.culture(c).fate).toBe('clean');
    expect(L.culture({ ...c, sterile: false }).fate).toBe('contaminated');
    expect(L.culture({ ...c, sugar: false }).fate).toBe('starved');
    expect(L.culture({ ...c, temp: 34 }).fate).toBe('slow');
    expect(L.culture({ ...c, rootStage: false }).fate).toBe('noroot');
    expect(L.culture({ ...c, healthyParent: false }).fate).toBe('virus');
  });
});
