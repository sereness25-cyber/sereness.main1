"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Shop } from "@/lib/types";
import { BUDGET_LABELS, SHOP_CATEGORIES } from "@/lib/constants";
import { deleteShop, saveShop, type ShopInput } from "@/app/admin/_actions/shops";
import { MediaPicker } from "./MediaPicker";
import { Field, Panel, btnDanger, btnPrimary, btnSecondary, input } from "./ui";

const tri = (v: boolean | null) => (v === null ? "" : v ? "yes" : "no");
const fromTri = (v: string) => (v === "" ? null : v === "yes");

export function ShopForm({ shop, demo }: { shop: Shop | null; demo: boolean }) {
  const router = useRouter();
  const [s, setS] = useState({
    name: shop?.name ?? "",
    slug: shop?.slug ?? "",
    category: shop?.category ?? "izakaya",
    description: shop?.description ?? "",
    address: shop?.address ?? "",
    lat: shop?.lat?.toString() ?? "",
    lng: shop?.lng?.toString() ?? "",
    business_hours: shop?.business_hours ?? "",
    closed_days: shop?.closed_days ?? "",
    price_range: shop?.price_range ?? "",
    budget_level: shop?.budget_level?.toString() ?? "",
    payment_methods: shop?.payment_methods ?? "",
    seats: shop?.seats ?? "",
    solo_ok: tri(shop?.solo_ok ?? null),
    non_alcohol: tri(shop?.non_alcohol ?? null),
    beginner_welcome: shop?.beginner_welcome ?? false,
    instagram: shop?.sns.instagram ?? "",
    x: shop?.sns.x ?? "",
    facebook: shop?.sns.facebook ?? "",
    youtube: shop?.sns.youtube ?? "",
    website: shop?.website ?? "",
    image: shop?.image ?? null,
    image_alt: shop?.image_alt ?? "",
    photo_permission: shop?.photo_permission ?? false,
    verified_at: shop?.verified_at ?? "",
    is_published: shop?.is_published ?? false,
  });
  const [checks, setChecks] = useState([false, false, false, false]);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((x) => ({ ...x, [k]: v }));
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const submit = async () => {
    if (demo) return setMsg({ ok: false, text: "デモモードのため保存できません。" });
    if (s.beginner_welcome && !checks.every(Boolean) && !shop?.beginner_welcome) {
      return setMsg({ ok: false, text: "初心者歓迎マークは、掲載基準の4項目をすべて確認してから付けてください。" });
    }
    setBusy(true);
    setMsg(null);
    const payload: ShopInput = {
      id: shop && !shop.is_sample ? shop.id : undefined,
      name: s.name,
      slug: s.slug,
      category: s.category,
      description: s.description,
      address: s.address,
      lat: num(s.lat),
      lng: num(s.lng),
      business_hours: s.business_hours,
      closed_days: s.closed_days,
      price_range: s.price_range,
      budget_level: num(s.budget_level),
      payment_methods: s.payment_methods,
      seats: s.seats,
      solo_ok: fromTri(s.solo_ok),
      non_alcohol: fromTri(s.non_alcohol),
      beginner_welcome: s.beginner_welcome,
      sns: { instagram: s.instagram, x: s.x, facebook: s.facebook, youtube: s.youtube },
      website: s.website || null,
      image: s.image,
      image_alt: s.image_alt,
      photo_permission: s.photo_permission,
      verified_at: s.verified_at || null,
      is_published: s.is_published,
    };
    const r = await saveShop(payload);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setMsg({ ok: true, text: "保存しました。" });
    if (!shop) router.replace(`/admin/shops/${r.data!.id}`);
    else router.refresh();
  };

  const tf = (k: keyof typeof s, label: string, hint?: string) => (
    <Field label={label} hint={hint}><input value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} className={input} /></Field>
  );
  const triSel = (k: "solo_ok" | "non_alcohol", label: string, yes: string, no: string) => (
    <Field label={label}>
      <select value={s[k]} onChange={(e) => set(k, e.target.value)} className={input}>
        <option value="">未確認</option><option value="yes">{yes}</option><option value="no">{no}</option>
      </select>
    </Field>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Panel title="基本情報">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="店舗名" required><input value={s.name} onChange={(e) => set("name", e.target.value)} className={input} /></Field>
            <Field label="業種">
              <select value={s.category} onChange={(e) => set("category", e.target.value as typeof s.category)} className={input}>
                {SHOP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            {tf("slug", "URLスラッグ", "半角英小文字・数字・ハイフン")}
            <div className="md:col-span-2"><Field label="紹介文"><textarea value={s.description} onChange={(e) => set("description", e.target.value)} rows={5} className={input} /></Field></div>
          </div>
        </Panel>
        <Panel title="営業・料金">
          <div className="grid gap-4 md:grid-cols-2">
            {tf("address", "住所")}
            <div className="grid grid-cols-2 gap-2">{tf("lat", "緯度", "地図表示用")}{tf("lng", "経度")}</div>
            {tf("business_hours", "営業時間")}
            {tf("closed_days", "定休日")}
            {tf("price_range", "料金", "例：チャージ500円＋ドリンク、セット3,000円/90分")}
            <Field label="予算の目安（検索用）">
              <select value={s.budget_level} onChange={(e) => set("budget_level", e.target.value)} className={input}>
                <option value="">未設定</option>
                {Object.entries(BUDGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            {tf("payment_methods", "支払方法")}
            {tf("seats", "席数")}
            {triSel("solo_ok", "一人での利用", "OK", "グループ向け")}
            {triSel("non_alcohol", "ノンアル対応", "あり", "なし")}
          </div>
        </Panel>
        <Panel title="リンク">
          <div className="grid gap-4 md:grid-cols-2">
            {tf("website", "公式サイト")}{tf("instagram", "Instagram")}{tf("x", "X")}{tf("facebook", "Facebook")}{tf("youtube", "YouTube")}
          </div>
        </Panel>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel>
          {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-3 rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-[#e8f3ec] text-[#1f6b3a]" : "bg-[#fbecee] text-[#8a1c30]"}`}>{msg.text}</p>}
          <div className="space-y-3">
            <Field label="情報の最終確認日" hint="店舗に確認した日。公開には必須です"><input type="date" value={s.verified_at} onChange={(e) => set("verified_at", e.target.value)} className={input} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.is_published} onChange={(e) => set("is_published", e.target.checked)} />サイトに公開する</label>
            <button type="button" disabled={busy} onClick={submit} className={`${btnPrimary} w-full`}>{busy ? "保存中…" : "保存する"}</button>
          </div>
        </Panel>
        <Panel title="写真">
          {s.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt={s.image_alt} className="mb-2 aspect-video w-full rounded-xl object-cover" />
          ) : null}
          <div className="flex gap-2">
            <button type="button" onClick={() => setPicker(true)} className={btnSecondary}>{s.image ? "変更" : "写真を選ぶ"}</button>
            {s.image && <button type="button" onClick={() => set("image", null)} className={btnSecondary}>外す</button>}
          </div>
          <input value={s.image_alt} onChange={(e) => set("image_alt", e.target.value)} placeholder="写真の説明（alt）" className={`${input} mt-2`} />
          <label className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" checked={s.photo_permission} onChange={(e) => set("photo_permission", e.target.checked)} className="mt-1" />店舗から写真使用の許可を得た</label>
        </Panel>
        <Panel title="初心者歓迎マーク">
          <p className="mb-2 text-xs text-muted">次の4点をすべて確認できた場合だけ付けてください。</p>
          {["料金が明確", "初来店客を歓迎", "料金説明に対応", "不明瞭な追加料金がない"].map((t, i) => (
            <label key={t} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checks[i]} onChange={(e) => setChecks((c) => c.map((x, j) => (j === i ? e.target.checked : x)))} />{t}</label>
          ))}
          <label className="mt-3 flex items-center gap-2 border-t border-[#eee6dc] pt-3 text-sm font-bold"><input type="checkbox" checked={s.beginner_welcome} onChange={(e) => set("beginner_welcome", e.target.checked)} />初心者歓迎マークを表示</label>
        </Panel>
        {shop && !shop.is_sample && (
          <button type="button" className={`${btnDanger} w-full`} onClick={async () => {
            if (!window.confirm("この店舗を削除します。よろしいですか？")) return;
            const r = await deleteShop(shop.id);
            if (r.ok) router.replace("/admin/shops"); else setMsg({ ok: false, text: r.error });
          }}>店舗を削除</button>
        )}
      </aside>
      {picker && <MediaPicker onClose={() => setPicker(false)} onSelect={(m) => { set("image", m.url); set("image_alt", m.alt); }} />}
    </div>
  );
}
