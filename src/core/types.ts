import type { ComponentType } from 'react';

export type NoteBlock =
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'terms'; items: [string, string][] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'formula'; text: string }
  | { t: 'fact'; text: string }
  | { t: 'warn'; text: string }
  | { t: 'h3'; text: string };

export interface NoteSection {
  title: string;
  blocks: NoteBlock[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface LabDef {
  id: string;
  title: string;
  blurb: string;
  load: () => Promise<{ default: ComponentType }>;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  titleEn: string;
  tagline: string;
  /** Printed page range in the textbook. */
  pages: [number, number];
  notes: NoteSection[];
  quiz: QuizQuestion[];
  labs: LabDef[];
}

export interface Subject {
  id: string;
  name: string;
  nameEn: string;
  tagline: string;
  accent: string;
  status: 'live' | 'soon';
  chapters: Chapter[];
}
