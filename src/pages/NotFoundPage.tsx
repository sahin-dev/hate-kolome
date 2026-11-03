import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page">
      <h1 className="page-title">পাতাটি পাওয়া যায়নি</h1>
      <p className="lede">ঠিকানাটি ভুল হতে পারে।</p>
      <Link className="btn btn-primary" to="/">
        শুরুর পাতায় যাও
      </Link>
    </div>
  );
}
