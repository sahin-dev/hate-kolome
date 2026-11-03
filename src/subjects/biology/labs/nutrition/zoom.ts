import { GUT, digest, type DigestState } from '../models/body';

export interface StageView {
  before: { starch: number; protein: number; fat: number };
  after: { starch: number; protein: number; fat: number };
  /** Enzymes at work here. A switched-off juice appears, greyed and idle, so its absence is visible. */
  enzymes: { name: string; acts: 'starch' | 'protein' | 'fat'; on: boolean }[];
  /** Bile has broken the fat into fine droplets. */
  emulsified: boolean;
  absorbing: boolean;
}

const GUT_INDEX = [0, 0, 1, 2, 3, 3];

/** What the microscope view should show at each stop of the journey. */
export function stageView(s: DigestState, stop: number): StageView {
  const d = digest(s);
  const at = GUT_INDEX[stop];
  const prev = stop === 0 ? -1 : GUT_INDEX[stop - 1];
  const amount = (i: number) =>
    i < 0
      ? { starch: d.starch[0] / 0.75, protein: d.protein[0], fat: d.fat[0] }
      : { starch: d.starch[i], protein: d.protein[i], fat: d.fat[i] };

  const enzymes: StageView['enzymes'] = [];
  if (stop === 0) enzymes.push({ name: 'টায়ালিন', acts: 'starch', on: true });
  if (stop === 2) enzymes.push({ name: 'পেপসিন', acts: 'protein', on: s.acid });
  if (stop === 3) {
    enzymes.push({ name: 'অ্যামাইলেজ', acts: 'starch', on: s.pancreas }, { name: 'ট্রিপসিন', acts: 'protein', on: s.pancreas }, { name: 'লাইপেজ', acts: 'fat', on: s.pancreas });
  }
  if (stop === 4) {
    enzymes.push({ name: 'আন্ত্রিক রস', acts: 'starch', on: true }, { name: 'আন্ত্রিক রস', acts: 'protein', on: true }, { name: 'আন্ত্রিক রস', acts: 'fat', on: true });
  }

  return {
    before: amount(stop === 1 ? 0 : prev),
    after: amount(at),
    enzymes,
    emulsified: stop >= 3 && stop <= 4 && s.bile,
    absorbing: stop === 4,
  };
}

export const ZOOM_TITLES = [
  'দাঁত ও লালা: শ্বেতসারের চেইন কাটা শুরু',
  'অন্ননালি: পেরিস্টালসিস খাবার ঠেলে নামায়',
  'পাকস্থলীর ভাঁজ: অম্লের মধ্যে পেপসিন',
  'ডিওডেনাম: পিত্তরস ও অগ্ন্যাশয় রস',
  'ইলিয়ামের ভিলাই: পুষ্টি রক্তে ঢুকছে',
  'বৃহদন্ত্র: পানি শোষণ ও উপকারী ব্যাকটেরিয়া',
];

export { GUT };
