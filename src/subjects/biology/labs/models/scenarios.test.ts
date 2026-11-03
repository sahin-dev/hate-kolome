import { describe, expect, it } from 'vitest';
import { INIT, SCENARIOS } from './scenarios';

describe('every experiment shows the answer it claims', () => {
  for (const [lab, list] of Object.entries(SCENARIOS)) {
    const start = INIT[lab as keyof typeof INIT];
    it.each(list.map((s) => [s.id, s] as const))(`${lab}: %s`, (_, s) => {
      const merged = { ...start, ...s.set };
      expect((s.proves as (x: unknown) => boolean)(merged)).toBe(true);
      expect(s.options[s.answer]).toBeTruthy();
    });
  }
});
