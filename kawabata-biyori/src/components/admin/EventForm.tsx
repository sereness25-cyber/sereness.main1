"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EventItem } from "@/lib/types";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import { deleteEvent, saveEvent } from "@/app/admin/_actions/events";
import { RichEditor } from "./RichEditor";
import { MediaPicker } from "./MediaPicker";
import { Field, Panel, btnDanger, btnPrimary, btnSecondary, input } from "./ui";

export function EventForm({ event, demo }: { event: EventItem | null; demo: boolean }) {
  const router = useRouter();
  const [e, setE] = useState({
    title: event?.title ?? "",
    slug: event?.slug ?? "",
    starts: toLocalInput(event?.starts_at),
    ends: toLocalInput(event?.ends_at),
    venue: event?.venue ?? "",
    fee: event?.fee ?? "",
    content: event?.content ?? "",
    organizer: event?.organizer ?? "",
    how_to_apply: event?.how_to_apply ?? "",
    image: event?.image ?? null,
    image_alt: event?.image_alt ?? "",
    is_published: event?.is_published ?? false,
  });
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof typeof e>(k: K, v: (typeof e)[K]) => setE((x) => ({ ...x, [k]: v }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Field label="イベント名" required><input value={e.title} onChange={(x) => set("title", x.target.value)} className={input} /></Field></div>
            <Field label="開始日時" required><input type="datetime-local" value={e.starts} onChange={(x) => set("starts", x.target.value)} className={input} /></Field>
            <Field label="終了日時"><input type="datetime-local" value={e.ends} onChange={(x) => set("ends", x.target.value)} className={input} /></Field>
            <Field label="開催場所"><input value={e.venue} onChange={(x) => set("venue", x.target.value)} className={input} /></Field>
            <Field label="参加料金"><input value={e.fee} onChange={(x) => set("fee", x.target.value)} className={input} /></Field>
            <Field label="主催者"><input value={e.organizer} onChange={(x) => set("organizer", x.target.value)} className={input} /></Field>
            <Field label="申込方法"><input value={e.how_to_apply} onChange={(x) => set("how_to_apply", x.target.value)} className={input} /></Field>
            <Field label="URLスラッグ"><input value={e.slug} onChange={(x) => set("slug", x.target.value)} className={input} /></Field>
          </div>
        </Panel>
        <div>
          <p className="mb-2 text-sm font-bold text-navy">内容</p>
          <RichEditor initialHtml={e.content} onChange={(h) => set("content", h)} placeholder="イベントの内容を書きましょう…" />
        </div>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel>
          {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-3 rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-[#e8f3ec] text-[#1f6b3a]" : "bg-[#fbecee] text-[#8a1c30]"}`}>{msg.text}</p>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.is_published} onChange={(x) => set("is_published", x.target.checked)} />サイトに公開する</label>
          <p className="mt-1 text-xs text-muted">終了日時（なければ開始日時）を過ぎると、自動で「過去のイベント」に移ります。</p>
          <button
            type="button"
            disabled={busy}
            className={`${btnPrimary} mt-3 w-full`}
            onClick={async () => {
              if (demo) return setMsg({ ok: false, text: "デモモードのため保存できません。" });
              const starts = fromLocalInput(e.starts);
              if (!starts) return setMsg({ ok: false, text: "開始日時を入力してください。" });
              setBusy(true);
              const r = await saveEvent({
                id: event && !event.is_sample ? event.id : undefined,
                title: e.title, slug: e.slug, starts_at: starts, ends_at: fromLocalInput(e.ends), venue: e.venue, fee: e.fee,
                content: e.content, organizer: e.organizer, how_to_apply: e.how_to_apply, image: e.image, image_alt: e.image_alt, is_published: e.is_published,
              });
              setBusy(false);
              if (!r.ok) return setMsg({ ok: false, text: r.error });
              setMsg({ ok: true, text: "保存しました。" });
              if (!event) router.replace(`/admin/events/${r.data!.id}`);
              else router.refresh();
            }}
          >
            {busy ? "保存中…" : "保存する"}
          </button>
        </Panel>
        <Panel title="画像">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {e.image && <img src={e.image} alt={e.image_alt} className="mb-2 aspect-video w-full rounded-xl object-cover" />}
          <button type="button" onClick={() => setPicker(true)} className={btnSecondary}>{e.image ? "変更" : "画像を選ぶ"}</button>
          <input value={e.image_alt} onChange={(x) => set("image_alt", x.target.value)} placeholder="画像の説明（alt）" className={`${input} mt-2`} />
        </Panel>
        {event && !event.is_sample && (
          <button type="button" className={`${btnDanger} w-full`} onClick={async () => {
            if (!window.confirm("このイベントを削除します。よろしいですか？")) return;
            const r = await deleteEvent(event.id);
            if (r.ok) router.replace("/admin/events"); else setMsg({ ok: false, text: r.error });
          }}>イベントを削除</button>
        )}
      </aside>
      {picker && <MediaPicker onClose={() => setPicker(false)} onSelect={(m) => { set("image", m.url); set("image_alt", m.alt); }} />}
    </div>
  );
}
