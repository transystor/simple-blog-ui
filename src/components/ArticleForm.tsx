import { FormEvent, useMemo, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import BlotFormatter from '@enzedonline/quill-blot-formatter2';
import 'react-quill/dist/quill.snow.css';
import type { Article } from '../types';
import { api } from '../lib/api';
import { auth } from '../lib/auth';

Quill.register('modules/blotFormatter2', BlotFormatter);

type ArticleDraft = Partial<Article>;

function normalizeEditorHtml(html: string) {
  if (typeof document === 'undefined') return html;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  wrapper.querySelectorAll('img').forEach(image => {
    const img = image as HTMLImageElement;
    img.style.maxWidth = '100%';
    img.style.height = img.style.height || 'auto';

    const floatValue = img.style.cssFloat || img.style.float;
    if (floatValue === 'left') {
      img.style.display = 'block';
      img.style.marginLeft = '0';
      img.style.marginRight = 'auto';
    } else if (floatValue === 'right') {
      img.style.display = 'block';
      img.style.marginLeft = 'auto';
      img.style.marginRight = '0';
    } else if (img.style.display === 'block') {
      img.style.marginLeft = 'auto';
      img.style.marginRight = 'auto';
    }

    img.style.removeProperty('float');
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
    blotFormatter2: {
      align: {
        allowAligning: true,
        alignments: ['left', 'center', 'right']
      },
      resize: {
        allowResizing: true,
        allowResizeModeChange: false,
        useRelativeSize: false,
        imageOversizeProtection: true,
        minimumWidthPx: 40
      },
      image: {
        allowAltTitleEdit: false,
        allowCompressor: false,
        autoHeight: true
      }
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
      <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Заголовок" />
      <input className="input" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Краткое описание" />
      <input className="input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug (необязательно)" />
      <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="0">Черновик</option>
        <option value="1">Опубликовано</option>
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
