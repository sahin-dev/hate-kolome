import { Link, useParams } from 'react-router-dom';
import { findSubject } from '../subjects';
import { chapterKey, chapterPercent, useAllProgress } from '../core/progress';
import { bn } from '../core/util';
import { NotFoundPage } from './NotFoundPage';

export function SubjectPage() {
  const { subjectId } = useParams();
  const subject = findSubject(subjectId);
  const all = useAllProgress();

  if (!subject) return <NotFoundPage />;

  if (subject.status === 'soon') {
    return (
      <div className="page">
        <h1 className="page-title">{subject.name}</h1>
        <p className="lede">এই বিষয়ের অধ্যায় ও ল্যাব তৈরি হচ্ছে। ততক্ষণ জীববিজ্ঞান দিয়ে শুরু করো।</p>
        <Link className="btn btn-primary" to="/biology">
          জীববিজ্ঞানে যাও
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">{subject.name}</h1>
      <p className="lede">{subject.tagline}</p>
      <ol className="chapter-list">
        {subject.chapters.map((c) => {
          const percent = chapterPercent(all[chapterKey(subject.id, c.id)], c.labs.length);
          return (
            <li key={c.id}>
              <Link to={`/${subject.id}/${c.id}`} className="chapter-row">
                <span className="chapter-num">{bn(c.number)}</span>
                <span className="chapter-text">
                  <strong>{c.title}</strong>
                  <span>{c.tagline}</span>
                </span>
                <span className="chapter-side">
                  <span className="chip">{bn(c.labs.length)}টি ল্যাব</span>
                  <span className="minibar" role="img" aria-label={`${bn(percent)}% সম্পন্ন`}>
                    <span style={{ width: `${percent}%` }} />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
