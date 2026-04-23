import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import type { Article } from '../types';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    api.getArticle(slug).then(setArticle);
    api.registerArticleView(slug, auth.getVisitorId()).catch(() => undefined);
  }, [slug]);

  if (!article) return <div className="card">Грузим...</div>;

  return (
    <article className="card stack">
      <div>
        <h1 className="article-title">{article.title}</h1>
        <p className="muted">{article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'Draft'}</p>
      </div>
      <div className="article-content" style={{ lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
