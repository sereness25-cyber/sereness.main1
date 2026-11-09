"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { Article, Category } from "@/lib/types";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import { saveArticle, deleteArticle, type ArticleInput } from "@/app/admin/_actions/articles";
import { RichEditor, type EmbedOption } from "./RichEditor";
import { MediaPicker } from "./MediaPicker";
import { SeoPanel } from "./SeoPanel";
import { RewriteDialog } from "./RewriteDialog";
import { Field, Panel, StatusPill, btnDanger, btnPrimary, btnSecondary, input } from "./ui";

type Props = {
  article: Article | null;
  categories: Category[];
  shops: { id: string; slug: string; name: string }[];
  articles: EmbedOption[];
  demo: boolean;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string | null;
  thumbnail_alt: string;
  thumbnail_is_ai: boolean;
  status: Article["status"];
  publishedLocal: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  is_featured: boolean;
  is_sponsored: boolean;
  category_ids: string[];
  tags: string;
  shop_ids: string[];
};

const AUTOSAVE_MS = 30_000;

function fromArticle(a: Article | null): FormState {
  return {
    title: a?.title ?? "",
    slug: a?.slug ?? "",
    excerpt: a?.excerpt ?? "",
    content: a?.content ?? "",
    thumbnail: a?.thumbnail ?? null,
    thumbnail_alt: a?.thumbnail_alt ?? "",
    thumbnail_is_ai: a?.thumbnail_is_ai ?? false,
    status: a?.status ?? "draft",
    publishedLocal: toLocalInput(a?.published_at),
    seo_title: a?.seo_title ?? "",
    seo_description: a?.seo_description ?? "",
    focus_keyword: a?.focus_keyword ?? "",
    is_featured: a?.is_featured ?? false,
    is_sponsored: a?.is_sponsored ?? false,
    category_ids: a?.categories.map((c) => c.id) ?? [],
    tags: a?.tags.map((t) => t.name).join("、") ?? "",
    shop_ids: a?.shop_ids ?? [],
  };
}

function toInput(id: string | undefined, f: FormState, status = f.status): ArticleInput {
  return {
    id,
    title: f.title,
    slug: f.slug,
    content: f.content,
    excerpt: f.excerpt,
    thumbnail: f.thumbnail,
    thumbnail_alt: f.thumbnail_alt,
    thumbnail_is_ai: f.thumbnail_is_ai,
    status,
    published_at: fromLocalInput(f.publishedLocal),
    seo_title: f.seo_title,
    seo_description: f.seo_description,
    focus_keyword: f.focus_keyword,
    is_featured: f.is_featured,
    is_sponsored: f.is_sponsored,
    category_ids: f.category_ids,
    tag_names: f.tags.split(/[、,，\s]+/).map((t) => t.trim()).filter(Boolean),
    shop_ids: f.shop_ids,
  };
}

export function ArticleEditor({ article, categories, shops, articles, demo }: Props) {
  const router = useRouter();
  const [id, setId] = useState<string | undefined>(article && !article.is_sample ? article.id : undefined);
  const [f, setF] = useState<FormState>(() => fromArticle(article));
  const [savedStatus, setSavedStatus] = useState<Article["status"]>(article?.status ?? "draft");
  const [savedPublishedAt, setSavedPublishedAt] = useState<string | null>(article?.published_at ?? null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const [tab, setTab] = useState<"settings" | "seo">("settings");
  const [picker, setPicker] = useState(false);
  const [rewrite, setRewrite] = useState<{ source: string; isHtml: boolean; from?: number; to?: number } | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const savingRef = useRef(false);

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    setDirty(true);
  }, []);

  const save = useCallback(
    async (status: Article["status"], opts: { auto?: boolean } = {}) => {
      if (savingRef.current) return false;
      if (demo) {
        if (!opts.auto) setNote({ kind: "error", text: "デモモードのため保存できません。" });
        return false;
      }
      savingRef.current = true;
      setSaving(true);
      try {
        const res = await saveArticle(toInput(id, f, status));
        if (!res.ok) {
          setNote({ kind: "error", text: opts.auto ? `自動保存に失敗しました：${res.error}` : res.error });
          return false;
        }
        const d = res.data!;
        setDirty(false);
        setSavedStatus(d.status as Article["status"]);
        setSavedPublishedAt(d.published_at ?? null);
        setF((s) => ({ ...s, status: d.status as Article["status"], slug: d.slug ?? s.slug, publishedLocal: toLocalInput(d.published_at) }));
        const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
        setNote({ kind: "ok", text: opts.auto ? `自動保存しました（${time}）` : `保存しました（${time}）` });
        if (!id) {
          setId(d.id);
          router.replace(`/admin/articles/${d.id}`);
        }
        return true;
      } catch {
        setNote({ kind: "error", text: "通信エラーのため保存できませんでした。接続を確認してください。" });
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [demo, f, id, router],
  );

  // 自動保存：下書きだけをサーバーに保存。公開中の記事は誤って公開内容が変わらないよう端末内にだけ控える
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      if (savedStatus === "draft") save("draft", { auto: true });
      else {
        try {
          localStorage.setItem(`kb-article-backup-${id ?? "new"}`, JSON.stringify({ at: Date.now(), f }));
          setNote({ kind: "info", text: "公開中の記事は自動保存しません。編集内容はこの端末に一時保存しました。" });
        } catch {
          /* 端末に保存できなくても編集は続けられる */
        }
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [dirty, f, id, save, savedStatus]);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const shopOptions = useMemo(() => shops.map((s) => ({ slug: s.slug, label: s.name })), [shops]);
  const isLive = (savedStatus === "published" || savedStatus === "scheduled") && !!savedPublishedAt && new Date(savedPublishedAt) <= new Date();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <input
          value={f.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="記事タイトル"
          aria-label="記事タイトル"
          className="w-full rounded-2xl bg-white px-5 py-4 font-maru text-xl font-bold text-navy shadow-soft placeholder:text-[#bbb] focus:outline-none"
        />
        <Field label="導入文・概要" hint="記事の冒頭と、記事一覧のカードに表示されます（120文字程度）">
          <textarea value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={3} className={input} />
        </Field>
        <RichEditor
          initialHtml={f.content}
          onChange={(html) => set("content", html)}
          onReady={(e) => (editorRef.current = e)}
          shops={shopOptions}
          articles={articles}
          extraTools={(editor) => (
            <>
              <span className="mx-1 h-6 w-px bg-[#eee6dc]" />
              <button
                type="button"
                className="min-h-9 rounded-lg bg-rose/25 px-2.5 text-sm font-bold text-rose-deep hover:bg-rose/40"
                onClick={() => {
                  const { from, to, empty } = editor.state.selection;
                  if (empty) setRewrite({ source: editor.getHTML(), isHtml: true });
                  else setRewrite({ source: editor.state.doc.textBetween(from, to, "\n"), isHtml: false, from, to });
                }}
              >
                AIリライト
              </button>
            </>
          )}
        />
        <p className="text-xs text-muted">文章を選択して「AIリライト」を押すと選択部分だけ、選択しないと記事全体を書き換えます。</p>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel>
          <div className="flex items-center justify-between">
            <StatusPill status={savedStatus} publishedAt={savedPublishedAt} />
            <span className="text-xs text-muted">{saving ? "保存中…" : dirty ? "未保存の変更あり" : ""}</span>
          </div>
          {note && (
            <p role={note.kind === "error" ? "alert" : "status"} className={`mt-3 rounded-xl px-3 py-2 text-xs ${note.kind === "error" ? "bg-[#fbecee] text-[#8a1c30]" : note.kind === "ok" ? "bg-[#e8f3ec] text-[#1f6b3a]" : "bg-ivory text-navy"}`}>
              {note.text}
            </p>
          )}
          <div className="mt-4 grid gap-3">
            <Field label="公開設定">
              <select value={f.status} onChange={(e) => set("status", e.target.value as Article["status"])} className={input}>
                <option value="draft">下書き</option>
                <option value="published">公開</option>
                <option value="scheduled">予約公開</option>
                <option value="private">非公開</option>
              </select>
            </Field>
            {(f.status === "scheduled" || f.status === "published") && (
              <Field label={f.status === "scheduled" ? "公開日時（予約）" : "公開日時"} hint={f.status === "published" ? "空欄なら保存した時刻になります" : "この時刻を過ぎると自動で公開されます"}>
                <input type="datetime-local" value={f.publishedLocal} onChange={(e) => set("publishedLocal", e.target.value)} className={input} />
              </Field>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving} onClick={() => save(f.status === "draft" ? "draft" : f.status)} className={btnPrimary}>
                {f.status === "draft" ? "下書き保存" : f.status === "scheduled" ? "予約する" : f.status === "private" ? "非公開で保存" : isLive ? "更新する" : "公開する"}
              </button>
              {isLive && (
                <button type="button" disabled={saving} onClick={() => { set("status", "draft"); save("draft"); }} className={btnSecondary}>公開停止</button>
              )}
              {id && <Link href={`/admin/articles/${id}/preview`} target="_blank" className={btnSecondary}>プレビュー</Link>}
            </div>
            {f.status === "published" && !isLive && <p className="text-xs text-muted">AIで生成した内容は、事実確認を終えてから公開してください。</p>}
          </div>
        </Panel>

        <div className="flex rounded-full bg-white p-1 shadow-soft" role="tablist">
          {(["settings", "seo"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 rounded-full py-2 text-sm font-bold ${tab === t ? "bg-navy text-white" : "text-navy"}`}>
              {t === "settings" ? "記事の設定" : "SEO"}
            </button>
          ))}
        </div>

        {tab === "settings" ? (
          <Panel>
            <div className="grid gap-4">
              <Field label="URLスラッグ" hint="半角英小文字・数字・ハイフン。例：kawabata-guide">
                <input value={f.slug} onChange={(e) => set("slug", e.target.value)} className={input} />
              </Field>
              <div>
                <p className="mb-1 text-sm font-bold text-navy">アイキャッチ画像</p>
                {f.thumbnail ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.thumbnail} alt={f.thumbnail_alt} className="aspect-video w-full rounded-xl object-cover" />
                    <input value={f.thumbnail_alt} onChange={(e) => set("thumbnail_alt", e.target.value)} placeholder="画像の説明（alt）" className={input} />
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.thumbnail_is_ai} onChange={(e) => set("thumbnail_is_ai", e.target.checked)} />AI生成画像（「イメージ画像」と表示）</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPicker(true)} className={btnSecondary}>変更</button>
                      <button type="button" onClick={() => { set("thumbnail", null); set("thumbnail_alt", ""); }} className={btnSecondary}>外す</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPicker(true)} className={btnSecondary}>画像を選ぶ</button>
                    <Link href="/admin/images" className={btnSecondary}>AIで作る</Link>
                  </div>
                )}
              </div>
              <fieldset>
                <legend className="mb-1 text-sm font-bold text-navy">カテゴリー（複数可）</legend>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={f.category_ids.includes(c.id)}
                        onChange={(e) => set("category_ids", e.target.checked ? [...f.category_ids, c.id] : f.category_ids.filter((x) => x !== c.id))}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="タグ" hint="「、」かスペースで区切って入力">
                <input value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="初心者、一人飲み" className={input} />
              </Field>
              <fieldset>
                <legend className="mb-1 text-sm font-bold text-navy">この記事で紹介する店舗</legend>
                {shops.length ? (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {shops.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={f.shop_ids.includes(s.id)} onChange={(e) => set("shop_ids", e.target.checked ? [...f.shop_ids, s.id] : f.shop_ids.filter((x) => x !== s.id))} />
                        {s.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">店舗が登録されていません。</p>
                )}
              </fieldset>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />編集部おすすめ（注目記事）に表示</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_sponsored} onChange={(e) => set("is_sponsored", e.target.checked)} />広告・タイアップ記事（「PR」を表示）</label>
              {id && (
                <button
                  type="button"
                  className={btnDanger}
                  onClick={async () => {
                    if (!window.confirm("この記事を削除します。元に戻せません。よろしいですか？")) return;
                    const r = await deleteArticle(id);
                    if (r.ok) router.replace("/admin/articles");
                    else setNote({ kind: "error", text: r.error });
                  }}
                >
                  記事を削除
                </button>
              )}
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="mb-4 grid gap-3">
              <Field label="フォーカスキーワード"><input value={f.focus_keyword} onChange={(e) => set("focus_keyword", e.target.value)} placeholder="例：川反 一人飲み" className={input} /></Field>
              <Field label="SEOタイトル" hint={`${[...f.seo_title].length}文字（空欄なら記事タイトル）`}><input value={f.seo_title} onChange={(e) => set("seo_title", e.target.value)} className={input} /></Field>
              <Field label="メタディスクリプション" hint={`${[...f.seo_description].length}文字`}><textarea value={f.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={3} className={input} /></Field>
            </div>
            <SeoPanel
              value={{ title: f.title, seoTitle: f.seo_title, seoDescription: f.seo_description, html: f.content, keyword: f.focus_keyword }}
              articleId={id}
              onApply={(p) => {
                if (p.seo_title) set("seo_title", p.seo_title);
                if (p.seo_description) set("seo_description", p.seo_description);
              }}
              onInsertRelated={(r) => editorRef.current?.chain().focus("end").insertEmbedCard("article", r.slug, r.title).run()}
            />
          </Panel>
        )}
      </aside>

      {picker && (
        <MediaPicker
          onClose={() => setPicker(false)}
          onSelect={(m) => {
            set("thumbnail", m.url);
            set("thumbnail_alt", m.alt);
            set("thumbnail_is_ai", m.source === "ai");
          }}
        />
      )}
      {rewrite && (
        <RewriteDialog
          source={rewrite.source}
          isHtml={rewrite.isHtml}
          keyword={f.focus_keyword}
          onClose={() => setRewrite(null)}
          onAccept={(text) => {
            const ed = editorRef.current;
            if (!ed) return;
            if (rewrite.isHtml) ed.commands.setContent(text, { emitUpdate: true });
            else ed.chain().focus().insertContentAt({ from: rewrite.from!, to: rewrite.to! }, text).run();
          }}
        />
      )}
    </div>
  );
}
