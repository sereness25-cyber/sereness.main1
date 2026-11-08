import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminArticles } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";
import { scoreSeo } from "@/lib/seo-score";
import { AdminPage, Empty, StatusPill, btnPrimary, input } from "@/components/admin/ui";

export const metadata = { title: "記事管理" };

const FILTERS: [string, string][] = [["", "すべて"], ["draft", "下書き"], ["published", "公開"], ["scheduled", "予約"], ["private", "非公開"]];

export default async function ArticlesAdmin({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "", q = "" } = await searchParams;
  const admin = await requireAdminPage();
  const all = await adminArticles(admin);
  const items = all.filter((a) => (!status || a.status === status) && (!q || a.title.includes(q) || a.slug.includes(q)));
  return (
    <AdminPage title="記事管理" actions={<Link href="/admin/articles/new" className={btnPrimary}>新規作成</Link>}>
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-1" aria-label="状態で絞り込む">
          {FILTERS.map(([v, l]) => (
            <Link key={v} href={`/admin/articles${v ? `?status=${v}` : ""}`} className={`rounded-full px-3 py-1.5 text-sm ${status === v ? "bg-navy text-white" : "bg-white text-navy"}`}>
              {l}（{v ? all.filter((a) => a.status === v).length : all.length}）
            </Link>
          ))}
        </nav>
        <input type="hidden" name="status" value={status} />
        <input type="search" name="q" defaultValue={q} placeholder="タイトルで検索" className={`${input} ml-auto max-w-xs`} />
      </form>
      {items.length ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-soft">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-[#eee6dc] text-left text-xs text-muted">
              <tr><th className="px-4 py-3">タイトル</th><th className="px-3">状態</th><th className="px-3">カテゴリー</th><th className="px-3">SEO</th><th className="px-3">公開日</th><th className="px-3">更新日</th></tr>
            </thead>
            <tbody className="divide-y divide-[#f1ebe3]">
              {items.map((a) => {
                const seo = scoreSeo({ title: a.title, seoTitle: a.seo_title, seoDescription: a.seo_description, html: a.content, keyword: a.focus_keyword });
                return (
                  <tr key={a.id} className="hover:bg-ivory">
                    <td className="px-4 py-3"><Link href={`/admin/articles/${a.id}`} className="font-bold text-navy hover:underline">{a.title || "（無題）"}</Link><span className="block text-xs text-muted">/{a.slug}</span></td>
                    <td className="px-3"><StatusPill status={a.status} publishedAt={a.published_at} /></td>
                    <td className="px-3 text-xs">{a.categories.map((c) => c.name).join("・")}</td>
                    <td className="px-3 font-en">{seo.score}</td>
                    <td className="px-3 text-xs">{formatDate(a.published_at)}</td>
                    <td className="px-3 text-xs">{formatDate(a.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty href="/admin/articles/new" label="記事を書く">該当する記事はありません。</Empty>
      )}
    </AdminPage>
  );
}
