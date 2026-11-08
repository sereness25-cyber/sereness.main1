"use client";

import { useEffect, useRef, useState } from "react";
import { REWRITE_MODES, type RewriteMode } from "@/lib/ai/schemas";
import { callAi } from "./aiClient";
import { btnPrimary, btnSecondary, input } from "./ui";

/** AIリライト。変更前と変更後を並べ、採用か破棄を選ぶ（仕様書 9-5） */
export function RewriteDialog({
  source,
  isHtml,
  keyword,
  onAccept,
  onClose,
}: {
  source: string;
  isHtml: boolean;
  keyword: string;
  onAccept: (text: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<RewriteMode>("readable");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => ref.current?.showModal(), []);

  const view = (t: string) =>
    isHtml ? <div className="article-body text-sm" dangerouslySetInnerHTML={{ __html: t }} /> : <p className="whitespace-pre-wrap text-sm leading-7">{t}</p>;

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(1000px,95vw)] rounded-2xl p-0 backdrop:bg-black/40">
      <div className="border-b border-[#eee6dc] px-5 py-3">
        <h2 className="text-base text-navy">AIリライト（{isHtml ? "記事全体" : "選択した文章"}）</h2>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm font-bold text-navy">
            書き換えの方針
            <select value={mode} onChange={(e) => setMode(e.target.value as RewriteMode)} className={`${input} mt-1 w-64`}>
              {Object.entries(REWRITE_MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await callAi<{ text: string }>("rewrite", { text: source, mode, keyword, isHtml });
                setResult(r.text);
              } catch (e) {
                setError(e instanceof Error ? e.message : "失敗しました。");
              } finally {
                setBusy(false);
              }
            }}
            className={btnPrimary}
          >
            {busy ? "書き換え中…" : result ? "もう一度書き換える" : "書き換える"}
          </button>
        </div>
        {error && <p role="alert" className="rounded-xl bg-[#fbecee] px-3 py-2 text-sm text-[#8a1c30]">{error}</p>}
        <div className="grid max-h-[55vh] gap-3 overflow-y-auto md:grid-cols-2">
          <div className="rounded-xl bg-ivory p-4"><p className="mb-2 text-xs font-bold text-muted">変更前</p>{view(source)}</div>
          <div className="rounded-xl bg-[#f3f7f2] p-4"><p className="mb-2 text-xs font-bold text-[#1f6b3a]">変更後</p>{result ? view(result) : <p className="text-sm text-muted">「書き換える」を押すと表示されます。</p>}</div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#eee6dc] px-5 py-3">
        <button type="button" onClick={() => ref.current?.close()} className={btnSecondary}>破棄して閉じる</button>
        <button type="button" disabled={!result} onClick={() => { onAccept(result); ref.current?.close(); }} className={btnPrimary}>変更後を採用する</button>
      </div>
    </dialog>
  );
}
