import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Article } from '../types';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    api.getArticle(slug).then(setArticle);
  }, [slug]);

  if (!article) return <div className="card">Loading article...</div>;

  return (
    <article className="card stack">
      <div>
        <h1 className="article-title">{article.title}</h1>
        <p className="muted">{article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'Draft'}</p>
      </div>
      <p>{article.summary}</p>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{article.content}</div>
    </article>
  );
}
