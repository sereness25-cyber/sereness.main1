"use client";

import { useState } from "react";
import type { Media } from "@/lib/types";
import { callAi } from "./aiClient";
import { Field, Panel, btnPrimary, btnSecondary, input } from "./ui";

type Aspect = "16:9" | "1:1" | "9:16";
const ASPECTS: [Aspect, string][] = [["16:9", "16:9 記事アイキャッチ"], ["1:1", "1:1 SNS投稿"], ["9:16", "9:16 ストーリー・ショート"]];
const STYLES: [string, string][] = [["auto", "おまかせ"], ["photo", "実写風"], ["kawaii", "大人かわいいイラスト"], ["watercolor", "水彩イラスト"], ["magazine", "雑誌風"]];

export function ImageStudio({ initial, articles, demo }: { initial: Media[]; articles: { id: string; title: string }[]; demo: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("auto");
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [alt, setAlt] = useState("");
  const [current, setCurrent] = useState<Media | null>(null);
  const [history, setHistory] = useState<Media[]>(initial.filter((m) => m.source === "ai"));
  const [instruction, setInstruction] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(label: string, body: object) {
    if (busy) return;
    setBusy(label);
    setMsg(null);
    try {
      const m = await callAi<Media>("image", body);
      setCurrent(m);
      setHistory((h) => [m, ...h]);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "失敗しました。" });
    } finally {
      setBusy("");
    }
  }

  const versions = current ? history.filter((m) => m.id === current.id || m.parent_id === current.id || m.id === current.parent_id || (current.parent_id && m.parent_id === current.parent_id)) : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Panel title="画像を作る">
        <div className="space-y-4">
          <Field label="どんな画像にしますか？" required hint="実在するお店や人物の写真の代わりには使わないでください。">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className={input} placeholder="例：夕暮れの川沿いに灯りがともる、落ち着いた飲み屋街の雰囲気" />
          </Field>
          <Field label="スタイル"><select value={style} onChange={(e) => setStyle(e.target.value)} className={input}>{STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="サイズ"><select value={aspect} onChange={(e) => setAspect(e.target.value as Aspect)} className={input}>{ASPECTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="画像の説明（alt）"><input value={alt} onChange={(e) => setAlt(e.target.value)} className={input} /></Field>
          <button type="button" disabled={demo || !!busy || prompt.trim().length < 3} onClick={() => run("画像を作っています", { action: "generate", prompt, style, aspect, alt })} className={`${btnPrimary} w-full`}>
            {busy || (current ? "もう一度作る（再生成）" : "画像を作る")}
          </button>
          {demo && <p className="text-xs text-muted">デモモードのため生成できません。</p>}
        </div>
      </Panel>

      <div className="space-y-4">
        {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-[#e8f3ec] text-[#1f6b3a]" : "bg-[#fbecee] text-[#8a1c30]"}`}>{msg.text}</p>}
        <Panel title="プレビュー">
          {current ? (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.url} alt={current.alt} className="max-h-[60vh] rounded-xl object-contain" />
              <p className="text-xs text-muted">メディアライブラリに保存済み。公開ページでは「イメージ画像」と表示されます。</p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1"><Field label="追加の指示で編集" hint="例：明るくして／人物を減らして／夜の雰囲気を強くして／背景を変更して"><input value={instruction} onChange={(e) => setInstruction(e.target.value)} className={input} /></Field></div>
                <button type="button" disabled={!!busy || instruction.trim().length < 2} onClick={() => run("画像を編集しています", { action: "edit", mediaId: current.id, instruction, aspect })} className={btnSecondary}>この指示で編集</button>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Field label="記事のアイキャッチに設定">
                    <select value={target} onChange={(e) => setTarget(e.target.value)} className={input}>
                      <option value="">記事を選ぶ</option>
                      {articles.map((a) => <option key={a.id} value={a.id}>{a.title || "（無題）"}</option>)}
                    </select>
                  </Field>
                </div>
                <button
                  type="button"
                  disabled={!target || !!busy}
                  onClick={async () => {
                    const res = await fetch("/api/admin/eyecatch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: target, mediaId: current.id }) });
                    const j = await res.json().catch(() => ({}));
                    setMsg(res.ok ? { ok: true, text: "アイキャッチに設定しました。" } : { ok: false, text: j.error ?? "設定できませんでした。" });
                  }}
                  className={btnPrimary}
                >
                  設定する
                </button>
              </div>
              {versions.length > 1 && (
                <div>
                  <p className="mb-2 text-xs font-bold text-muted">バージョン</p>
                  <ul className="flex flex-wrap gap-2">
                    {versions.map((m) => (
                      <li key={m.id}>
                        <button type="button" onClick={() => setCurrent(m)} className={`overflow-hidden rounded-lg ring-2 ${m.id === current.id ? "ring-rose-deep" : "ring-transparent"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.url} alt="" className="h-16 w-24 object-cover" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">左の欄から画像を作ると、ここに表示されます。</p>
          )}
        </Panel>
        {history.length > 0 && (
          <Panel title="これまでに作った画像">
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {history.slice(0, 20).map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setCurrent(m)} className="block w-full overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.alt} className="aspect-square w-full object-cover" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
