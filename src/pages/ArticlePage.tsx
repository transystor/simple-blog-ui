import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import type { Article } from '../types';
import eyeIcon from '../../public/eye.png';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    api.getArticle(slug).then(setArticle);
    api.registerArticleView(slug, auth.getVisitorId()).catch(() => undefined);
  }, [slug]);

  if (!article) return <div className="card">Грузим...</div>;

  return (
    <article className="card stack article-page-card">
      <div>
        <h1 className="article-title">{article.title}</h1>
        <p className="muted">{article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'Draft'}</p>
      </div>
      <div className="article-content" style={{ lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: article.content }} />
      <div className="article-views-badge muted">
        <img src={eyeIcon} alt="Просмотры" className="article-views-icon" />
        <span>{article.uniqueViews}</span>
      </div>
    </article>
  );
}
