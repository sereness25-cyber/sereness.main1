"use client";

import { useRef, useState } from "react";
import type { Media } from "@/lib/types";
import { deleteMedia, updateMediaAlt } from "@/app/admin/_actions/media";
import { uploadMedia } from "./MediaPicker";
import { Field, Panel, btnDanger, btnPrimary, btnSecondary, input } from "./ui";

export function MediaLibrary({ initial, demo }: { initial: Media[]; demo: boolean }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Media | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const shown = items.filter((m) => !q || m.alt.includes(q) || (m.prompt ?? "").includes(q));

  return (
    <>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.ok ? "bg-[#e8f3ec] text-[#1f6b3a]" : "bg-[#fbecee] text-[#8a1c30]"}`}>{msg.text}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="alt・プロンプトで検索" className={`${input} max-w-xs`} />
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          setBusy(true);
          setMsg(null);
          for (const f of files) {
            try {
              const m = await uploadMedia(f, "");
              setItems((xs) => [m, ...xs]);
            } catch (err) {
              setMsg({ ok: false, text: `${f.name}：${err instanceof Error ? err.message : "失敗しました"}` });
            }
          }
          setBusy(false);
          e.target.value = "";
        }} />
        <button type="button" disabled={demo || busy} onClick={() => file.current?.click()} className={btnPrimary}>{busy ? "アップロード中…" : "画像をアップロード"}</button>
        <span className="self-center text-xs text-muted">JPEG・PNG・WebP。アップロード時に最大2000px・WebPへ最適化します。</span>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {shown.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => { setSel(m); setAlt(m.alt); }} className={`relative block w-full overflow-hidden rounded-xl ring-2 ${sel?.id === m.id ? "ring-rose-deep" : "ring-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt} className="aspect-square w-full object-cover" loading="lazy" />
                {m.source === "ai" && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[0.65rem] text-white">AI</span>}
                {!m.alt && <span className="absolute right-1 top-1 rounded bg-[#b3263e] px-1.5 text-[0.65rem] text-white">alt未設定</span>}
              </button>
            </li>
          ))}
          {!shown.length && <li className="col-span-full py-10 text-center text-sm text-muted">画像がありません。</li>}
        </ul>
        {sel && (
          <Panel title="画像の詳細">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sel.url} alt={sel.alt} className="mb-3 w-full rounded-xl" />
            <p className="mb-3 text-xs text-muted">{sel.width}×{sel.height}px ／ {sel.source === "ai" ? "AI生成" : "アップロード"}{sel.parent_id ? "（編集版）" : ""}</p>
            {sel.prompt && <p className="mb-3 whitespace-pre-wrap rounded-lg bg-ivory p-2 text-xs">{sel.prompt}</p>}
            <Field label="alt属性（画像の説明）"><input value={alt} onChange={(e) => setAlt(e.target.value)} className={input} /></Field>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} onClick={async () => {
                const r = await updateMediaAlt(sel.id, alt);
                if (!r.ok) return setMsg({ ok: false, text: r.error });
                setItems((xs) => xs.map((x) => (x.id === sel.id ? { ...x, alt } : x)));
                setMsg({ ok: true, text: "保存しました。" });
              }}>altを保存</button>
              <button type="button" className={btnSecondary} onClick={() => navigator.clipboard.writeText(sel.url).then(() => setMsg({ ok: true, text: "URLをコピーしました。" }))}>URLをコピー</button>
              <button type="button" className={btnDanger} onClick={async () => {
                if (!window.confirm("この画像を削除します。記事で使っている場合は表示されなくなります。よろしいですか？")) return;
                const r = await deleteMedia(sel.id);
                if (!r.ok) return setMsg({ ok: false, text: r.error });
                setItems((xs) => xs.filter((x) => x.id !== sel.id));
                setSel(null);
              }}>削除</button>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
