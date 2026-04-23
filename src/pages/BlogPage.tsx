import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Article } from '../types';

export function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const activeTag = searchParams.get('tag') || '';

  useEffect(() => {
    setLoading(true);
    api.getArticles(activeTag || undefined)
      .then(setArticles)
      .finally(() => setLoading(false));
  }, [activeTag]);

  if (loading) return <div className="card">Грузим...</div>;

  return (
    <div className="stack">
      {activeTag && <div className="card">Фильтр по тегу: <strong>{activeTag}</strong></div>}
      {articles.map(article => (
        <Link key={article.id} to={`/articles/${article.slug}`} className="card">
          <h2 className="article-title">{article.title}</h2>
          <p>{article.summary}</p>
          <span className="muted">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Draft'}</span>
        </Link>
      ))}
      {!articles.length && <div className="card">Нет записей для этого фильтра.</div>}
    </div>
  );
}
