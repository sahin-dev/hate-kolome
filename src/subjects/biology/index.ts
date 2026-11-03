import type { ComponentType } from 'react';
import { parseNotes } from '../../core/notes';
import type { Chapter, LabDef, Subject } from '../../core/types';
import { quizzes } from './quiz';

const noteFiles = import.meta.glob('./notes/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

type Meta = Pick<Chapter, 'number' | 'title' | 'titleEn' | 'tagline' | 'pages' | 'labs'>;

/** Wraps a named export of a lab module so React.lazy can load it. */
const pick = <M,>(load: () => Promise<M>, name: keyof M) => () =>
  load().then((m) => ({ default: m[name] as ComponentType }));

const classify = () => import('./labs/ClassifyLabs');
const division = () => import('./labs/DivisionLabs');
const casesModule = () => import('./labs/ChapterCases');
const cell = () => import('./labs/CellLab');
const microscope = () => import('./labs/MicroscopeLab');
const cases = () => import('./labs/CaseLab');
const mitosis = () => import('./labs/MitosisLab');
const meiosis = () => import('./labs/MeiosisLab');
const shapes = () => import('./labs/ChromosomeShapeLab');
const plant = () => import('./labs/PlantLab');
const chloroplast = () => import('./labs/ChloroplastLab');
const factors = () => import('./labs/FactorLab');
const leafTest = () => import('./labs/LeafTestLab');
const respiration = () => import('./labs/RespirationLab');
const nutrition = () => import('./labs/NutritionLabs');
const transport = () => import('./labs/TransportLabs');
const body = () => import('./labs/BodyLabs');
const signal = () => import('./labs/SignalLabs');
const flower = () => import('./labs/FlowerLab');
const heredity = () => import('./labs/HeredityLabs');
const eco = () => import('./labs/EcoLabs');
const biotech = () => import('./labs/BiotechLabs');

const CQ = { title: 'সৃজনশীল অনুশীলন', blurb: 'ক, খ, গ, ঘ স্তরে যুক্তি গড়ো' };
const practice = (chapter: number): LabDef => ({ id: 'cases', ...CQ, load: () => casesModule().then((m) => ({ default: m.casesFor(chapter) })) });

const meta: Meta[] = [
  {
    number: 1, title: 'জীবনপাঠ', titleEn: 'Lesson on Life', tagline: 'জীববিজ্ঞানের শাখা, পাঁচ রাজ্য ও দ্বিপদ নামকরণ', pages: [1, 16],
    labs: [
      { id: 'key', title: 'শনাক্তকরণ কী', blurb: 'পর্যবেক্ষণ থেকে জীবের রাজ্য বের করো', load: pick(classify, 'KeyLab') },
      { id: 'names', title: 'বৈজ্ঞানিক নাম', blurb: 'নিয়ম মিলিয়ে নাম লেখো, ধাপে ধাপে নামো', load: pick(classify, 'NameLab') },
      { id: 'branches', title: 'শাখা চেনো', blurb: 'ভৌত না ফলিত, ঠিক করো', load: pick(classify, 'BranchSort') },
      practice(1),
    ],
  },
  {
    number: 2, title: 'জীবকোষ ও টিস্যু', titleEn: 'Cell and Tissue', tagline: 'কোষের অঙ্গাণু, তাদের কাজ এবং টিস্যু থেকে তন্ত্র', pages: [17, 49],
    labs: [
      { id: 'cell', title: 'জীবন্ত কোষ', blurb: 'সাত ধরনের কোষ, প্রতিটি অঙ্গাণু কাছ থেকে', load: pick(cell, 'default') },
      { id: 'microscope', title: 'অণুবীক্ষণ ল্যাব', blurb: 'স্লাইড বানাও, ফোকাস করো, কোষ চেনো', load: pick(microscope, 'default') },
      { id: 'cases', ...CQ, load: pick(cases, 'default') },
      { id: 'tissues', title: 'টিস্যু সাজাও', blurb: 'কোন টিস্যু কোন দলে', load: pick(classify, 'TissueSort') },
    ],
  },
  {
    number: 3, title: 'কোষ বিভাজন', titleEn: 'Cell Division', tagline: 'মাইটোসিস, মিয়োসিস ও ক্রোমোজোমের রূপ', pages: [50, 63],
    labs: [
      { id: 'mitosis', title: 'মাইটোসিস', blurb: 'সময়রেখা টেনে প্রতিটি ধাপ দেখো', load: pick(mitosis, 'default') },
      { id: 'meiosis', title: 'মিয়োসিস', blurb: 'ক্রসিং ওভার ঘটাও, বৈচিত্র্য তৈরি করো', load: pick(meiosis, 'default') },
      { id: 'shapes', title: 'ক্রোমোজোমের আকৃতি', blurb: 'সেন্ট্রোমিয়ার সরিয়ে V, L, J, I তৈরি করো', load: pick(shapes, 'default') },
      { id: 'growth', title: 'ক্ষত ও টিউমার', blurb: 'নিয়ন্ত্রিত ও অনিয়ন্ত্রিত বিভাজন', load: pick(division, 'GrowthLab') },
      { id: 'ploidy', title: 'মিয়োসিস না থাকলে', blurb: 'প্রজন্মে প্রজন্মে ক্রোমোজোম গোনো', load: pick(division, 'PloidyLab') },
      practice(3),
    ],
  },
  {
    number: 4, title: 'জীবনীশক্তি', titleEn: 'Bioenergetics', tagline: 'ATP, সালোকসংশ্লেষণ ও শ্বসন', pages: [64, 83],
    labs: [
      { id: 'plant', title: 'গাছের খাদ্য কারখানা', blurb: 'মূল থেকে পাতা পর্যন্ত প্রতিটি অঙ্গ চালাও', load: pick(plant, 'default') },
      { id: 'chloroplast', title: 'ক্লোরোপ্লাস্ট চালাও', blurb: 'আলো ফেলে নিজে গ্লুকোজ তৈরি করো', load: pick(chloroplast, 'default') },
      { id: 'factors', title: 'প্রভাবকের পরীক্ষা', blurb: 'আলো, CO₂, তাপ ও রঙ বদলাও', load: pick(factors, 'default') },
      { id: 'leaftest', title: 'আয়োডিন পরীক্ষা', blurb: 'আলো ও ক্লোরোফিলের প্রমাণ', load: pick(leafTest, 'default') },
      { id: 'respiration', title: 'ATP-র হিসাব', blurb: 'গ্লুকোজ থেকে ৩৮ ATP গুনে দেখো', load: pick(respiration, 'default') },
      { id: 'thermos', title: 'শ্বসনের তাপ', blurb: 'অঙ্কুরিত ছোলার থার্মোফ্লাস্ক পরীক্ষা', load: pick(division, 'ThermosLab') },
      practice(4),
    ],
  },
  {
    number: 5, title: 'খাদ্য, পুষ্টি এবং পরিপাক', titleEn: 'Food, Nutrition and Digestion', tagline: 'উদ্ভিদের খনিজ, মানুষের পুষ্টি, BMI ও পরিপাক', pages: [84, 124],
    labs: [
      { id: 'digest', title: 'খাবারের যাত্রা', blurb: 'দেহের ভেতরে ও অণুর স্তরে পরিপাক দেখো', load: pick(nutrition, 'DigestLab') },
      { id: 'minerals', title: 'গাছের ডাক্তার', blurb: 'পাতার লক্ষণ দেখে অভাব ধরো', load: pick(nutrition, 'MineralLab') },
      { id: 'foodtest', title: 'খাদ্য পরীক্ষা', blurb: 'টেস্টটিউবে খাদ্য শনাক্ত করো, লালার উৎসেচক পরীক্ষা করো', load: pick(nutrition, 'FoodTestLab') },
      { id: 'diet', title: 'খাবার সাজাও', blurb: 'বইয়ের সারণি দিয়ে শক্তির হিসাব', load: pick(nutrition, 'DietLab') },
      { id: 'bmi', title: 'BMI ও শক্তির হিসাব', blurb: 'বইয়ের সূত্রে হিসাব করো', load: pick(nutrition, 'BmiLab') },
      practice(5),
    ],
  },
  {
    number: 6, title: 'জীবে পরিবহন', titleEn: 'Transport', tagline: 'অভিস্রবণ, রক্ত, রক্তের গ্রুপ ও হৃৎপিণ্ড', pages: [125, 159],
    labs: [
      { id: 'osmosis', title: 'অভিস্রবণ', blurb: 'চিনি মিশিয়ে পানির চলাচল দেখো', load: pick(transport, 'OsmosisLab') },
      { id: 'transpire', title: 'প্রস্বেদন', blurb: 'আলো, বাতাস ও আর্দ্রতা বদলাও', load: pick(transport, 'TranspireLab') },
      { id: 'heart', title: 'হৃৎপিণ্ড', blurb: 'স্পন্দন চক্র, কপাটিকা ও রক্তের পথ', load: pick(transport, 'HeartLab') },
      { id: 'bp', title: 'রক্তচাপ মাপো', blurb: 'শব্দ শুনে সিস্টোলিক ও ডায়াস্টোলিক ধরো', load: pick(transport, 'BpLab') },
      { id: 'blood', title: 'রক্তের গ্রুপ', blurb: 'রিএজেন্ট দিয়ে গ্রুপ নির্ণয় করো', load: pick(transport, 'BloodLab') },
      practice(6),
    ],
  },
  {
    number: 7, title: 'গ্যাসীয় বিনিময়', titleEn: 'Gaseous Exchange', tagline: 'শ্বাসক্রিয়া ও ফুসফুসে অক্সিজেনের পথ', pages: [160, 177],
    labs: [
      { id: 'breath', title: 'শ্বাস নাও', blurb: 'মধ্যচ্ছদা টেনে ফুসফুস ভরো', load: pick(body, 'BreathLab') },
      { id: 'lime', title: 'চুনের পানির পরীক্ষা', blurb: 'নিঃশ্বাসে কী আছে প্রমাণ করো', load: pick(body, 'LimeLab') },
      { id: 'alveolus', title: 'বায়ুথলির বিনিময়', blurb: 'নিউমোনিয়া, রক্তশূন্যতা ও পাহাড়', load: pick(body, 'GasLab') },
      { id: 'gasday', title: 'গাছের দিন ও রাত', blurb: 'আলো বদলে গ্যাসের হিসাব দেখো', load: pick(body, 'GasDayLab') },
      practice(7),
    ],
  },
  {
    number: 8, title: 'রেচন প্রক্রিয়া', titleEn: 'Excretion', tagline: 'বৃক্ক, নেফ্রন ও মূত্র তৈরি', pages: [178, 189],
    labs: [
      { id: 'nephron', title: 'নেফ্রনের ছাঁকনি', blurb: 'প্রতিটি পদার্থের পথ ধরো', load: pick(body, 'NephronLab') },
      { id: 'dialysis', title: 'ডায়ালাইসিস', blurb: 'তরল বদলে রক্ত পরিশোধন করো', load: pick(body, 'DialysisLab') },
      practice(8),
    ],
  },
  {
    number: 9, title: 'দৃঢ়তা প্রদান ও চলন', titleEn: 'Support and Movement', tagline: 'কঙ্কাল, অস্থিসন্ধি ও পেশি', pages: [190, 203],
    labs: [
      { id: 'arm', title: 'বাহু নাড়াও', blurb: 'বাইসেপস ও ট্রাইসেপসের টানাটানি দেখো', load: pick(body, 'ArmLab') },
      { id: 'joints', title: 'অস্থিসন্ধি', blurb: 'কোন সন্ধি কীভাবে নড়ে', load: pick(body, 'JointLab') },
      { id: 'bone', title: 'হাড়ের জীবনকাল', blurb: 'অভ্যাস বদলে অস্থির ঘনত্ব দেখো', load: pick(body, 'BoneLab') },
      practice(9),
    ],
  },
  {
    number: 10, title: 'সমন্বয়', titleEn: 'Co-ordination', tagline: 'উদ্ভিদ হরমোন, স্নায়ু ও প্রতিবর্তী ক্রিয়া', pages: [204, 230],
    labs: [
      { id: 'reflex', title: 'প্রতিবর্তী ক্রিয়া', blurb: 'তাড়নার পথ ধরো, কাটা স্নায়ু খোঁজো', load: pick(signal, 'ReflexLab') },
      { id: 'sugar', title: 'রক্তের গ্লুকোজ', blurb: 'ইনসুলিন, খাবার ও ব্যায়ামের খেলা', load: pick(signal, 'SugarLab') },
      { id: 'tropism', title: 'আলোর দিকে গাছ', blurb: 'আলো সরাও, অক্সিন গাছ বাঁকায়', load: pick(signal, 'TropismLab') },
      { id: 'day', title: 'দিনের দৈর্ঘ্য ও ফুল', blurb: 'আলোর ঘণ্টা বদলে ফুল ফোটাও', load: pick(signal, 'DayLab') },
      practice(10),
    ],
  },
  {
    number: 11, title: 'জীবের প্রজনন', titleEn: 'Reproduction', tagline: 'ফুল, পরাগায়ন, নিষেক ও মানব প্রজনন', pages: [231, 253],
    labs: [
      { id: 'flower', title: 'ফুল থেকে ফল', blurb: 'ফুলের অংশ ও দ্বিনিষেক', load: pick(flower, 'default') },
      { id: 'fate', title: 'ফল হবে কি?', blurb: 'অংশ সরিয়ে পরীক্ষা করো', load: pick(flower, 'FateLab') },
      { id: 'pollination', title: 'পরাগায়নের মাধ্যম', blurb: 'বৈশিষ্ট্য দেখে বাহক ঠিক করো', load: pick(flower, 'PollinationSort') },
      { id: 'embryo', title: 'ভ্রূণের যাত্রা', blurb: 'জাইগোট থেকে জন্ম পর্যন্ত', load: pick(flower, 'EmbryoLab') },
      practice(11),
    ],
  },
  {
    number: 12, title: 'জীবের বংশগতি ও জৈব অভিব্যক্তি', titleEn: 'Heredity and Evolution', tagline: 'DNA, মেন্ডেল, লিঙ্গ নির্ধারণ ও অভিব্যক্তি', pages: [254, 281],
    labs: [
      { id: 'dna', title: 'DNA গড়ো', blurb: 'ক্ষারক জোড়া মিলিয়ে অনুলিপি করো', load: pick(heredity, 'DnaLab') },
      { id: 'punnett', title: 'বংশগতির ছক', blurb: 'মেন্ডেল, লিঙ্গ, থ্যালাসেমিয়া ও বর্ণান্ধতা', load: pick(heredity, 'PunnettLab') },
      { id: 'fingerprint', title: 'DNA টেস্ট', blurb: 'ব্যান্ড মিলিয়ে নমুনা শনাক্ত করো', load: pick(heredity, 'FingerprintLab') },
      { id: 'selection', title: 'প্রাকৃতিক নির্বাচন', blurb: 'পাখি কোন পোকা খায়, দেখো', load: pick(heredity, 'SelectionLab') },
      practice(12),
    ],
  },
  {
    number: 13, title: 'জীবের পরিবেশ', titleEn: 'Environment', tagline: 'বাস্তুতন্ত্র, খাদ্যজাল ও শক্তিপ্রবাহ', pages: [282, 304],
    labs: [
      { id: 'web', title: 'পুকুরের খাদ্যজাল', blurb: 'কোনো জীব সরালে পুরো জাল কীভাবে বদলায়', load: pick(eco, 'FoodWebLab') },
      { id: 'pyramid', title: 'শক্তি পিরামিড', blurb: 'শক্তি কত দ্রুত ফুরায়', load: pick(eco, 'PyramidLab') },
      { id: 'relations', title: 'জীবের সম্পর্ক', blurb: 'মিথোজীবিতা থেকে অ্যান্টিবায়োসিস', load: pick(eco, 'RelationSort') },
      practice(13),
    ],
  },
  {
    number: 14, title: 'জীবপ্রযুক্তি', titleEn: 'Biotechnology', tagline: 'টিস্যু কালচার ও জেনেটিক ইঞ্জিনিয়ারিং', pages: [305, 320],
    labs: [
      { id: 'recombinant', title: 'রিকম্বিনেন্ট DNA', blurb: 'এনজাইম বেছে জিন ক্লোন করো', load: pick(biotech, 'RecombinantLab') },
      { id: 'culture', title: 'টিস্যু কালচার', blurb: 'পরীক্ষাগারে চারা তৈরি করো', load: pick(biotech, 'CultureLab') },
      practice(14),
    ],
  },
];

const chapters: Chapter[] = meta.map((m) => {
  const id = `ch${String(m.number).padStart(2, '0')}`;
  return { ...m, id, notes: parseNotes(noteFiles[`./notes/${id}.md`] ?? ''), quiz: quizzes[id] ?? [] };
});

export const biology: Subject = {
  id: 'biology',
  name: 'জীববিজ্ঞান',
  nameEn: 'Biology',
  tagline: 'কোষ থেকে বাস্তুতন্ত্র: জীবন কীভাবে কাজ করে',
  accent: '#2a7a4d',
  status: 'live',
  chapters,
};
