import type { NoteBlock, NoteSection } from './types';

/**
 * Notes are plain text so a teacher can edit them without touching code.
 *
 *   ## section title      ### sub heading
 *   - list item           : term | meaning
 *   | table | row |       (first row is the header)
 *   = formula             ! key fact           !! caution
 *
 * Any other line is a paragraph. **bold** works inside text.
 */
export function parseNotes(source: string): NoteSection[] {
  const sections: NoteSection[] = [];
  let current: NoteSection | null = null;

  const push = (block: NoteBlock) => {
    if (!current) {
      current = { title: '', blocks: [] };
      sections.push(current);
    }
    current.blocks.push(block);
  };

  const last = (): NoteBlock | undefined => current?.blocks[current.blocks.length - 1];

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('### ')) {
      push({ t: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ')) {
      current = { title: line.slice(3), blocks: [] };
      sections.push(current);
    } else if (line.startsWith('- ')) {
      const prev = last();
      if (prev?.t === 'list') prev.items.push(line.slice(2));
      else push({ t: 'list', items: [line.slice(2)] });
    } else if (line.startsWith(': ')) {
      const [term, ...rest] = line.slice(2).split('|');
      const item: [string, string] = [term.trim(), rest.join('|').trim()];
      const prev = last();
      if (prev?.t === 'terms') prev.items.push(item);
      else push({ t: 'terms', items: [item] });
    } else if (line.startsWith('|')) {
      const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const prev = last();
      if (prev?.t === 'table') prev.rows.push(cells);
      else push({ t: 'table', head: cells, rows: [] });
    } else if (line.startsWith('= ')) {
      push({ t: 'formula', text: line.slice(2) });
    } else if (line.startsWith('!! ')) {
      push({ t: 'warn', text: line.slice(3) });
    } else if (line.startsWith('! ')) {
      push({ t: 'fact', text: line.slice(2) });
    } else {
      push({ t: 'p', text: line });
    }
  }
  return sections;
}
