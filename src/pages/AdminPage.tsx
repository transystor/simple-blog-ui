import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArticleForm } from '../components/ArticleForm';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import type { Article, SiteSettings } from '../types';

export function AdminPage() {
  const token = auth.getToken();
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setРедактироватьing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  async function load() {
    if (!token) return;
    const [items, settings] = await Promise.all([
      api.getAdminArticles(token),
      api.getSiteSettings()
    ]);
    setArticles(items);
    setSiteSettings(settings);
    setSettingsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (!token) return <Navigate to="/admin/login" replace />;

  return (
    <div className="stack">
      {!settingsLoading && siteSettings && (
        <div className="card stack">
          <h2 className="article-title">Настройки</h2>
          <input className="input" value={siteSettings.siteTitle} onChange={e => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })} placeholder="Site title" />
          <div className="site-links-stack">
            {siteSettings.headerLinks.map((link, index) => (
              <div key={index} className="site-link-row">
                <input
                  className="input"
                  value={link.label}
                  onChange={e => setSiteSettings({
                    ...siteSettings,
                    headerLinks: siteSettings.headerLinks.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item)
                  })}
                  placeholder="Link label"
                />
                <input
                  className="input"
                  value={link.url}
                  onChange={e => setSiteSettings({
                    ...siteSettings,
                    headerLinks: siteSettings.headerLinks.map((item, itemIndex) => itemIndex === index ? { ...item, url: e.target.value } : item)
                  })}
                  placeholder="Link URL"
                />
                <button
                  className="button danger icon-button"
                  type="button"
                  disabled={siteSettings.headerLinks.length === 1}
                  onClick={() => {
                    if (siteSettings.headerLinks.length === 1) return;
                    setSiteSettings({
                      ...siteSettings,
                      headerLinks: siteSettings.headerLinks.filter((_, itemIndex) => itemIndex !== index)
                    });
                  }}
                >−</button>
              </div>
            ))}
          </div>
          <div className="row">
            <button className="button" onClick={async () => { const updated = await api.updateSiteSettings(token, siteSettings); setSiteSettings(updated); setSaveMessage('Сохранено'); }}>Сохранить</button>
            <button className="button secondary icon-button" type="button" onClick={() => setSiteSettings({ ...siteSettings, headerLinks: [...siteSettings.headerLinks, { label: 'новая ссылка', url: '/' }] })}>+</button>
          </div>
          {saveMessage && <div className="muted">{saveMessage}</div>}
        </div>
      )}

      <div className="row">
        <button className="button" onClick={() => { setCreating(true); setРедактироватьing(null); }}>Новый пост</button>
        <button className="button secondary" onClick={() => { auth.clearToken(); window.location.href = '/admin/login'; }}>Выйти</button>
      </div>

      {(creating || editing) && (
        <ArticleForm
          initialValue={editing || undefined}
          onCancel={() => { setCreating(false); setРедактироватьing(null); }}
          onSubmit={async value => {
            if (editing) {
              await api.updateArticle(token, editing.id, value);
            } else {
              await api.createArticle(token, value);
            }
            setCreating(false);
            setРедактироватьing(null);
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
                <button className="button secondary" onClick={() => { setРедактироватьing(article); setCreating(false); }}>Редактировать</button>
                <button className="button danger" onClick={async () => { await api.deleteArticle(token, article.id); await load(); }}>Удалить</button>
              </div>
            </div>
            <p>{article.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
