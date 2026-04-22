import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Article } from '../types';

export function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getArticles()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card">Грузим...</div>;

  return (
    <div className="stack">
      {articles.map(article => (
        <Link key={article.id} to={`/articles/${article.slug}`} className="card">
          <h2 className="article-title">{article.title}</h2>
          <p>{article.summary}</p>
          <span className="muted">{article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'Draft'}</span>
        </Link>
      ))}
      {!articles.length && <div className="card">No published articles yet.</div>}
    </div>
  );
}
