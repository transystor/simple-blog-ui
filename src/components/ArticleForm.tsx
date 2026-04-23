import { FormEvent, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { Article } from '../types';
import { api } from '../lib/api';
import { auth } from '../lib/auth';

type ArticleDraft = Partial<Article>;

type ImageFormat = {
  src: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
};

function normalizeImageHtml(html: string) {
  if (typeof document === 'undefined') return html;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  wrapper.querySelectorAll('img').forEach(node => {
    const img = node as HTMLImageElement;
    img.style.maxWidth = '100%';
    img.style.height = img.style.height || 'auto';
    img.style.display = 'block';

    const marginLeft = img.style.marginLeft;
    const marginRight = img.style.marginRight;

    if ((marginLeft === '0px' || marginLeft === '0') && marginRight === 'auto') {
      img.dataset.align = 'left';
      img.style.marginLeft = '0';
      img.style.marginRight = 'auto';
    } else if (marginLeft === 'auto' && (marginRight === '0px' || marginRight === '0')) {
      img.dataset.align = 'right';
      img.style.marginLeft = 'auto';
      img.style.marginRight = '0';
    } else {
      img.dataset.align = 'center';
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
  const [selectedImage, setSelectedImage] = useState<ImageFormat | null>(null);
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
    }
  }), []);

  function readEditorHtml() {
    return quillRef.current?.getEditor().root.innerHTML || content;
  }

  function replaceSelectedImage(format: ImageFormat) {
    if (typeof document === 'undefined') return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = readEditorHtml();

    const img = Array.from(wrapper.querySelectorAll('img')).find(node => (node as HTMLImageElement).src === format.src) as HTMLImageElement | undefined;
    if (!img) return;

    if (format.width?.trim()) {
      img.style.width = /^\d+$/.test(format.width.trim()) ? `${format.width.trim()}px` : format.width.trim();
    } else {
      img.style.removeProperty('width');
    }

    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';

    const align = format.align || 'center';
    img.dataset.align = align;
    if (align === 'left') {
      img.style.marginLeft = '0';
      img.style.marginRight = 'auto';
    } else if (align === 'right') {
      img.style.marginLeft = 'auto';
      img.style.marginRight = '0';
    } else {
      img.style.marginLeft = 'auto';
      img.style.marginRight = 'auto';
    }

    const updatedHtml = wrapper.innerHTML;
    setContent(updatedHtml);
    setSelectedImage({
      src: format.src,
      width: img.style.width,
      align
    });
  }

  function syncSelectedImageFromClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    if (target?.tagName !== 'IMG') {
      return;
    }

    const image = target as HTMLImageElement;
    setSelectedImage({
      src: image.src,
      width: image.style.width || '',
      align: (image.dataset.align as 'left' | 'center' | 'right') || 'center'
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const currentContent = normalizeImageHtml(readEditorHtml());
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

      {selectedImage && (
        <div className="card image-settings-panel">
          <div className="muted">Настройки выбранной картинки</div>
          <div className="image-settings-grid">
            <input
              className="input"
              value={selectedImage.width || ''}
              onChange={e => setSelectedImage({ ...selectedImage, width: e.target.value })}
              placeholder="Ширина, например 300px или 50%"
            />
            <div className="row image-align-buttons">
              <button type="button" className={`button secondary ${selectedImage.align === 'left' ? 'active' : ''}`} onClick={() => setSelectedImage({ ...selectedImage, align: 'left' })}>Слева</button>
              <button type="button" className={`button secondary ${selectedImage.align === 'center' ? 'active' : ''}`} onClick={() => setSelectedImage({ ...selectedImage, align: 'center' })}>По центру</button>
              <button type="button" className={`button secondary ${selectedImage.align === 'right' ? 'active' : ''}`} onClick={() => setSelectedImage({ ...selectedImage, align: 'right' })}>Справа</button>
              <button type="button" className="button" onClick={() => replaceSelectedImage(selectedImage)}>Применить</button>
            </div>
          </div>
        </div>
      )}

      <div className="editor-shell" onClick={syncSelectedImageFromClick}>
        <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} />
      </div>
      <div className="form-actions">
        <button className="button" type="submit">Сохранить</button>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  );
}
