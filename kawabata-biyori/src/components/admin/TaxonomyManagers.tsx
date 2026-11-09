"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, Tag } from "@/lib/types";
import { deleteCategory, deleteTag, reorderCategories, saveCategory, saveTag } from "@/app/admin/_actions/taxonomy";
import { MediaPicker } from "./MediaPicker";
import { Field, Panel, btnDanger, btnPrimary, btnSecondary, input } from "./ui";

function useMsg() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const node = msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.ok ? "bg-[#e8f3ec] text-[#1f6b3a]" : "bg-[#fbecee] text-[#8a1c30]"}`}>{msg.text}</p>;
  return { setMsg, node };
}

export function CategoryManager({ categories, demo }: { categories: Category[]; demo: boolean }) {
  const router = useRouter();
  const { setMsg, node } = useMsg();
  const [list, setList] = useState(categories);
  const [edit, setEdit] = useState<Partial<Category> | null>(null);
  const [picker, setPicker] = useState(false);
  const guard = () => (demo ? (setMsg({ ok: false, text: "デモモードのため保存できません。" }), true) : false);

  const move = async (i: number, d: -1 | 1) => {
    if (guard()) return;
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setList(next);
    const r = await reorderCategories(next.map((c) => c.id));
    if (!r.ok) setMsg({ ok: false, text: r.error });
  };

  return (
    <>
      {node}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="min-w-0 divide-y divide-[#f1ebe3] rounded-2xl bg-white shadow-soft">
          {list.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${c.name}を上へ`} className="px-1 text-xs disabled:opacity-30">▲</button>
                <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={`${c.name}を下へ`} className="px-1 text-xs disabled:opacity-30">▼</button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-navy">{c.name} <span className="text-xs font-normal text-muted">/{c.slug}</span></p>
                <p className="truncate text-xs text-muted">{c.description}</p>
              </div>
              <button type="button" onClick={() => setEdit(c)} className={`${btnSecondary} shrink-0`}>編集</button>
            </li>
          ))}
        </ul>
        <Panel title={edit?.id ? "カテゴリーを編集" : "カテゴリーを追加"}>
          <div className="space-y-3">
            <Field label="名前" required><input value={edit?.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={input} /></Field>
            <Field label="スラッグ" required hint="半角英小文字・数字・ハイフン"><input value={edit?.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} className={input} /></Field>
            <Field label="説明文"><textarea value={edit?.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} rows={3} className={input} /></Field>
            <div>
              <p className="mb-1 text-sm font-bold text-navy">カテゴリー画像</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {edit?.image && <img src={edit.image} alt="" className="mb-2 aspect-video w-full rounded-xl object-cover" />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setPicker(true)} className={btnSecondary}>画像を選ぶ</button>
                {edit?.image && <button type="button" onClick={() => setEdit({ ...edit, image: null })} className={btnSecondary}>外す</button>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} onClick={async () => {
                if (guard()) return;
                const r = await saveCategory({ id: edit?.id, name: edit?.name ?? "", slug: edit?.slug ?? "", description: edit?.description ?? "", image: edit?.image ?? null });
                if (!r.ok) return setMsg({ ok: false, text: r.error });
                setMsg({ ok: true, text: "保存しました。" });
                setEdit(null);
                router.refresh();
              }}>保存</button>
              {edit && <button type="button" onClick={() => setEdit(null)} className={btnSecondary}>新規に戻す</button>}
              {edit?.id && (
                <button type="button" className={btnDanger} onClick={async () => {
                  if (guard() || !window.confirm("削除すると、記事との紐づけも外れます。よろしいですか？")) return;
                  const r = await deleteCategory(edit.id!);
                  if (!r.ok) return setMsg({ ok: false, text: r.error });
                  setList((l) => l.filter((c) => c.id !== edit.id));
                  setEdit(null);
                }}>削除</button>
              )}
            </div>
          </div>
        </Panel>
      </div>
      {picker && <MediaPicker onClose={() => setPicker(false)} onSelect={(m) => setEdit((e) => ({ ...e, image: m.url }))} />}
    </>
  );
}

export function TagManager({ tags, demo }: { tags: (Tag & { count: number })[]; demo: boolean }) {
  const router = useRouter();
  const { setMsg, node } = useMsg();
  const [edit, setEdit] = useState<Partial<Tag> | null>(null);
  return (
    <>
      {node}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ul className="flex min-w-0 flex-wrap content-start gap-2 rounded-2xl bg-white p-4 shadow-soft">
          {tags.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setEdit(t)} className="rounded-full border border-[#e2d8cc] px-3 py-1.5 text-sm text-navy hover:bg-ivory">#{t.name} <span className="text-xs text-muted">{t.count}</span></button>
            </li>
          ))}
          {!tags.length && <li className="text-sm text-muted">タグはまだありません。記事の編集画面で入力すると自動で作られます。</li>}
        </ul>
        <Panel title={edit?.id ? "タグを編集" : "タグを追加"}>
          <div className="space-y-3">
            <Field label="名前" required><input value={edit?.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={input} /></Field>
            <Field label="スラッグ" required hint="半角英小文字・数字・ハイフン"><input value={edit?.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} className={input} /></Field>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} onClick={async () => {
                if (demo) return setMsg({ ok: false, text: "デモモードのため保存できません。" });
                const r = await saveTag({ id: edit?.id, name: edit?.name ?? "", slug: edit?.slug ?? "" });
                if (!r.ok) return setMsg({ ok: false, text: r.error });
                setMsg({ ok: true, text: "保存しました。" });
                setEdit(null);
                router.refresh();
              }}>保存</button>
              {edit?.id && (
                <button type="button" className={btnDanger} onClick={async () => {
                  if (demo || !window.confirm("このタグを削除します。よろしいですか？")) return;
                  const r = await deleteTag(edit.id!);
                  if (!r.ok) return setMsg({ ok: false, text: r.error });
                  setEdit(null);
                  router.refresh();
                }}>削除</button>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
