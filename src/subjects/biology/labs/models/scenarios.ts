import type { Scenario } from '../../../../components/labkit';
import * as B from './body';
import * as L from './life';

/** Starting states, shared with the labs. A scenario changes only what it names. */
export const INIT = {
  digest: { food: 'mixed', bile: true, pancreas: true, acid: true } as B.DigestState,
  trans: { light: true, temp: 30, humidity: 50, wind: false, soil: 70, sealed: false } as B.TransState,
  gas: { air: 21, wall: 1, hb: 1 } as B.GasState,
  kidney: { drink: 2.1, glucoseHigh: false, filterDamage: false, dialysisDue: false } as B.KidneyState,
  dialysis: { fluidUrea: false, fluidGlucose: true, fluidSalt: true, hours: 4 } as B.DialysisState,
  bone: { calcium: true, sun: true, exercise: true, female: false } as B.BoneState,
  sugar: { pancreas: 'healthy', meal: true, walk: false, injection: false } as B.SugarState,
  flask: { alive: true, wet: true, sealed: true } as L.FlaskState,
  gasDay: { light: 60 } as L.GasDayState,
  fate: { anthers: true, stigma: true, petals: true, insect: true, pollinatorNeeded: true } as L.FlowerState,
  rdna: { plasmidCut: 'EcoRI', donorCut: 'EcoRI', ligase: true, transform: true, antibiotic: true } as L.RdnaState,
  culture: { sterile: true, healthyParent: true, temp: 25, sugar: true, rootStage: true } as L.CultureState,
};

const end = (s: B.DigestState) => {
  const d = B.digest(s);
  return { starch: d.starch[3], protein: d.protein[3], fat: d.fat[3] };
};

export const SCENARIOS = {
  digest: [
    { id: 'stone', title: 'পিত্তনালি বন্ধ', set: { food: 'oil', bile: false }, ask: 'পিত্তথলির পাথরে পিত্তনালি বন্ধ হলে তেলে ভাজা খাবারের কী হবে?', options: ['সব খাবারের পরিপাক থামবে', 'মূলত স্নেহ পরিপাক ব্যাহত হবে', 'কোনো প্রভাব নেই'], answer: 1, why: 'পিত্তরসে উৎসেচক নেই, তবে এটি স্নেহকে ক্ষুদ্র ফোঁটায় ভাঙে। ফোঁটা না হলে লাইপেজ অল্প তলে কাজ পায়।', think: 'পিত্তরস উৎসেচক না হয়েও পরিপাকে দরকারি কেন?', proves: (s) => end(s).fat > 0.4 },
    { id: 'pancreas', title: 'অগ্ন্যাশয় রস বন্ধ', set: { pancreas: false }, ask: 'অগ্ন্যাশয় রস না এলে কোন খাদ্যের ক্ষতি হবে?', options: ['শুধু আমিষ', 'শুধু স্নেহ', 'শর্করা, আমিষ ও স্নেহ তিনটিই'], answer: 2, why: 'অগ্ন্যাশয় রসে অ্যামাইলেজ, ট্রিপসিন ও লাইপেজ তিনটিই থাকে।', proves: (s) => { const e = end(s); return e.starch > 0.1 && e.protein > 0.1 && e.fat > 0.1; } },
    { id: 'acid', title: 'পাকস্থলীর HCl নেই', set: { food: 'egg', acid: false }, ask: 'HCl না থাকলে ডিমের আমিষের কী হবে?', options: ['কখনো পরিপাক হবে না', 'পাকস্থলীতে থামবে, ক্ষুদ্রান্ত্রে পরিপাক হবে', 'আরও দ্রুত পরিপাক হবে'], answer: 1, why: 'HCl ছাড়া পেপসিন সক্রিয় হয় না। তবে ট্রিপসিন পরে কাজ শেষ করে।', proves: (s) => { const d = B.digest(s); return d.protein[1] === B.FOODS.egg.protein && d.protein[3] === 0; } },
    { id: 'rice', title: 'ভাত পাকস্থলীতে', set: { food: 'rice' }, ask: 'ভাতের শ্বেতসার পাকস্থলীতে কতটা ভাঙে?', options: ['প্রায় সবটাই', 'অর্ধেক', 'পাকস্থলীতে আর ভাঙে না'], answer: 2, why: 'গ্যাস্ট্রিক রসে শর্করা ও স্নেহ ভাঙার নির্দিষ্ট উৎসেচক নেই। ভাত বেশিক্ষণ চিবালে মুখেই বেশি ভাঙে।', proves: (s) => { const d = B.digest(s); return d.starch[1] === d.starch[0]; } },
  ] as Scenario<B.DigestState>[],

  trans: [
    { id: 'humid', title: 'বর্ষার ভেজা বাতাস', set: { humidity: 95 }, ask: 'বাতাসে আর্দ্রতা ৯৫% হলে প্রস্বেদনের কী হবে?', options: ['অনেক কমবে', 'অনেক বাড়বে', 'একই থাকবে'], answer: 0, why: 'পাতার ভেতর ও বাইরের জলীয়বাষ্পের পার্থক্য কমে, তাই বাষ্প বের হওয়া ধীর হয়।', proves: (s) => B.transpiration(s) < 0.15 },
    { id: 'night', title: 'রাত', set: { light: false }, ask: 'রাতে প্রস্বেদনের হার কেমন হবে?', options: ['দিনের চেয়ে বেশি', 'প্রায় বন্ধ', 'দিনের সমান'], answer: 1, why: 'আলো না থাকায় পত্ররন্ধ্র বন্ধ থাকে।', proves: (s) => B.transpiration(s) < 0.1 },
    { id: 'drought', title: 'খরায় শুকনো মাটি', set: { soil: 10 }, ask: 'মাটিতে পানি খুব কমে গেলে গাছ কী করবে?', options: ['পত্ররন্ধ্র খুলে রাখবে', 'পত্ররন্ধ্র বন্ধ করবে, তবু নেতিয়ে পড়বে', 'স্বাভাবিক থাকবে'], answer: 1, why: 'রক্ষীকোষ স্ফীতি হারিয়ে রন্ধ্র বন্ধ করে পানি বাঁচায়। তবে শোষণ কম বলে গাছ নেতিয়ে পড়ে, আর CO₂ না ঢোকায় খাদ্য তৈরিও কমে।', proves: (s) => B.transpiration(s) < 0.1 && B.wilts(s) },
    { id: 'wind', title: 'দমকা হাওয়া', set: { wind: true }, ask: 'বাতাস বইলে প্রস্বেদন কেমন হবে?', options: ['কমবে', 'বাড়বে', 'বন্ধ হবে'], answer: 1, why: 'বাতাস পাতার পাশের আর্দ্র বাতাস সরিয়ে দেয়, ফলে নতুন বাষ্প দ্রুত বের হয়।', proves: (s) => B.transpiration(s) > B.transpiration(INIT.trans) },
  ] as Scenario<B.TransState>[],

  gas: [
    { id: 'anaemia', title: 'রক্তশূন্যতা', set: { hb: 0.6 }, ask: 'হিমোগ্লোবিন কমলে কী হবে?', options: ['ফুসফুসে বাতাস ঢুকবে না', 'প্রতিটি অণু ভরবে, কিন্তু মোট O₂ বহন কমবে', 'কোনো প্রভাব নেই'], answer: 1, why: 'শ্বাস স্বাভাবিক, তবু বহনকারী কম। তাই রক্তশূন্যতার রোগী অল্প পরিশ্রমেই হাঁপিয়ে ওঠে।', proves: (s) => { const r = B.oxygenCarried(s); return r.loading === 1 && r.carried < 0.7; } },
    { id: 'pneumonia', title: 'নিউমোনিয়া', set: { wall: 2.5 }, ask: 'বায়ুথলিতে তরল জমলে কী হবে?', options: ['ব্যাপন বাধাগ্রস্ত হবে', 'ব্যাপন দ্রুত হবে', 'হিমোগ্লোবিন বাড়বে'], answer: 0, why: 'ব্যাপন পথ দীর্ঘ হয়, তাই রক্তে O₂ কম ঢোকে।', proves: (s) => B.oxygenCarried(s).loading < 0.7 },
    { id: 'hill', title: 'উঁচু পাহাড়ে', set: { air: 13 }, ask: 'উঁচু পাহাড়ে বাতাস পাতলা হলে কী হবে?', options: ['O₂ ভরা কমবে', 'O₂ ভরা বাড়বে', 'কিছুই হবে না'], answer: 0, why: 'বায়ুথলি ও রক্তের O₂-এর পার্থক্য কমে যায়, ব্যাপনের চাপও কমে।', proves: (s) => B.oxygenCarried(s).loading < 1 },
  ] as Scenario<B.GasState>[],

  kidney: [
    { id: 'diabetes', title: 'রক্তে গ্লুকোজ অনেক বেশি', set: { glucoseHigh: true }, ask: 'রক্তে গ্লুকোজ অতিরিক্ত হলে মূত্রে কী দেখা যাবে?', options: ['গ্লুকোজ', 'রক্তকণিকা', 'কিছুই না'], answer: 0, why: 'নালিকার পুনঃশোষণের একটি সীমা আছে। সীমা ছাড়ালে গ্লুকোজ মূত্রে আসে। ডায়াবেটিসের নাম এখান থেকেই।', proves: (s) => B.nephron(s).inUrine('গ্লুকোজ') },
    { id: 'damage', title: 'গ্লোমেরুলাস ক্ষতিগ্রস্ত', set: { filterDamage: true }, ask: 'ছাঁকনি নষ্ট হলে মূত্রে নতুন কী আসবে?', options: ['শুধু বেশি পানি', 'প্রোটিন ও রক্তকণিকা', 'গ্লুকোজ'], answer: 1, why: 'সুস্থ গ্লোমেরুলাস বড় অণু আটকায়। ছাঁকনি ফুটো হলে এগুলোও বেরিয়ে আসে।', proves: (s) => B.nephron(s).inUrine('বড় প্রোটিন') && B.nephron(s).inUrine('রক্তকণিকা') },
    { id: 'dry', title: 'গরমে কম পানি', set: { drink: 0.8 }, ask: 'পানি কম খেলে মূত্রের কী হবে?', options: ['পাতলা ও বেশি', 'গাঢ় ও কম', 'একই থাকবে'], answer: 1, why: 'বৃক্ক বেশি পানি পুনঃশোষণ করে দেহের পানি বাঁচায়। এটিই অসমোরেগুলেশন।', proves: (s) => B.nephron(s).strength > 1.5 },
  ] as Scenario<B.KidneyState>[],

  dialysis: [
    { id: 'sugarless', title: 'তরলে গ্লুকোজ নেই', set: { fluidGlucose: false }, ask: 'ডায়ালাইসিস তরলে গ্লুকোজ না রাখলে কী হবে?', options: ['রক্তের গ্লুকোজও বেরিয়ে যাবে', 'গ্লুকোজ বাড়বে', 'কিছুই হবে না'], answer: 0, why: 'ব্যাপনে পদার্থ বেশি ঘনত্ব থেকে কম ঘনত্বে যায়। তরলে সমান গ্লুকোজ রাখলে তা রক্তে থেকে যায়।', proves: (s) => B.dialysis(s).glucose < 15 },
    { id: 'urea', title: 'তরলে ইউরিয়া আছে', set: { fluidUrea: true }, ask: 'তরলে রক্তের সমান ইউরিয়া থাকলে কী হবে?', options: ['ইউরিয়া বেরিয়ে যাবে', 'ইউরিয়া বের হবে না', 'রক্ত জমাট বাঁধবে'], answer: 1, why: 'ঘনত্বের পার্থক্য না থাকলে ব্যাপন হয় না। তাই তরল বারবার পাল্টাতে হয়।', proves: (s) => B.dialysis(s).urea === 100 },
  ] as Scenario<B.DialysisState>[],

  bone: [
    { id: 'indoors', title: 'রোদ ছাড়া ঘরে জীবন', set: { sun: false, exercise: false }, ask: 'ক্যালসিয়াম খেলেও রোদ ও ব্যায়াম না থাকলে হাড়ের কী হবে?', options: ['কোনো ক্ষতি নেই', 'সর্বোচ্চ ঘনত্ব কম হবে', 'হাড় লম্বা হবে'], answer: 1, why: 'রোদে ত্বকে ভিটামিন D হয়, যা ক্যালসিয়াম শোষণে লাগে। ব্যায়ামও হাড়কে শক্ত করে।', proves: (s) => B.boneAt(30, s) < B.boneAt(30, INIT.bone) },
    { id: 'after50', title: 'মেনোপজের পর', set: { female: true }, ask: 'একই জীবনযাপনে ৭০ বছর বয়সে নারী ও পুরুষের মধ্যে কার হাড় বেশি ক্ষয়প্রবণ?', options: ['পুরুষের', 'নারীর', 'সমান'], answer: 1, why: 'মেনোপজের পর হাড়ের ঘনত্ব দ্রুত কমে। তাই নারীদের অস্টিওপোরোসিস বেশি।', proves: (s) => B.boneAt(70, s) < B.boneAt(70, INIT.bone) },
  ] as Scenario<B.BoneState>[],

  sugar: [
    { id: 't1', title: 'টাইপ-১: ইনসুলিন নেই', set: { pancreas: 'type1' }, ask: 'ইনসুলিন একেবারে তৈরি না হলে খাবারের পর কী হবে?', options: ['গ্লুকোজ অনেক বেড়ে থাকবে', 'গ্লুকোজ শূন্য হবে', 'স্বাভাবিক থাকবে'], answer: 0, why: 'ইনসুলিন ছাড়া রক্তের গ্লুকোজ কোষে যেতে পারে না। কোষ না খেয়ে থাকে, অথচ রক্তে গ্লুকোজ জমে।', proves: (s) => B.peak(B.glucoseDay(s)) > 15 },
    { id: 't1i', title: 'টাইপ-১: ইনজেকশন', set: { pancreas: 'type1', injection: true }, ask: 'টাইপ-১ রোগী ইনসুলিন নিলে কী হবে?', options: ['গ্লুকোজ কমবে', 'আরও বাড়বে', 'কোনো পরিবর্তন নেই'], answer: 0, why: 'বাইরের ইনসুলিন অনুপস্থিত হরমোনের কাজ করে।', proves: (s) => B.glucoseDay(s).at(-1)![1] < B.glucoseDay({ ...s, injection: false }).at(-1)![1] },
    { id: 'hypo', title: 'ইনজেকশন, কিন্তু খাবার নেই', set: { pancreas: 'type1', injection: true, meal: false }, ask: 'ইনসুলিন নিয়ে না খেলে কী বিপদ?', options: ['গ্লুকোজ বিপজ্জনকভাবে কমবে', 'গ্লুকোজ অনেক বাড়বে', 'কোনো বিপদ নেই'], answer: 0, why: 'হাইপোগ্লাইসেমিয়ায় রোগী ঘামে, কাঁপে, অজ্ঞান হতে পারে। সচেতন থাকলে চিনির পানি খাওয়ালে ঠিক হয়।', proves: (s) => B.lowest(B.glucoseDay(s)) < 4 },
    { id: 'walk', title: 'টাইপ-২ ও হাঁটা', set: { pancreas: 'type2', walk: true }, ask: 'টাইপ-২ রোগী নিয়মিত হাঁটলে রক্তের গ্লুকোজের কী হবে?', options: ['বাড়বে', 'কমবে', 'একই থাকবে'], answer: 1, why: 'পেশি কাজের সময় গ্লুকোজ খরচ করে। শৃঙ্খলা, খাদ্য নিয়ন্ত্রণ ও ঔষধ এই তিন D-ই গুরুত্বপূর্ণ।', proves: (s) => B.glucoseDay(s).at(-1)![1] < B.glucoseDay({ ...s, walk: false }).at(-1)![1] },
  ] as Scenario<B.SugarState>[],

  flask: [
    { id: 'dead', title: 'মৃত বীজ', set: { alive: false }, ask: 'মারকিউরিক ক্লোরাইডে মরা ছোলার ফ্লাস্কে কী হবে?', options: ['তাপমাত্রা বাড়বে', 'তাপমাত্রা একই থাকবে', 'তাপমাত্রা অনেক কমবে'], answer: 1, why: 'মৃত বীজে শ্বসন নেই, তাই তাপ নির্গত হয় না। এই ফ্লাস্কটিই তুলনার নিয়ন্ত্রণ।', proves: (s) => L.flaskTemp(s, 6) === 30 },
    { id: 'dry', title: 'শুকনো বীজ', set: { wet: false }, ask: 'না ভেজানো শুকনো ছোলা নিলে কী হবে?', options: ['ভেজা ছোলার মতোই গরম হবে', 'প্রায় গরম হবে না', 'ঠান্ডা হবে'], answer: 1, why: 'উৎসেচকের কাজের জন্য পানি লাগে। শুকনো বীজে শ্বসন খুব ধীর।', proves: (s) => L.flaskTemp(s, 6) < 31 },
    { id: 'open', title: 'সাধারণ খোলা পাত্র', set: { sealed: false }, ask: 'থার্মোফ্লাস্কের বদলে খোলা পাত্রে নিলে তাপমাত্রা কম বাড়বে কেন?', options: ['শ্বসন বন্ধ হয়', 'তাপ বাইরে বেরিয়ে যায়', 'বীজ মরে যায়'], answer: 1, why: 'থার্মোফ্লাস্ক তাপ ধরে রাখে, তাই শ্বসনের তাপ মাপা যায়।', proves: (s) => L.flaskTemp(s, 6) < L.flaskTemp(INIT.flask, 6) },
  ] as Scenario<L.FlaskState>[],

  gasDay: [
    { id: 'night', title: 'রাত', set: { light: 0 }, ask: 'রাতে গাছ বাতাসে কী ছাড়ে?', options: ['O₂', 'CO₂', 'কিছুই না'], answer: 1, why: 'আলো নেই, তাই সালোকসংশ্লেষণ নেই। শ্বসন কিন্তু দিনরাত চলে।', think: 'রাতে বড় গাছের নিচে ঘুমাতে বারণ করা হয় কেন?', proves: (s) => L.gasBalance(s).net < 0 },
    { id: 'balance', title: 'ভোরের মৃদু আলো', set: { light: 20 }, ask: 'মৃদু আলোয় এমন একটি সময় আসে যখন গাছ বাইরে থেকে গ্যাস প্রায় নেয় না। কেন?', options: ['গাছ ঘুমায়', 'সালোকসংশ্লেষণ ও শ্বসন সমান হয়', 'পত্ররন্ধ্র নেই'], answer: 1, why: 'শ্বসনের CO₂ সালোকসংশ্লেষণে আর সালোকসংশ্লেষণের O₂ শ্বসনে খরচ হয়।', proves: (s) => L.gasBalance(s).net === 0 },
  ] as Scenario<L.GasDayState>[],

  fate: [
    { id: 'nostigma', title: 'গর্ভমুণ্ড কাটা', set: { stigma: false }, ask: 'গর্ভমুণ্ড কেটে ফেললে ফল হবে?', options: ['হ্যাঁ', 'না'], answer: 1, why: 'পরাগরেণু বসার জায়গা নেই, তাই পরাগনালি জন্মাবে না।', proves: (s) => !L.flowerFate(s).fruit },
    { id: 'nopetal', title: 'পাপড়ি ছেঁড়া', set: { petals: false }, ask: 'পোকার ওপর নির্ভরশীল ফুলের পাপড়ি ছিঁড়লে কী হবে?', options: ['ফল বেশি হবে', 'পোকা না আসায় ফল কমবে', 'কোনো প্রভাব নেই'], answer: 1, why: 'দলমণ্ডল সরাসরি জননে অংশ নেয় না, কিন্তু পোকাকে টেনে আনে।', proves: (s) => !L.flowerFate(s).fruit },
    { id: 'selfp', title: 'স্ব-পরাগী ফুল, পোকা নেই', set: { pollinatorNeeded: false, insect: false }, ask: 'স্ব-পরাগী ফুলে পোকা না এলে ফল হবে?', options: ['হ্যাঁ', 'না'], answer: 0, why: 'নিজের পরাগই গর্ভমুণ্ডে পড়ে, তাই বাহক লাগে না। তবে নতুন বৈচিত্র্য কম আসে।', proves: (s) => L.flowerFate(s).fruit },
  ] as Scenario<L.FlowerState>[],

  rdna: [
    { id: 'mismatch', title: 'দুটি ভিন্ন এনজাইম', set: { donorCut: 'BamHI' }, ask: 'দাতা ও প্লাজমিড ভিন্ন এনজাইমে কাটলে কী হবে?', options: ['জিন সহজে বসবে', 'প্রান্ত মিলবে না', 'ব্যাকটেরিয়া মরে যাবে'], answer: 1, why: 'একই এনজাইম একই ক্রমে কাটে, তাই প্রান্ত পরিপূরক হয়।', proves: (s) => L.rdna(s).stage === 'join' },
    { id: 'noglue', title: 'লাইগেজ নেই', set: { ligase: false }, ask: 'লাইগেজ না দিলে কী হবে?', options: ['জোড়া স্থায়ী হবে না', 'জিন দ্বিগুণ হবে', 'কোনো প্রভাব নেই'], answer: 0, why: 'লাইগেজ আঠার মতো DNA-র খণ্ড জুড়ে দেয়।', proves: (s) => !L.rdna(s).ok },
    { id: 'plate', title: 'অ্যান্টিবায়োটিকহীন প্লেট', set: { antibiotic: false }, ask: 'সাধারণ প্লেটে রাখলে সমস্যা কী?', options: ['কিছুই জন্মাবে না', 'জিনহীন ব্যাকটেরিয়াও জন্মাবে', 'ব্যাকটেরিয়া গলে যাবে'], answer: 1, why: 'বাছাই করার উপায় না থাকলে কোনটিতে জিন আছে বোঝা যায় না।', proves: (s) => L.rdna(s).stage === 'pick' },
  ] as Scenario<L.RdnaState>[],

  culture: [
    { id: 'dirty', title: 'জীবাণুমুক্ত করা হয়নি', set: { sterile: false }, ask: 'অটোক্লেভ না করলে কী হবে?', options: ['চারা দ্রুত বাড়বে', 'ছত্রাক ও ব্যাকটেরিয়া জন্মাবে', 'কিছুই হবে না'], answer: 1, why: 'পুষ্টিসমৃদ্ধ মাধ্যমে জীবাণু উদ্ভিদকোষের চেয়ে দ্রুত বাড়ে।', proves: (s) => L.culture(s).fate === 'contaminated' },
    { id: 'hot', title: '৩৪°C ঘর', set: { temp: 34 }, ask: '৩৪°C-এ রাখলে কী হবে?', options: ['বিভাজন ব্যাহত হবে', 'দ্বিগুণ দ্রুত হবে', 'কোনো প্রভাব নেই'], answer: 0, why: 'বইয়ের নির্দেশিত তাপমাত্রা ২৫±২°C।', proves: (s) => L.culture(s).fate === 'slow' },
    { id: 'virus', title: 'রোগা মাতৃগাছ', set: { healthyParent: false }, ask: 'রোগাক্রান্ত মাতৃগাছ বাছলে চারা কেমন হবে?', options: ['সব রোগমুক্ত', 'মাতৃগাছের রোগ পেতে পারে', 'চারা বড় হবে'], answer: 1, why: 'চারাগুলো মাতৃগাছের হুবহু অনুলিপি। তাই শুরুতেই রোগমুক্ত ও উন্নত গাছ বাছা হয়।', proves: (s) => L.culture(s).fate === 'virus' },
  ] as Scenario<L.CultureState>[],
};
