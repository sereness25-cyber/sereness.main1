"use client";

import Link from "next/link";
import { useState } from "react";
import type { Brief, Outline } from "@/lib/ai/schemas";
import { callAi } from "./aiClient";
import { Field, Panel, btnPrimary, btnSecondary, input } from "./ui";

type BodyResult = { content: string; excerpt: string; fact_check: string[]; articleId: string; slug: string };
type SeoResult = { seo_title: string; seo_description: string; instagram: string; x: string; related: { slug: string; title: string }[] };
type ImageResult = { id: string; url: string; alt: string };

const STEPS = ["テーマ入力", "構成を作る", "構成を確認", "本文を作る", "SEO情報", "画像", "確認して編集へ"];

export function AiWriter({ categories, demo }: { categories: string[]; demo: boolean }) {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<Brief>({ theme: "", category: "", target: "", tone: "親しみやすい", length: 2000, keyword: "", notes: "", imageStyle: "auto" });
  const [outline, setOutline] = useState<Outline | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState<BodyResult | null>(null);
  const [seo, setSeo] = useState<SeoResult | null>(null);
  const [image, setImage] = useState<ImageResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run<T>(label: string, fn: () => Promise<T>, next?: number) {
    if (busy) return; // 二重送信防止
    setBusy(label);
    setError("");
    try {
      const r = await fn();
      if (next !== undefined) setStep(next);
      return r;
    } catch (e) {
      setError(e instanceof Error ? e.message : "失敗しました。");
    } finally {
      setBusy(null);
    }
  }

  const b = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((s) => ({ ...s, [k]: v }));
  const editSection = (i: number, patch: Partial<Outline["sections"][number]>) =>
    setOutline((o) => o && { ...o, sections: o.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap gap-1.5 text-xs">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-full px-3 py-1.5 ${i === step ? "bg-navy text-white" : i < step ? "bg-[#dff0e4] text-[#1f6b3a]" : "bg-white text-muted"}`}>
            STEP {i + 1}：{s}
          </li>
        ))}
      </ol>
      {demo && <p className="rounded-xl bg-white px-4 py-3 text-sm">デモモードのためAIは動きません。画面の流れだけ確認できます。</p>}
      {error && <p role="alert" className="rounded-xl bg-[#fbecee] px-4 py-3 text-sm text-[#8a1c30]">{error}</p>}
      {busy && <p role="status" className="rounded-xl bg-white px-4 py-3 text-sm">{busy}…（1〜2分かかることがあります）</p>}

      {step <= 1 && (
        <Panel title="記事の条件">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Field label="テーマ" required><textarea value={brief.theme} onChange={(e) => b("theme", e.target.value)} rows={2} className={input} placeholder="例：川反で一人飲みデビューする人向けのガイド" /></Field></div>
            <Field label="カテゴリー">
              <select value={brief.category} onChange={(e) => b("category", e.target.value)} className={input}>
                <option value="">おまかせ</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="ターゲット（想定読者）"><input value={brief.target} onChange={(e) => b("target", e.target.value)} className={input} placeholder="例：秋田に転勤してきた30代" /></Field>
            <Field label="文章の雰囲気">
              <select value={brief.tone} onChange={(e) => b("tone", e.target.value)} className={input}>
                {["親しみやすい", "丁寧で落ち着いた", "ワクワクする", "しっとり大人っぽい"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label={`文字数（約${brief.length.toLocaleString()}文字）`}>
              <input type="range" min={1000} max={5000} step={500} value={brief.length} onChange={(e) => b("length", Number(e.target.value))} className="w-full accent-[#34445c]" />
            </Field>
            <Field label="SEOキーワード"><input value={brief.keyword} onChange={(e) => b("keyword", e.target.value)} className={input} placeholder="例：川反 一人飲み" /></Field>
            <Field label="画像スタイル">
              <select value={brief.imageStyle} onChange={(e) => b("imageStyle", e.target.value as Brief["imageStyle"])} className={input}>
                <option value="auto">おまかせ</option><option value="photo">実写風</option><option value="kawaii">大人かわいいイラスト</option><option value="watercolor">水彩イラスト</option><option value="magazine">雑誌風</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="参考情報（取材メモなど）" hint="店名・料金・日付など具体的な情報は、ここに書いたものだけをAIが使います。ないものは【要確認】として残ります。">
                <textarea value={brief.notes} onChange={(e) => b("notes", e.target.value)} rows={6} className={input} />
              </Field>
            </div>
          </div>
          <button
            type="button"
            disabled={!!busy || brief.theme.trim().length < 2 || demo}
            onClick={() => run("構成案を作っています", async () => {
              const o = await callAi<Outline>("outline", brief);
              setOutline(o);
              setTitle(o.titles[0] ?? "");
            }, 2)}
            className={`${btnPrimary} mt-5`}
          >
            構成案を作る
          </button>
        </Panel>
      )}

      {step === 2 && outline && (
        <Panel title="構成を確認・修正">
          <Field label="タイトル（候補から選ぶか、書き換えてください）">
            <div className="mb-2 space-y-1">
              {outline.titles.map((t) => (
                <label key={t} className="flex items-start gap-2 text-sm"><input type="radio" name="title" checked={title === t} onChange={() => setTitle(t)} className="mt-1" />{t}</label>
              ))}
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
          </Field>
          <div className="mt-4"><Field label="URLスラッグ"><input value={outline.slug} onChange={(e) => setOutline({ ...outline, slug: e.target.value })} className={input} /></Field></div>
          <div className="mt-4 space-y-3">
            {outline.sections.map((s, i) => (
              <div key={i} className="rounded-xl bg-ivory p-3">
                <div className="flex gap-2">
                  <span className="pt-2 text-xs font-bold text-muted">H2</span>
                  <input value={s.h2} onChange={(e) => editSection(i, { h2: e.target.value })} className={input} />
                  <button type="button" onClick={() => setOutline({ ...outline, sections: outline.sections.filter((_, j) => j !== i) })} className="shrink-0 px-2 text-xs text-[#b3263e]">削除</button>
                </div>
                <textarea value={s.h3.join("\n")} onChange={(e) => editSection(i, { h3: e.target.value.split("\n").filter(Boolean) })} rows={Math.max(2, s.h3.length)} className={`${input} mt-2 text-sm`} aria-label="H3（1行に1つ）" placeholder="H3（1行に1つ）" />
                <input value={s.memo} onChange={(e) => editSection(i, { memo: e.target.value })} className={`${input} mt-2 text-xs`} aria-label="メモ" />
              </div>
            ))}
            <button type="button" onClick={() => setOutline({ ...outline, sections: [...outline.sections, { h2: "", h3: [], memo: "" }] })} className={btnSecondary}>見出しを追加</button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setStep(1)} className={btnSecondary}>条件に戻る</button>
            <button
              type="button"
              disabled={!!busy || !title.trim()}
              onClick={() => run("本文を書いています", async () => setBody(await callAi<BodyResult>("body", { brief, title, slug: outline.slug, outline: outline.sections.filter((s) => s.h2.trim()) })), 3)}
              className={btnPrimary}
            >
              この構成で本文を作る
            </button>
          </div>
        </Panel>
      )}

      {step >= 3 && body && (
        <Panel title="本文（下書きとして保存済み）">
          {body.fact_check.length > 0 && (
            <div className="mb-4 rounded-xl bg-[#fdf1d8] p-4 text-sm">
              <p className="font-bold text-[#8a5a00]">公開前に確認が必要な事実</p>
              <ul className="mt-1 list-disc pl-5">{body.fact_check.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          )}
          <div className="article-body max-h-[50vh] overflow-y-auto rounded-xl bg-ivory p-4 text-sm" dangerouslySetInnerHTML={{ __html: body.content }} />
          {step === 3 && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => run("SEO情報とSNS投稿文を作っています", async () => setSeo(await callAi<SeoResult>("seo", { articleId: body.articleId, title, html: body.content, keyword: brief.keyword })), 4)}
              className={`${btnPrimary} mt-4`}
            >
              SEO情報を作る
            </button>
          )}
        </Panel>
      )}

      {step >= 4 && seo && (
        <Panel title="SEO情報・SNS投稿文">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs font-bold text-muted">SEOタイトル</dt><dd>{seo.seo_title}</dd></div>
            <div><dt className="text-xs font-bold text-muted">メタディスクリプション</dt><dd>{seo.seo_description}</dd></div>
            <div><dt className="text-xs font-bold text-muted">関連記事候補</dt><dd>{seo.related.length ? seo.related.map((r) => r.title).join("、") : "（公開済みの関連記事なし）"}</dd></div>
            <div><dt className="text-xs font-bold text-muted">Instagram</dt><dd><textarea readOnly value={seo.instagram} rows={5} className={`${input} text-xs`} /></dd></div>
            <div><dt className="text-xs font-bold text-muted">X</dt><dd><textarea readOnly value={seo.x} rows={3} className={`${input} text-xs`} /></dd></div>
          </dl>
          <p className="mt-2 text-xs text-muted">SEOタイトルと説明文は、編集画面の「SEO」タブで貼り付けて使えます。</p>
          {step === 4 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!!busy}
                onClick={() =>
                  run("アイキャッチ画像を作っています", async () =>
                    setImage(await callAi<ImageResult>("image", { action: "generate", prompt: `${title}。秋田・川反の記事のアイキャッチ。${brief.theme}`, style: brief.imageStyle, aspect: "16:9", alt: title })),
                  5)
                }
                className={btnPrimary}
              >
                アイキャッチ画像を作る
              </button>
              <button type="button" onClick={() => setStep(6)} className={btnSecondary}>画像は作らない</button>
            </div>
          )}
        </Panel>
      )}

      {step >= 5 && image && (
        <Panel title="アイキャッチ画像（AI生成）">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt} className="aspect-video w-full max-w-xl rounded-xl object-cover" />
          <p className="mt-2 text-xs text-muted">メディアライブラリに保存しました。編集画面の「アイキャッチ画像」から選べます。公開ページでは「イメージ画像」と表示されます。</p>
          {step === 5 && <button type="button" onClick={() => setStep(6)} className={`${btnPrimary} mt-4`}>次へ</button>}
        </Panel>
      )}

      {step === 6 && body && (
        <Panel title="編集・事実確認へ">
          <p className="text-sm leading-7">記事は<strong>下書き</strong>として保存されています。AIが書いた内容は自動では公開されません。編集画面で事実確認・プレビューを行い、問題がなければ公開または予約投稿してください。</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/articles/${body.articleId}`} className={btnPrimary}>編集画面を開く</Link>
            <Link href={`/admin/articles/${body.articleId}/preview`} target="_blank" className={btnSecondary}>プレビュー</Link>
          </div>
        </Panel>
      )}
    </div>
  );
}
