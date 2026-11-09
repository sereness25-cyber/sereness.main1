"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/types";
import { btnPrimary, btnSecondary, input } from "./ui";

const enabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

/** 画像を最大2000pxに縮小してWebPにする（ブラウザ内で最適化） */
async function optimize(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
  if (!blob) throw new Error("画像の変換に失敗しました。");
  return { blob, width: w, height: h };
}

export async function uploadMedia(file: File, alt: string): Promise<Media> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("JPEG・PNG・WebP の画像を選んでください。");
  if (file.size > 15 * 1024 * 1024) throw new Error("15MB以下の画像を選んでください。");
  const { browserClient } = await import("@/lib/supabase/browser");
  const sb = browserClient();
  const { blob, width, height } = await optimize(file);
  const path = `uploads/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`;
  const up = await sb.storage.from("media").upload(path, blob, { contentType: "image/webp" });
  if (up.error) throw new Error(`アップロードに失敗しました: ${up.error.message}`);
  const url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  const { data, error } = await sb.from("media").insert({ path, url, alt, mime: "image/webp", width, height, bytes: blob.size, source: "upload" }).select("*").single();
  if (error) throw new Error(`画像情報の保存に失敗しました: ${error.message}`);
  return data as Media;
}

export function MediaPicker({ onSelect, onClose }: { onSelect: (m: Media) => void; onClose: () => void }) {
  const [items, setItems] = useState<Media[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    const { browserClient } = await import("@/lib/supabase/browser");
    const { data, error } = await browserClient().from("media").select("*").order("created_at", { ascending: false }).limit(120);
    if (error) setError(error.message);
    else setItems(data as Media[]);
  }, []);

  useEffect(() => {
    dialog.current?.showModal();
    load();
  }, [load]);

  const shown = items.filter((m) => !q || m.alt.includes(q) || (m.prompt ?? "").includes(q));

  return (
    <dialog ref={dialog} onClose={onClose} className="m-auto w-[min(920px,94vw)] rounded-2xl p-0 backdrop:bg-black/40">
      <div className="flex items-center justify-between border-b border-[#eee6dc] px-5 py-3">
        <h2 className="text-base text-navy">画像を選ぶ</h2>
        <button type="button" onClick={() => dialog.current?.close()} className={btnSecondary}>閉じる</button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-5">
        {!enabled && <p className="mb-4 text-sm text-muted">デモモードのため画像は扱えません。</p>}
        {error && <p role="alert" className="mb-3 rounded-xl bg-[#fbecee] px-3 py-2 text-sm text-[#8a1c30]">{error}</p>}
        <div className="mb-4 flex flex-wrap gap-2">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="alt・プロンプトで検索" className={`${input} max-w-xs`} />
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const alt = window.prompt("画像の説明（alt）を入力してください", "") ?? "";
            setBusy(true);
            setError("");
            try {
              const m = await uploadMedia(f, alt);
              setItems((xs) => [m, ...xs]);
              setPicked(m);
            } catch (err) {
              setError(err instanceof Error ? err.message : "アップロードに失敗しました。");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }} />
          <button type="button" disabled={!enabled || busy} onClick={() => fileRef.current?.click()} className={btnPrimary}>{busy ? "アップロード中…" : "画像をアップロード"}</button>
        </div>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {shown.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setPicked(m)} className={`block w-full overflow-hidden rounded-xl ring-2 ${picked?.id === m.id ? "ring-rose-deep" : "ring-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt} className="aspect-square w-full object-cover" loading="lazy" />
              </button>
              {m.source === "ai" && <span className="text-[0.65rem] text-muted">AI生成</span>}
            </li>
          ))}
        </ul>
        {enabled && !shown.length && <p className="py-8 text-center text-sm text-muted">画像がありません。</p>}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[#eee6dc] px-5 py-3">
        <p className="min-w-0 truncate text-xs text-muted">{picked ? `alt：${picked.alt || "（未設定）"}` : "画像を選んでください"}</p>
        <button type="button" disabled={!picked} onClick={() => { if (picked) { onSelect(picked); dialog.current?.close(); } }} className={btnPrimary}>この画像を使う</button>
      </div>
    </dialog>
  );
}
