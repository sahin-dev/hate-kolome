import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { subjects } from '../subjects';

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <path d="M16 3c7 5 10 11 10 16a10 10 0 0 1-20 0C6 14 9 8 16 3Z" fill="#7fd1a0" />
              <path d="M16 27V12M16 18l5-4M16 22l-5-4" stroke="#14322a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          হাতেকলমে
        </Link>
        <nav className="topnav" aria-label="বিষয়">
          {subjects.map((s) => (
            <NavLink key={s.id} to={`/${s.id}`} className="topnav-link">
              {s.name}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        নবম-দশম শ্রেণির জীববিজ্ঞান পাঠ্যবইয়ের অধ্যায়ক্রম অনুসারে সাজানো সহায়ক পাঠ। পরীক্ষার প্রস্তুতিতে মূল পাঠ্যবইও পড়ো।
      </footer>
    </div>
  );
}
