import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminArticles, dashboardStats } from "@/lib/admin/data";
import { AdminPage, Panel, StatusPill, btnPrimary, btnRose } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

export const metadata = { title: "ダッシュボード" };

export default async function Dashboard() {
  const admin = await requireAdminPage();
  const [stats, articles] = await Promise.all([dashboardStats(admin?.supabase ?? null), adminArticles(admin)]);
  const cards: [string, number, string][] = [
    ["公開記事", stats.published, "/admin/articles?status=published"],
    ["下書き", stats.draft, "/admin/articles?status=draft"],
    ["予約記事", stats.scheduled, "/admin/articles?status=scheduled"],
    ["登録店舗", stats.shops, "/admin/shops"],
    ["開催予定イベント", stats.upcoming, "/admin/events"],
    ["24時間のAI利用", stats.aiToday, "/admin/ai-settings"],
  ];
  return (
    <AdminPage
      title="ダッシュボード"
      actions={<><Link href="/admin/articles/new" className={btnPrimary}>新規記事を書く</Link><Link href="/admin/ai" className={btnRose}>AIで記事を作る</Link></>}
    >
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, n, href]) => (
          <li key={label}>
            <Link href={href} className="block rounded-2xl bg-white p-4 shadow-soft hover:shadow-lift">
              <span className="text-xs text-muted">{label}</span>
              <span className="mt-1 block font-en text-3xl font-semibold text-navy">{n}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Panel title="最近編集した記事" className="mt-6">
        <ul className="divide-y divide-[#eee6dc]">
          {articles.slice(0, 8).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
              <Link href={`/admin/articles/${a.id}`} className="min-w-0 truncate text-sm text-navy hover:underline">{a.title || "（無題）"}</Link>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted"><StatusPill status={a.status} publishedAt={a.published_at} />{formatDate(a.updated_at)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </AdminPage>
  );
}
