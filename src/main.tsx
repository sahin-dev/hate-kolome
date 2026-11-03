import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import '@fontsource/hind-siliguri/bengali-400.css';
import '@fontsource/hind-siliguri/bengali-500.css';
import '@fontsource/hind-siliguri/bengali-600.css';
import '@fontsource/hind-siliguri/bengali-700.css';
import '@fontsource/hind-siliguri/latin-400.css';
import '@fontsource/hind-siliguri/latin-600.css';
import './styles.css';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SubjectPage } from './pages/SubjectPage';
import { ChapterPage } from './pages/ChapterPage';
import { NotFoundPage } from './pages/NotFoundPage';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path=":subjectId" element={<SubjectPage />} />
          <Route path=":subjectId/:chapterId" element={<ChapterPage section="theory" />} />
          <Route path=":subjectId/:chapterId/lab" element={<ChapterPage section="lab" />} />
          <Route path=":subjectId/:chapterId/lab/:labId" element={<ChapterPage section="lab" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
