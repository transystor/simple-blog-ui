import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { Article } from '../types';
import { api } from '../lib/api';
import { auth } from '../lib/auth';

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
  const quillRef = useRef<ReactQuill | null>(null);
  const [imageWidth, setImageWidth] = useState('');

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
        image: async function imageHandler(this: any) {
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
    }
  }), []);


  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const root = editor.root;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'IMG') {
        const image = target as HTMLImageElement;
        const currentWidth = image.style.width || (image.getAttribute('width') ? `${image.getAttribute('width')}px` : '');
        setImageWidth(currentWidth);
        root.querySelectorAll('img').forEach(img => img.classList.remove('editor-image-selected'));
        image.classList.add('editor-image-selected');
      } else {
        root.querySelectorAll('img').forEach(img => img.classList.remove('editor-image-selected'));
        setImageWidth('');
      }
    };

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, []);

  function applyImageWidth() {
    const editor = quillRef.current?.getEditor();
    const selectedImage = editor?.root.querySelector('img.editor-image-selected') as HTMLImageElement | null;
    if (!selectedImage) return;

    const normalized = imageWidth.trim();
    if (!normalized) {
      selectedImage.style.removeProperty('width');
      selectedImage.removeAttribute('width');
      return;
    }

    const finalWidth = /^\d+$/.test(normalized) ? `${normalized}px` : normalized;
    selectedImage.style.width = finalWidth;
    selectedImage.style.height = 'auto';
    selectedImage.removeAttribute('width');
  }

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
    <form className="card article-form" onSubmit={handleSubmit}>
      <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <input className="input" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary" />
      <input className="input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug (optional)" />
      <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="0">Draft</option>
        <option value="1">Published</option>
      </select>
      <div className="image-size-controls">
        <input className="input" value={imageWidth} onChange={e => setImageWidth(e.target.value)} placeholder="Ширина картинки, например 300px или 50%" />
        <button className="button secondary" type="button" onClick={applyImageWidth}>Применить размер</button>
      </div>
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
