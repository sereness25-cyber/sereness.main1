"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/admin/_actions/media";

const GROUPS: { title: string; items: [string, string][] }[] = [
  { title: "", items: [["/admin", "ダッシュボード"]] },
  { title: "記事", items: [["/admin/articles", "記事管理"], ["/admin/articles/new", "新規作成"], ["/admin/ai", "AI記事作成"], ["/admin/seo", "SEOアシスタント"], ["/admin/images", "AI画像スタジオ"]] },
  { title: "地域情報", items: [["/admin/shops", "店舗管理"], ["/admin/events", "イベント管理"]] },
  { title: "分類・素材", items: [["/admin/categories", "カテゴリー"], ["/admin/tags", "タグ"], ["/admin/media", "メディアライブラリ"]] },
  { title: "設定", items: [["/admin/contact", "お問い合わせ"], ["/admin/settings", "サイト設定"], ["/admin/ai-settings", "AI設定"]] },
];

export function AdminNav({ email }: { email: string | null }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || (href !== "/admin/articles/new" && path.startsWith(`${href}/`) && !path.startsWith("/admin/articles/new")));

  const nav = (
    <nav aria-label="管理メニュー" className="space-y-5 text-sm">
      {GROUPS.map((g) => (
        <div key={g.title}>
          {g.title && <p className="mb-1 px-3 text-xs font-bold text-white/50">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map(([href, label]) => (
              <li key={href}>
                <Link href={href} onClick={() => setOpen(false)} aria-current={active(href) ? "page" : undefined} className={`block rounded-lg px-3 py-2 ${active(href) ? "bg-white/15 font-bold text-white" : "text-white/80 hover:bg-white/10"}`}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="border-t border-white/15 pt-4">
        <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-white/80 hover:bg-white/10">サイトを見る ↗</Link>
        {email && (
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.replace("/admin/login");
              router.refresh();
            }}
            className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-white/80 hover:bg-white/10"
          >
            ログアウト
          </button>
        )}
        {email && <p className="mt-2 truncate px-3 text-xs text-white/50">{email}</p>}
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-navy px-4 text-white md:hidden">
        <span className="font-maru font-bold">かわばた日和 管理</span>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/30">
          {open ? "閉じる" : "メニュー"}
        </button>
      </div>
      {open && <div className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-y-auto bg-navy p-4 md:hidden">{nav}</div>}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 overflow-y-auto bg-navy p-4 md:block">
        <p className="mb-6 px-3 font-maru text-lg font-bold text-white">かわばた日和<span className="block font-en text-xs font-normal tracking-widest text-white/60">ADMIN</span></p>
        {nav}
      </aside>
    </>
  );
}
