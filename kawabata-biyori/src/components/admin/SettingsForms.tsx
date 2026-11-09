"use client";

import { useState } from "react";
import type { AiSettings, SiteSettings } from "@/lib/types";
import { saveAiSettings, saveSiteSettings } from "@/app/admin/_actions/settings";
import { Field, Panel, btnPrimary, input } from "./ui";

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  return m ? <p role={m.ok ? "status" : "alert"} className={`mb-4 rounded-xl px-4 py-2 text-sm ${m.ok ? "bg-[#e8f3ec] text-[#1f6b3a]" : "bg-[#fbecee] text-[#8a1c30]"}`}>{m.text}</p> : null;
}

export function SiteSettingsForm({ initial, demo }: { initial: SiteSettings; demo: boolean }) {
  const [s, setS] = useState(initial);
  const [m, setM] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <Panel title="SNSリンク" className="max-w-2xl">
      <Msg m={m} />
      <div className="grid gap-4">
        {(["instagram", "x", "facebook", "youtube"] as const).map((k) => (
          <Field key={k} label={{ instagram: "Instagram", x: "X", facebook: "Facebook", youtube: "YouTube" }[k]} hint="https:// から始まるURL。空欄ならフッターに表示しません">
            <input value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} className={input} />
          </Field>
        ))}
        <button type="button" className={btnPrimary} onClick={async () => {
          if (demo) return setM({ ok: false, text: "デモモードのため保存できません。" });
          const r = await saveSiteSettings(s);
          setM(r.ok ? { ok: true, text: "保存しました。" } : { ok: false, text: r.error });
        }}>保存する</button>
      </div>
    </Panel>
  );
}

export function AiSettingsForm({ initial, demo }: { initial: AiSettings; demo: boolean }) {
  const [s, setS] = useState(initial);
  const [m, setM] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <Panel title="生成の設定">
      <Msg m={m} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="文章生成モデル" hint="Claude のモデルID"><input value={s.text_model} onChange={(e) => setS({ ...s, text_model: e.target.value })} className={input} /></Field>
        <Field label="考える深さ（effort）" hint="高いほど丁寧ですが、時間と費用がかかります">
          <select value={s.effort} onChange={(e) => setS({ ...s, effort: e.target.value as AiSettings["effort"] })} className={input}>
            <option value="low">低（速い）</option><option value="medium">標準</option><option value="high">高（丁寧）</option>
          </select>
        </Field>
        <Field label="画像生成モデル" hint="OpenAI の画像モデルID"><input value={s.image_model} onChange={(e) => setS({ ...s, image_model: e.target.value })} className={input} /></Field>
        <Field label="1日の利用上限（回）" hint="記事生成・リライト・画像生成の合計"><input type="number" min={1} max={1000} value={s.daily_limit} onChange={(e) => setS({ ...s, daily_limit: Number(e.target.value) })} className={input} /></Field>
      </div>
      <button type="button" className={`${btnPrimary} mt-4`} onClick={async () => {
        if (demo) return setM({ ok: false, text: "デモモードのため保存できません。" });
        const r = await saveAiSettings(s);
        setM(r.ok ? { ok: true, text: "保存しました。" } : { ok: false, text: r.error });
      }}>保存する</button>
    </Panel>
  );
}
