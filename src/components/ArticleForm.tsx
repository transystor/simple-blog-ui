import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { Article } from '../types';
import { api } from '../lib/api';
import { auth } from '../lib/auth';

type ArticleDraft = Partial<Article>;
type ImageAlign = 'left' | 'center' | 'right';

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
  const [imageWidth, setImageWidth] = useState('');
  const [imageAlign, setImageAlign] = useState<ImageAlign>('center');
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const quillRef = useRef<ReactQuill | null>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);

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

    function clearSelection() {
      root.querySelectorAll('img').forEach(img => img.classList.remove('editor-image-selected'));
      selectedImageRef.current = null;
      setPopoverPosition(null);
      setImageWidth('');
      setImageAlign('center');
    }

    function updatePopoverForImage(image: HTMLImageElement) {
      const editorRect = root.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      setPopoverPosition({
        top: imageRect.top - editorRect.top + root.scrollTop - 56,
        left: Math.max(12, imageRect.left - editorRect.left + root.scrollLeft)
      });
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'IMG') {
        const image = target as HTMLImageElement;
        root.querySelectorAll('img').forEach(img => img.classList.remove('editor-image-selected'));
        image.classList.add('editor-image-selected');
        selectedImageRef.current = image;
        setImageWidth(image.style.width || '');
        setImageAlign((image.dataset.align as ImageAlign) || 'center');
        updatePopoverForImage(image);
      } else if (!(target?.closest('.image-popover'))) {
        clearSelection();
      }
    };

    const handleScroll = () => {
      if (selectedImageRef.current) {
        updatePopoverForImage(selectedImageRef.current);
      }
    };

    root.addEventListener('click', handleClick);
    root.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  function applyImageSettings() {
    const image = selectedImageRef.current;
    if (!image) return;

    const normalizedWidth = imageWidth.trim();
    if (!normalizedWidth) {
      image.style.removeProperty('width');
      image.removeAttribute('width');
    } else {
      const finalWidth = /^\d+$/.test(normalizedWidth) ? `${normalizedWidth}px` : normalizedWidth;
      image.style.width = finalWidth;
      image.style.height = 'auto';
      image.removeAttribute('width');
    }

    image.dataset.align = imageAlign;
    image.style.display = 'block';

    if (imageAlign === 'left') {
      image.style.marginLeft = '0';
      image.style.marginRight = 'auto';
    } else if (imageAlign === 'right') {
      image.style.marginLeft = 'auto';
      image.style.marginRight = '0';
    } else {
      image.style.marginLeft = 'auto';
      image.style.marginRight = 'auto';
    }

    setContent(quillRef.current?.getEditor().root.innerHTML || content);
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
      <div className="editor-shell editor-shell-popover">
        {popoverPosition && (
          <div className="image-popover" style={{ top: `${popoverPosition.top}px`, left: `${popoverPosition.left}px` }}>
            <input
              className="input"
              value={imageWidth}
              onChange={e => setImageWidth(e.target.value)}
              placeholder="300px или 50%"
            />
            <div className="image-popover-align">
              <button className={`button secondary ${imageAlign === 'left' ? 'active' : ''}`} type="button" onClick={() => setImageAlign('left')}>Слева</button>
              <button className={`button secondary ${imageAlign === 'center' ? 'active' : ''}`} type="button" onClick={() => setImageAlign('center')}>По центру</button>
              <button className={`button secondary ${imageAlign === 'right' ? 'active' : ''}`} type="button" onClick={() => setImageAlign('right')}>Справа</button>
            </div>
            <button className="button" type="button" onClick={applyImageSettings}>Применить</button>
          </div>
        )}
        <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} />
      </div>
      <div className="form-actions">
        <button className="button" type="submit">Сохранить</button>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  );
}
