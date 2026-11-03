import type { Subject } from '../core/types';
import { biology } from './biology';

/** To add a subject: create a folder like ./biology and list it here. */
export const subjects: Subject[] = [
  biology,
  {
    id: 'physics',
    name: 'পদার্থবিজ্ঞান',
    nameEn: 'Physics',
    tagline: 'গতি, বল, আলো ও বিদ্যুৎ নিয়ে পরীক্ষা',
    accent: '#2f6fb0',
    status: 'soon',
    chapters: [],
  },
  {
    id: 'chemistry',
    name: 'রসায়ন',
    nameEn: 'Chemistry',
    tagline: 'পরমাণু, বিক্রিয়া ও মৌল নিয়ে পরীক্ষা',
    accent: '#b8562e',
    status: 'soon',
    chapters: [],
  },
];

export const findSubject = (id?: string) => subjects.find((s) => s.id === id);
