import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminPage } from './pages/AdminPage';
import { ArticlePage } from './pages/ArticlePage';
import { BlogPage } from './pages/BlogPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <Layout>
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
