import { FormEvent, useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
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
  const [status, setStatus] = useState<string>(String(initialValue?.status ?? 0));
  const [content, setContent] = useState(initialValue?.content || '');

  const extensions = useMemo(() => [
    StarterKit,
    TextStyle,
    Color,
    Image.configure({ inline: false, allowBase64: false }),
    Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
    Placeholder.configure({ placeholder: 'Текст статьи...' })
  ], []);

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    }
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
      editor.chain().focus().setImage({ src: `${window.location.origin}${result.url}` }).run();
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
