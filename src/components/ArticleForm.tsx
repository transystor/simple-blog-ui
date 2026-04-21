import { FormEvent, useState } from 'react';
import type { Article } from '../types';

type ArticleDraft = Partial<Article>;

export function ArticleForm({
  initialValue,
  onSubmit,
  onCancel
}: {
  initialValue?: ArticleDraft;
  onSubmit: (value: ArticleDraft) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialValue?.title || '');
  const [summary, setSummary] = useState(initialValue?.summary || '');
  const [slug, setSlug] = useState(initialValue?.slug || '');
  const [content, setContent] = useState(initialValue?.content || '');
  const [status, setStatus] = useState<string>(String(initialValue?.status ?? 0));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      title,
      summary,
      slug,
      content,
      status: Number(status)
    });
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <input className="input" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary" />
      <input className="input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug (optional)" />
      <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="0">Draft</option>
        <option value="1">Published</option>
      </select>
      <textarea className="textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="Content" />
      <div className="row">
        <button className="button" type="submit">Save</button>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
