import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArticleForm } from '../components/ArticleForm';
import { ApiError, api } from '../lib/api';
import { auth } from '../lib/auth';
import type { Article, SiteSettings } from '../types';

function getStatusLabel(status: number) {
  return status === 1 ? 'Опубликовано' : 'Черновик';
}

export function AdminPage() {
  const token = auth.getToken();
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  function handleApiError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      auth.clearToken();
      setSessionExpired(true);
      return;
    }

    throw error;
  }

  async function loadArticles() {
    if (!token) return;
    try {
      const items = await api.getAdminArticles(token);
      setArticles(items);
    } catch (error) {
      handleApiError(error);
    }
  }

  async function loadSettings() {
    try {
      const settings = await api.getSiteSettings();
      setSiteSettings(settings);
    } catch (error) {
      handleApiError(error);
    }
  }

  useEffect(() => {
    if (!token) return;

    Promise.all([loadArticles(), loadSettings()]).finally(() => setLoading(false));
  }, [token]);

  if (!token || sessionExpired) return <Navigate to="/admin/login" replace />;
  if (loading) return <div className="card">Грузим...</div>;

  return (
    <div className="stack">
      {siteSettings && (
        <div className="card stack">
          <h2 className="article-title">Настройки</h2>
          <input
            className="input"
            value={siteSettings.siteTitle}
            onChange={e => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })}
            placeholder="Название сайта"
          />
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
                  placeholder="Текст кнопки"
                />
                <select
                  className="select"
                  value={link.type}
                  onChange={e => setSiteSettings({
                    ...siteSettings,
                    headerLinks: siteSettings.headerLinks.map((item, itemIndex) => itemIndex === index ? { ...item, type: e.target.value as 'url' | 'tag' } : item)
                  })}
                >
                  <option value="url">Ссылка</option>
                  <option value="tag">Тег</option>
                </select>
                <input
                  className="input site-link-priority"
                  type="number"
                  value={link.priority}
                  onChange={e => setSiteSettings({
                    ...siteSettings,
                    headerLinks: siteSettings.headerLinks.map((item, itemIndex) => itemIndex === index ? { ...item, priority: Number(e.target.value) || 0 } : item)
                  })}
                  placeholder="Приоритет"
                />
                <input
                  className="input"
                  value={link.value}
                  onChange={e => setSiteSettings({
                    ...siteSettings,
                    headerLinks: siteSettings.headerLinks.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item)
                  })}
                  placeholder={link.type === 'tag' ? 'Название тега' : 'URL ссылки'}
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
            <button
              className="button"
              onClick={async () => {
                try {
                  const updated = await api.updateSiteSettings(token, siteSettings);
                  setSiteSettings(updated);
                  setSaveMessage('Сохранено');
                } catch (error) {
                  handleApiError(error);
                }
              }}
            >
              Сохранить
            </button>
            <button
              className="button secondary icon-button"
              type="button"
              onClick={() => setSiteSettings({
                ...siteSettings,
                headerLinks: [...siteSettings.headerLinks, { label: 'новая кнопка', type: 'url', value: '/', priority: siteSettings.headerLinks.length }]
              })}
            >
              +
            </button>
          </div>
          {saveMessage && <div className="muted">{saveMessage}</div>}
        </div>
      )}

      <div className="row">
        <button className="button" onClick={() => { setCreating(true); setEditing(null); }}>Новый пост</button>
        <button className="button secondary" onClick={() => { auth.clearToken(); window.location.href = '/admin/login'; }}>Выйти</button>
      </div>

      {(creating || editing) && (
        <ArticleForm
          initialValue={editing || undefined}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSubmit={async value => {
            try {
              if (editing) {
                await api.updateArticle(token, editing.id, value);
              } else {
                await api.createArticle(token, value);
              }
              setCreating(false);
              setEditing(null);
              await loadArticles();
            } catch (error) {
              handleApiError(error);
            }
          }}
        />
      )}

      <div className="stack">
        {articles.map(article => (
          <div key={article.id} className="card stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h2 className="article-title">{article.title}</h2>
                <div className="muted">{article.slug} · {getStatusLabel(article.status)} · {article.uniqueViews} уник. / {article.totalViews} всего</div>
              </div>
              <div className="row">
                <button className="button secondary" onClick={() => { setEditing(article); setCreating(false); }}>Редактировать</button>
                <button className="button danger" onClick={async () => {
                  try {
                    await api.deleteArticle(token, article.id);
                    await loadArticles();
                  } catch (error) {
                    handleApiError(error);
                  }
                }}>Удалить</button>
              </div>
            </div>
            <p>{article.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
