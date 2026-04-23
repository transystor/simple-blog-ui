import { FormEvent, useEffect, useMemo, useState } from 'react';
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, mergeAttributes, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import type { Article } from '../types';
import { api } from '../lib/api';
import { auth } from '../lib/auth';

type ArticleDraft = Partial<Article>;
type ImageAlign = 'left' | 'center' | 'right';

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      align: {
        default: 'center',
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const align = (HTMLAttributes.align as ImageAlign | undefined) || 'center';
    const width = HTMLAttributes.width as string | undefined;
    const styleParts = ['max-width:100%', 'height:auto', 'display:block'];

    if (width) styleParts.push(`width:${width}`);
    if (align === 'left') styleParts.push('margin-left:0', 'margin-right:auto');
    else if (align === 'right') styleParts.push('margin-left:auto', 'margin-right:0');
    else styleParts.push('margin-left:auto', 'margin-right:auto');

    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      style: styleParts.join(';')
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes, selected }) => {
      const [width, setWidth] = useState((node.attrs.width as string) || '');
      const align = (node.attrs.align as ImageAlign) || 'center';

      useEffect(() => {
        setWidth((node.attrs.width as string) || '');
      }, [node.attrs.width]);

      const applyWidth = () => {
        const normalized = width.trim();
        updateAttributes({ width: normalized ? (/^\d+$/.test(normalized) ? `${normalized}px` : normalized) : null });
      };

      return (
        <NodeViewWrapper className={`tiptap-image-node ${selected ? 'selected' : ''}`}>
          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            title={node.attrs.title || ''}
            style={{
              width: (node.attrs.width as string) || undefined,
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              marginLeft: align === 'left' ? '0' : 'auto',
              marginRight: align === 'right' ? '0' : 'auto',
            }}
          />
          {selected && (
            <div className="tiptap-image-controls">
              <input
                className="input"
                value={width}
                onChange={e => setWidth(e.target.value)}
                placeholder="300px или 50%"
              />
              <div className="row image-align-buttons">
                <button type="button" className={`button secondary ${align === 'left' ? 'active' : ''}`} onClick={() => updateAttributes({ align: 'left' })}>Слева</button>
                <button type="button" className={`button secondary ${align === 'center' ? 'active' : ''}`} onClick={() => updateAttributes({ align: 'center' })}>По центру</button>
                <button type="button" className={`button secondary ${align === 'right' ? 'active' : ''}`} onClick={() => updateAttributes({ align: 'right' })}>Справа</button>
                <button type="button" className="button" onClick={applyWidth}>Применить</button>
              </div>
            </div>
          )}
        </NodeViewWrapper>
      );
    });
  },
});

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
  const [status, setStatus] = useState<string>(String(initialValue?.status ?? 0));
  const [content, setContent] = useState(initialValue?.content || '');

  const extensions = useMemo(() => [
    StarterKit,
    TextStyle,
    Color,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    CustomImage.configure({ inline: false, allowBase64: false }),
    Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
    Placeholder.configure({ placeholder: 'Текст статьи...' })
  ], []);

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setContent(editor.getHTML())
  });

  useEffect(() => {
    if (editor && initialValue?.content !== undefined && editor.getHTML() !== (initialValue.content || '')) {
      editor.commands.setContent(initialValue.content || '', { emitUpdate: false });
      setContent(initialValue.content || '');
    }
  }, [editor, initialValue?.content]);

  async function insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      const token = auth.getToken();
      if (!file || !token || !editor) return;

      const result = await api.uploadImage(token, file);
      editor.chain().focus().setImage({ src: `${window.location.origin}${result.url}`, align: 'center' }).run();
    };
  }

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL ссылки', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      title,
      summary,
      slug,
      content: editor?.getHTML() || content,
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

      <div className="editor-shell tiptap-shell">
        <div className="tiptap-toolbar">
          <button type="button" className={`button secondary ${editor?.isActive('bold') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
          <button type="button" className={`button secondary ${editor?.isActive('italic') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" className={`button secondary ${editor?.isActive('strike') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleStrike().run()}>S</button>
          <button type="button" className={`button secondary ${editor?.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
          <button type="button" className={`button secondary ${editor?.isActive('orderedList') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
          <button type="button" className={`button secondary ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" className={`button secondary ${editor?.isActive('blockquote') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Цитата</button>
          <button type="button" className={`button secondary ${editor?.isActive('link') ? 'active' : ''}`} onClick={setLink}>Ссылка</button>
          <button type="button" className="button secondary" onClick={insertImage}>Картинка</button>
          <input type="color" className="color-input" onChange={e => editor?.chain().focus().setColor(e.target.value).run()} value="#111111" />
          <button type="button" className="button secondary" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>Очистить</button>
        </div>
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>

      <div className="form-actions">
        <button className="button" type="submit">Сохранить</button>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  );
}
