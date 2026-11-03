import { useCallback, useSyncExternalStore } from 'react';

/** Per-browser progress. There are no accounts yet, so this is a convenience, not a record. */
export interface ChapterProgress {
  read?: boolean;
  quizBest?: number;
  labs?: string[];
}

type Store = Record<string, ChapterProgress>;

const KEY = 'hatekolome.progress.v1';
const listeners = new Set<() => void>();

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Store;
  } catch {
    return {};
  }
}

let store: Store = load();

function commit(next: Store) {
  store = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private windows can refuse storage; progress then lasts for this visit only.
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const chapterKey = (subjectId: string, chapterId: string) => `${subjectId}/${chapterId}`;

export function useProgress(key: string) {
  const value = useSyncExternalStore(subscribe, () => store[key]) ?? {};

  const update = useCallback(
    (patch: (p: ChapterProgress) => ChapterProgress) =>
      commit({ ...store, [key]: patch(store[key] ?? {}) }),
    [key],
  );

  return { progress: value, update };
}

export function useAllProgress(): Store {
  return useSyncExternalStore(subscribe, () => store);
}

/** A chapter is complete once notes are read, a quiz is passed and every lab has been opened. */
export function chapterPercent(p: ChapterProgress | undefined, labCount: number): number {
  if (!p) return 0;
  const parts = [p.read ? 1 : 0, (p.quizBest ?? 0) >= 0.6 ? 1 : 0, labCount ? (p.labs?.length ?? 0) / labCount : 1];
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}
