import { Suspense, lazy, useEffect, useMemo } from 'react';
import { Link, NavLink, useLocation, useParams } from 'react-router-dom';
import { findSubject } from '../subjects';
import { chapterKey, useProgress } from '../core/progress';
import { bn } from '../core/util';
import type { Chapter, LabDef, Subject } from '../core/types';
import { NoteView } from '../components/NoteView';
import { Quiz } from '../components/Quiz';
import { NotFoundPage } from './NotFoundPage';

export function ChapterPage({ section }: { section: 'theory' | 'lab' }) {
  const { subjectId, chapterId, labId } = useParams();
  const subject = findSubject(subjectId);
  const index = subject?.chapters.findIndex((c) => c.id === chapterId) ?? -1;
  if (!subject || index < 0) return <NotFoundPage />;

  const chapter = subject.chapters[index];
  const base = `/${subject.id}/${chapter.id}`;
  const prev = subject.chapters[index - 1];
  const next = subject.chapters[index + 1];

  return (
    <div className="page page-wide">
      <nav className="crumbs" aria-label="অবস্থান">
        <Link to={`/${subject.id}`}>{subject.name}</Link>
        <span aria-hidden="true">/</span>
        <span>অধ্যায় {bn(chapter.number)}</span>
      </nav>
      <h1 className="page-title">{chapter.title}</h1>
      <p className="lede">{chapter.tagline}</p>

      <div className="tabs" role="tablist" aria-label="অধ্যায়ের অংশ">
        <NavLink end to={base} className="tab" role="tab" aria-selected={section === 'theory'}>
          তত্ত্ব
        </NavLink>
        <NavLink to={`${base}/lab`} className="tab" role="tab" aria-selected={section === 'lab'}>
          ল্যাব
        </NavLink>
      </div>

      {section === 'theory' ? (
        <Theory subject={subject} chapter={chapter} />
      ) : (
        <LabSection subject={subject} chapter={chapter} labId={labId} />
      )}

      <nav className="pager" aria-label="অধ্যায় বদলাও">
        {prev ? (
          <Link to={`/${subject.id}/${prev.id}`}>← {prev.title}</Link>
        ) : (
          <span />
        )}
        {next ? <Link to={`/${subject.id}/${next.id}`}>{next.title} →</Link> : <span />}
      </nav>
    </div>
  );
}

function Theory({ subject, chapter }: { subject: Subject; chapter: Chapter }) {
  const { progress, update } = useProgress(chapterKey(subject.id, chapter.id));

  return (
    <>
      <NoteView sections={chapter.notes} />
      <div className="note-end">
        <button
          type="button"
          className={progress.read ? 'btn btn-ghost' : 'btn btn-primary'}
          aria-pressed={!!progress.read}
          onClick={() => update((p) => ({ ...p, read: !p.read }))}
        >
          {progress.read ? '✓ নোট পড়া শেষ' : 'নোট পড়া শেষ করেছি'}
        </button>
        <Link className="btn btn-ghost" to={`/${subject.id}/${chapter.id}/lab`}>
          এবার ল্যাবে যাও →
        </Link>
      </div>
      <Quiz
        key={chapter.id}
        questions={chapter.quiz}
        best={progress.quizBest}
        onFinish={(score) => update((p) => ({ ...p, quizBest: Math.max(p.quizBest ?? 0, score) }))}
      />
    </>
  );
}

function LabSection({ subject, chapter, labId }: { subject: Subject; chapter: Chapter; labId?: string }) {
  const active = chapter.labs.find((l) => l.id === labId) ?? chapter.labs[0];
  const { update } = useProgress(chapterKey(subject.id, chapter.id));
  const { search } = useLocation();

  useEffect(() => {
    update((p) => (p.labs?.includes(active.id) ? p : { ...p, labs: [...(p.labs ?? []), active.id] }));
  }, [active.id, update]);

  return (
    <div className="lab-section">
      {chapter.labs.length > 1 && (
        <div className="lab-picker" role="navigation" aria-label="ল্যাব বাছাই">
          {chapter.labs.map((l) => (
            <Link
              key={l.id}
              to={`/${subject.id}/${chapter.id}/lab/${l.id}`}
              className={l.id === active.id ? 'lab-pick active' : 'lab-pick'}
              aria-current={l.id === active.id ? 'true' : undefined}
            >
              <strong>{l.title}</strong>
              <span>{l.blurb}</span>
            </Link>
          ))}
        </div>
      )}
      {/* A deep link such as ?try=golgi is read once, so a new link must start the lab afresh. */}
      <LabHost key={active.id + search} lab={active} />
    </div>
  );
}

function LabHost({ lab }: { lab: LabDef }) {
  const Component = useMemo(() => lazy(lab.load), [lab]);
  return (
    <section aria-label={lab.title}>
      <h2 className="lab-title">{lab.title}</h2>
      <p className="lab-blurb">{lab.blurb}</p>
      <Suspense fallback={<div className="stage stage-loading">ল্যাব প্রস্তুত হচ্ছে…</div>}>
        <Component />
      </Suspense>
    </section>
  );
}
