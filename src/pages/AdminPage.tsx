import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArticleForm } from '../components/ArticleForm';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import type { Article, SiteSettings } from '../types';

export function AdminPage() {
  const token = auth.getToken();
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ siteTitle: 'Simple Blog', navigationLabel: 'Blog', updatedAt: new Date().toISOString() });

  async function load() {
    if (!token) return;
    const [items, settings] = await Promise.all([
      api.getAdminArticles(token),
      api.getSiteSettings()
    ]);
    setArticles(items);
    setSiteSettings(settings);
  }

  useEffect(() => {
    load();
  }, []);

  if (!token) return <Navigate to="/admin/login" replace />;

  return (
    <div className="stack">
      <div className="card stack">
        <h2 className="article-title">Site settings</h2>
        <input className="input" value={siteSettings.siteTitle} onChange={e => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })} placeholder="Site title" />
        <input className="input" value={siteSettings.navigationLabel} onChange={e => setSiteSettings({ ...siteSettings, navigationLabel: e.target.value })} placeholder="Navigation label" />
        <div className="row">
          <button className="button" onClick={async () => { const updated = await api.updateSiteSettings(token, siteSettings); setSiteSettings(updated); }}>Save branding</button>
        </div>
      </div>

      <div className="row">
        <button className="button" onClick={() => { setCreating(true); setEditing(null); }}>New article</button>
        <button className="button secondary" onClick={() => { auth.clearToken(); window.location.href = '/admin/login'; }}>Logout</button>
      </div>

      {(creating || editing) && (
        <ArticleForm
          initialValue={editing || undefined}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSubmit={async value => {
            if (editing) {
              await api.updateArticle(token, editing.id, value);
            } else {
              await api.createArticle(token, value);
            }
            setCreating(false);
            setEditing(null);
            await load();
          }}
        />
      )}

      <div className="stack">
        {articles.map(article => (
          <div key={article.id} className="card stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h2 className="article-title">{article.title}</h2>
                <div className="muted">{article.slug} · {String(article.status)}</div>
              </div>
              <div className="row">
                <button className="button secondary" onClick={() => { setEditing(article); setCreating(false); }}>Edit</button>
                <button className="button danger" onClick={async () => { await api.deleteArticle(token, article.id); await load(); }}>Delete</button>
              </div>
            </div>
            <p>{article.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
