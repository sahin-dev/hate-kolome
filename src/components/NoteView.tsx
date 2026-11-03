import { Fragment } from 'react';
import type { NoteBlock, NoteSection } from '../core/types';

function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function Block({ block }: { block: NoteBlock }) {
  switch (block.t) {
    case 'p':
      return (
        <p>
          <Rich text={block.text} />
        </p>
      );
    case 'h3':
      return <h4>{block.text}</h4>;
    case 'list':
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>
              <Rich text={item} />
            </li>
          ))}
        </ul>
      );
    case 'terms':
      return (
        <dl className="terms">
          {block.items.map(([term, meaning], i) => (
            <div key={i}>
              <dt>
                <Rich text={term} />
              </dt>
              <dd>
                <Rich text={meaning} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case 'table':
      return (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <Rich text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'formula':
      return <p className="formula">{block.text}</p>;
    case 'fact':
      return (
        <p className="callout">
          <Rich text={block.text} />
        </p>
      );
    case 'warn':
      return (
        <p className="callout callout-warn">
          <Rich text={block.text} />
        </p>
      );
  }
}

export function NoteView({ sections }: { sections: NoteSection[] }) {
  return (
    <article className="notes">
      {sections.length > 2 && (
        <nav className="note-toc" aria-label="এই অধ্যায়ে">
          {sections.map((s, i) => (
            <a
              key={i}
              href={`#note-${i}`}
              onClick={(e) => {
                // The router owns the URL hash, so scroll by hand instead of following the link.
                e.preventDefault();
                document.getElementById(`note-${i}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {s.title}
            </a>
          ))}
        </nav>
      )}
      {sections.map((s, i) => (
        <section key={i} id={`note-${i}`}>
          <h3>{s.title}</h3>
          {s.blocks.map((b, j) => (
            <Block key={j} block={b} />
          ))}
        </section>
      ))}
    </article>
  );
}
