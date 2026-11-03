import { Link } from 'react-router-dom';
import { subjects } from '../subjects';
import { chapterKey, chapterPercent, useAllProgress } from '../core/progress';
import { bn } from '../core/util';

const FEATURED = [
  {
    to: '/biology/ch02/lab/cell',
    title: 'কোষের ভেতরে ঢোকো',
    text: 'প্রতিটি অঙ্গাণু ছুঁয়ে দেখো, একটি বন্ধ করে দাও, আর প্রোটিন তৈরির পুরো যাত্রা অনুসরণ করো।',
    art: 'cell',
  },
  {
    to: '/biology/ch03/lab/mitosis',
    title: 'কোষ বিভাজন নিজের হাতে চালাও',
    text: 'সময়রেখা টেনে মাইটোসিসের প্রতিটি মুহূর্ত দেখো, মিয়োসিসে নিজেই ক্রসিং ওভার ঘটাও।',
    art: 'division',
  },
  {
    to: '/biology/ch04/lab/plant',
    title: 'গাছের খাদ্য কারখানা চালাও',
    text: 'আলো নেভাও, পানি বন্ধ করো, পত্ররন্ধ্র খোলো। কেন খাদ্য তৈরি থামে, নিজেই ধরো।',
    art: 'leaf',
  },
];

function FeatureArt({ kind }: { kind: string }) {
  if (kind === 'cell') {
    return (
      <svg viewBox="0 0 200 120" aria-hidden="true">
        <ellipse cx="100" cy="60" rx="88" ry="52" fill="#f6e3a8" stroke="#e9a23b" strokeWidth="3" />
        <circle cx="74" cy="56" r="24" fill="#c9a6e4" stroke="#7a4fa8" strokeWidth="2.5" />
        <circle cx="78" cy="52" r="8" fill="#7a4fa8" />
        <ellipse cx="136" cy="40" rx="18" ry="9" fill="#ef8d6a" stroke="#c0492b" strokeWidth="2" transform="rotate(-20 136 40)" />
        <ellipse cx="140" cy="82" rx="16" ry="8" fill="#ef8d6a" stroke="#c0492b" strokeWidth="2" transform="rotate(16 140 82)" />
      </svg>
    );
  }
  if (kind === 'division') {
    return (
      <svg viewBox="0 0 200 120" aria-hidden="true">
        <ellipse cx="62" cy="60" rx="50" ry="46" fill="#cfe9dd" stroke="#2f7d4f" strokeWidth="3" />
        <ellipse cx="138" cy="60" rx="50" ry="46" fill="#cfe9dd" stroke="#2f7d4f" strokeWidth="3" />
        <g stroke="#e4572e" strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M52 40l14 16-14 16" />
          <path d="M148 40l-14 16 14 16" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true">
      <circle cx="166" cy="26" r="16" fill="#f4c04e" />
      <path d="M24 100C40 40 110 18 160 40 150 90 90 118 24 100Z" fill="#4fae72" stroke="#1f6b3f" strokeWidth="3" />
      <path d="M24 100 150 46M70 82 66 54M100 70 94 42M90 76 124 88" stroke="#1f6b3f" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

export function HomePage() {
  const all = useAllProgress();
  const biology = subjects[0];
  const totals = biology.chapters.map((c) => chapterPercent(all[chapterKey(biology.id, c.id)], c.labs.length));
  const started = biology.chapters.find((_, i) => totals[i] > 0 && totals[i] < 100);

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">নবম ও দশম শ্রেণি</p>
        <h1>বিজ্ঞান মুখস্থ নয়, হাতে-কলমে করে দেখার জিনিস।</h1>
        <p className="lede">
          প্রতিটি অধ্যায়ে গোছানো নোট আর একটি ল্যাব। পড়ো, তারপর নিজের হাতে চালিয়ে দেখো জীবন কীভাবে কাজ করে।
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to={started ? `/biology/${started.id}` : '/biology'}>
            {started ? `চালিয়ে যাও: ${started.title}` : 'জীববিজ্ঞান শুরু করো'}
          </Link>
          <Link className="btn btn-ghost" to="/biology/ch02/lab/cell">
            সরাসরি ল্যাবে যাও
          </Link>
        </div>
      </section>

      <section aria-labelledby="featured">
        <h2 id="featured" className="section-title">
          এই তিনটি ল্যাব দিয়ে শুরু করো
        </h2>
        <div className="feature-grid">
          {FEATURED.map((f) => (
            <Link key={f.to} to={f.to} className="feature">
              <div className="feature-art">
                <FeatureArt kind={f.art} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="subjects">
        <h2 id="subjects" className="section-title">
          বিষয়
        </h2>
        <div className="subject-grid">
          {subjects.map((s) =>
            s.status === 'live' ? (
              <Link key={s.id} to={`/${s.id}`} className="subject" style={{ borderTopColor: s.accent }}>
                <h3>{s.name}</h3>
                <p>{s.tagline}</p>
                <span className="subject-meta">{bn(s.chapters.length)}টি অধ্যায়</span>
              </Link>
            ) : (
              <div key={s.id} className="subject subject-soon" style={{ borderTopColor: s.accent }}>
                <h3>{s.name}</h3>
                <p>{s.tagline}</p>
                <span className="subject-meta">শিগগিরই আসছে</span>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
