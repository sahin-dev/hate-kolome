import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseNotes } from './notes';
import { quizzes } from '../subjects/biology/quiz';

describe('parseNotes', () => {
  it('reads every block type', () => {
    const [section] = parseNotes('## A\ntext **b**\n- one\n- two\n: t | m\n| h1 | h2 |\n| a | b |\n= f\n! fact\n!! warn\n### sub');
    expect(section.title).toBe('A');
    expect(section.blocks.map((b) => b.t)).toEqual(['p', 'list', 'terms', 'table', 'formula', 'fact', 'warn', 'h3']);
  });

  it('keeps a pipe inside a meaning', () => {
    const [section] = parseNotes('## A\n: term | a | b');
    expect(section.blocks[0]).toEqual({ t: 'terms', items: [['term', 'a | b']] });
  });
});

describe('biology content', () => {
  const dir = join(__dirname, '../subjects/biology/notes');
  const files = readdirSync(dir);

  it('has notes for all fourteen chapters', () => {
    expect(files).toHaveLength(14);
    for (const f of files) expect(parseNotes(readFileSync(join(dir, f), 'utf8')).length).toBeGreaterThan(1);
  });

  it('has a table with even columns everywhere', () => {
    for (const f of files) {
      for (const s of parseNotes(readFileSync(join(dir, f), 'utf8'))) {
        for (const b of s.blocks) {
          if (b.t === 'table') for (const r of b.rows) expect(r.length, `${f}: ${r.join(' | ')}`).toBe(b.head.length);
        }
      }
    }
  });

  it('has valid quiz answers', () => {
    expect(Object.keys(quizzes)).toHaveLength(14);
    for (const list of Object.values(quizzes)) {
      expect(list.length).toBeGreaterThanOrEqual(4);
      for (const q of list) expect(q.options[q.answer], q.q).toBeTruthy();
    }
  });
});
