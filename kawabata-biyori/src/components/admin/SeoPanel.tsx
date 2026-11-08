"use client";

import { useState } from "react";
import { scoreSeo, SEO_RANK_LABEL, type SeoInput } from "@/lib/seo-score";
import { callAi } from "./aiClient";
import { btnSecondary } from "./ui";

type Suggest = {
  seo_title: string;
  seo_description: string;
  related: { slug: string; title: string }[];
  instagram: string;
  x: string;
  suggestions: { area: string; advice: string }[];
};

const AREA: Record<string, string> = { title: "タイトル", headings: "見出し", intro: "導入文", internal_links: "内部リンク", meta: "メタ説明文" };

export function SeoPanel({
  value,
  articleId,
  onApply,
  onInsertRelated,
}: {
  value: SeoInput;
  articleId?: string;
  onApply: (p: { seo_title?: string; seo_description?: string }) => void;
  onInsertRelated: (r: { slug: string; title: string }) => void;
}) {
  const result = scoreSeo(value);
  const [ai, setAi] = useState<Suggest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const color = result.rank === "good" ? "#1f6b3a" : result.rank === "fair" ? "#8a5a00" : "#b3263e";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center rounded-full border-4" style={{ borderColor: color }}>
          <span className="font-en text-2xl font-semibold" style={{ color }}>{result.score}</span>
        </div>
        <div>
          <p className="font-bold" style={{ color }}>{SEO_RANK_LABEL[result.rank]}</p>
          <p className="text-xs text-muted">100点満点の目安です。検索順位を保証するものではありません。</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {result.checks.map((c) => (
          <li key={c.key} className="rounded-xl bg-ivory px-3 py-2">
            <div className="flex justify-between font-bold text-navy"><span>{c.label}</span><span className="font-en">{c.score}/{c.max}</span></div>
            {c.messages.map((m) => <p key={m} className="mt-0.5 text-xs text-muted">・{m}</p>)}
          </li>
        ))}
      </ul>

      <div className="border-t border-[#eee6dc] pt-4">
        <button
          type="button"
          disabled={busy || !value.html}
          className={`${btnSecondary} w-full`}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              setAi(await callAi<Suggest>("seo", { articleId, title: value.title, html: value.html, keyword: value.keyword }));
            } catch (e) {
              setError(e instanceof Error ? e.message : "失敗しました。");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "AIが分析しています…" : "AIに改善案を聞く"}
        </button>
        {error && <p role="alert" className="mt-2 text-sm text-[#b3263e]">{error}</p>}
        {ai && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-xl bg-white p-3 ring-1 ring-[#eee6dc]">
              <p className="text-xs font-bold text-muted">SEOタイトル案</p>
              <p className="mt-1">{ai.seo_title}</p>
              <button type="button" className="mt-1 text-xs text-navy underline" onClick={() => onApply({ seo_title: ai.seo_title })}>この案を使う</button>
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-[#eee6dc]">
              <p className="text-xs font-bold text-muted">メタディスクリプション案</p>
              <p className="mt-1">{ai.seo_description}</p>
              <button type="button" className="mt-1 text-xs text-navy underline" onClick={() => onApply({ seo_description: ai.seo_description })}>この案を使う</button>
            </div>
            {ai.suggestions.length > 0 && (
              <ul className="space-y-1.5">
                {ai.suggestions.map((s, i) => <li key={i} className="rounded-xl bg-ivory px-3 py-2"><strong className="text-navy">{AREA[s.area] ?? s.area}</strong>：{s.advice}</li>)}
              </ul>
            )}
            <div>
              <p className="text-xs font-bold text-muted">関連記事の候補（公開済みの記事から）</p>
              {ai.related.length ? (
                <ul className="mt-1 space-y-1">
                  {ai.related.map((r) => (
                    <li key={r.slug} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate">{r.title}</span>
                      <button type="button" className="shrink-0 text-xs text-navy underline" onClick={() => onInsertRelated(r)}>本文に挿入</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-muted">該当する公開済みの記事はありませんでした。</p>
              )}
            </div>
            <details className="rounded-xl bg-white p-3 ring-1 ring-[#eee6dc]">
              <summary className="cursor-pointer text-xs font-bold text-muted">SNS投稿文（Instagram・X）</summary>
              <p className="mt-2 text-xs font-bold">Instagram</p>
              <textarea readOnly value={ai.instagram} rows={6} className="mt-1 w-full rounded-lg border border-[#eee6dc] p-2 text-xs" />
              <p className="mt-2 text-xs font-bold">X</p>
              <textarea readOnly value={ai.x} rows={3} className="mt-1 w-full rounded-lg border border-[#eee6dc] p-2 text-xs" />
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
