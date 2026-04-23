import { FormEvent, useMemo, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';
import 'react-quill/dist/quill.snow.css';
import type { Article } from '../types';
import { api } from '../lib/api';
import { auth } from '../lib/auth';

Quill.register('modules/imageResize', ImageResize);

type ArticleDraft = Partial<Article>;

function normalizeEditorHtml(html: string) {
  if (typeof document === 'undefined') return html;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  wrapper.querySelectorAll('img').forEach(image => {
    const img = image as HTMLImageElement;
    img.style.display = 'block';
    img.style.maxWidth = '100%';
    img.style.height = img.style.height || 'auto';

    const marginLeft = img.style.marginLeft;
    const marginRight = img.style.marginRight;

    if ((marginLeft === '0px' || marginLeft === '0') && marginRight === 'auto') {
      img.style.marginLeft = '0';
      img.style.marginRight = 'auto';
    } else if (marginLeft === 'auto' && (marginRight === '0px' || marginRight === '0')) {
      img.style.marginLeft = 'auto';
      img.style.marginRight = '0';
    } else {
      img.style.marginLeft = 'auto';
      img.style.marginRight = 'auto';
    }
  });

  return wrapper.innerHTML;
}

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
  const quillRef = useRef<ReactQuill | null>(null);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'strike'],
        [{ color: [] }],
        ['link', 'image'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean']
      ],
      handlers: {
        image: async function imageHandler(this: unknown) {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files?.[0];
            const token = auth.getToken();
            if (!file || !token) return;

            const result = await api.uploadImage(token, file);
            const editor = quillRef.current?.getEditor();
            const range = editor?.getSelection(true);
            editor?.insertEmbed(range?.index ?? 0, 'image', `${window.location.origin}${result.url}`);
          };
        }
      }
    },
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    }
  }), []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const currentContent = normalizeEditorHtml(quillRef.current?.getEditor().root.innerHTML || content);
    setContent(currentContent);
    await onSubmit({
      title,
      summary,
      slug,
      content: currentContent,
      status: Number(status)
    });
  }

  return (
    <form className="card article-form" onSubmit={handleSubmit}>
      <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <input className="input" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary" />
      <input className="input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug (optional)" />
      <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="0">Draft</option>
        <option value="1">Published</option>
      </select>
      <div className="editor-shell">
        <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} />
      </div>
      <div className="form-actions">
        <button className="button" type="submit">Сохранить</button>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  );
}
