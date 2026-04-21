import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminPage } from './pages/AdminPage';
import { ArticlePage } from './pages/ArticlePage';
import { BlogPage } from './pages/BlogPage';
import { LoginPage } from './pages/LoginPage';
import { api } from './lib/api';
import type { SiteSettings } from './types';

export default function App() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    api.getSiteSettings().then(setSettings).catch(() => undefined);
  }, []);

  return (
    <Layout settings={settings}>
      <Routes>
        <Route path="/" element={<BlogPage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
