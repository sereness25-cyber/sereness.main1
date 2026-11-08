"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useState } from "react";
import { ArticleCardNode, Callout, EmbedCardCommands, ShopCard } from "./extensions";
import { MediaPicker } from "./MediaPicker";

export type EmbedOption = { slug: string; label: string };

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
  onReady?: (editor: Editor) => void;
  shops?: EmbedOption[];
  articles?: EmbedOption[];
  placeholder?: string;
  extraTools?: (editor: Editor) => React.ReactNode;
};

export function RichEditor({ initialHtml, onChange, onReady, shops = [], articles = [], placeholder = "本文を書きましょう…", extraTools }: Props) {
  const [picker, setPicker] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder }),
      Callout,
      ShopCard,
      ArticleCardNode,
      EmbedCardCommands,
    ],
    content: initialHtml,
    editorProps: { attributes: { class: "article-body tiptap px-4 py-3", "aria-label": "本文" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onCreate: ({ editor }) => onReady?.(editor),
  });

  if (!editor) return <div className="min-h-[420px] rounded-2xl bg-white" />;

  return (
    <div className="rounded-2xl bg-white shadow-soft">
      <Toolbar editor={editor} shops={shops} articles={articles} onImage={() => setPicker(true)} extra={extraTools?.(editor)} />
      <EditorContent editor={editor} />
      {picker && (
        <MediaPicker
          onClose={() => setPicker(false)}
          onSelect={(m) => editor.chain().focus().setImage({ src: m.url, alt: m.alt }).run()}
        />
      )}
    </div>
  );
}

function Toolbar({ editor, shops, articles, onImage, extra }: { editor: Editor; shops: EmbedOption[]; articles: EmbedOption[]; onImage: () => void; extra?: React.ReactNode }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      link: e.isActive("link"),
      ul: e.isActive("bulletList"),
      ol: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      callout: e.isActive("callout"),
      table: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const b = (active: boolean) => `min-h-9 min-w-9 rounded-lg px-2 text-sm ${active ? "bg-navy text-white" : "text-navy hover:bg-ivory"}`;
  const c = () => editor.chain().focus();

  return (
    <div className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-[#eee6dc] bg-white/95 p-2 backdrop-blur md:top-0" role="toolbar" aria-label="書式">
      <button type="button" className={b(s.h2)} onClick={() => c().toggleHeading({ level: 2 }).run()} aria-pressed={s.h2}>H2</button>
      <button type="button" className={b(s.h3)} onClick={() => c().toggleHeading({ level: 3 }).run()} aria-pressed={s.h3}>H3</button>
      <button type="button" className={b(s.h4)} onClick={() => c().toggleHeading({ level: 4 }).run()} aria-pressed={s.h4}>H4</button>
      <span className="mx-1 h-6 w-px bg-[#eee6dc]" />
      <button type="button" className={`${b(s.bold)} font-bold`} onClick={() => c().toggleBold().run()} aria-pressed={s.bold} aria-label="太字">B</button>
      <button type="button" className={`${b(s.italic)} italic`} onClick={() => c().toggleItalic().run()} aria-pressed={s.italic} aria-label="斜体">I</button>
      <button
        type="button"
        className={b(s.link)}
        aria-pressed={s.link}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("リンク先のURL（サイト内は /articles/... のように入力）", prev ?? "");
          if (url === null) return;
          if (!url) c().unsetLink().run();
          else c().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        リンク
      </button>
      <span className="mx-1 h-6 w-px bg-[#eee6dc]" />
      <button type="button" className={b(s.ul)} onClick={() => c().toggleBulletList().run()} aria-pressed={s.ul}>・箇条書き</button>
      <button type="button" className={b(s.ol)} onClick={() => c().toggleOrderedList().run()} aria-pressed={s.ol}>1. 番号</button>
      <button type="button" className={b(s.quote)} onClick={() => c().toggleBlockquote().run()} aria-pressed={s.quote}>引用</button>
      <button type="button" className={b(s.callout)} onClick={() => c().toggleCallout().run()} aria-pressed={s.callout}>注意書き</button>
      <span className="mx-1 h-6 w-px bg-[#eee6dc]" />
      <button type="button" className={b(false)} onClick={onImage}>画像</button>
      {s.table ? (
        <>
          <button type="button" className={b(false)} onClick={() => c().addRowAfter().run()}>行+</button>
          <button type="button" className={b(false)} onClick={() => c().addColumnAfter().run()}>列+</button>
          <button type="button" className={b(false)} onClick={() => c().deleteRow().run()}>行−</button>
          <button type="button" className={b(false)} onClick={() => c().deleteColumn().run()}>列−</button>
          <button type="button" className={b(false)} onClick={() => c().deleteTable().run()}>表を削除</button>
        </>
      ) : (
        <button type="button" className={b(false)} onClick={() => c().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}>表</button>
      )}
      <EmbedSelect label="店舗カード" options={shops} onPick={(o) => c().insertEmbedCard("shop", o.slug, o.label).run()} />
      <EmbedSelect label="記事カード" options={articles} onPick={(o) => c().insertEmbedCard("article", o.slug, o.label).run()} />
      <span className="mx-1 h-6 w-px bg-[#eee6dc]" />
      <button type="button" className={b(false)} disabled={!s.canUndo} onClick={() => c().undo().run()} aria-label="元に戻す">↶</button>
      <button type="button" className={b(false)} disabled={!s.canRedo} onClick={() => c().redo().run()} aria-label="やり直す">↷</button>
      {extra}
    </div>
  );
}

function EmbedSelect({ label, options, onPick }: { label: string; options: EmbedOption[]; onPick: (o: EmbedOption) => void }) {
  return (
    <select
      aria-label={`${label}を挿入`}
      value=""
      onChange={(e) => {
        const o = options.find((x) => x.slug === e.target.value);
        if (o) onPick(o);
      }}
      className="h-9 max-w-[9.5rem] rounded-lg border border-[#eee6dc] bg-white px-2 text-sm text-navy"
    >
      <option value="">{label}…</option>
      {options.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}
      {!options.length && <option disabled>登録がありません</option>}
    </select>
  );
}
