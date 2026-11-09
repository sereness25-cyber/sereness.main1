import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminArticles } from "@/lib/admin/data";
import { scoreSeo, SEO_RANK_LABEL } from "@/lib/seo-score";
import { AdminPage, StatusPill } from "@/components/admin/ui";

export const metadata = { title: "SEOアシスタント" };

export default async function SeoPage() {
  const admin = await requireAdminPage();
  const rows = (await adminArticles(admin))
    .map((a) => ({ a, r: scoreSeo({ title: a.title, seoTitle: a.seo_title, seoDescription: a.seo_description, html: a.content, keyword: a.focus_keyword }) }))
    .sort((x, y) => x.r.score - y.r.score);
  const color = { good: "text-[#1f6b3a]", fair: "text-[#8a5a00]", poor: "text-[#b3263e]" };
  return (
    <AdminPage title="SEOアシスタント" lead="点数の低い順に並べています。記事を開くと、編集画面の「SEO」タブで詳しい分析とAIの改善提案を確認できます。">
      <div className="overflow-x-auto rounded-2xl bg-white shadow-soft">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-[#eee6dc] text-left text-xs text-muted"><tr><th className="px-4 py-3">記事</th><th className="px-3">状態</th><th className="px-3">点数</th><th className="px-3">主な改善点</th></tr></thead>
          <tbody className="divide-y divide-[#f1ebe3]">
            {rows.map(({ a, r }) => {
              const worst = [...r.checks].sort((x, y) => x.score / x.max - y.score / y.max)[0];
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3"><Link href={`/admin/articles/${a.id}`} className="font-bold text-navy hover:underline">{a.title || "（無題）"}</Link></td>
                  <td className="px-3"><StatusPill status={a.status} publishedAt={a.published_at} /></td>
                  <td className={`px-3 font-bold ${color[r.rank]}`}><span className="font-en text-lg">{r.score}</span> {SEO_RANK_LABEL[r.rank]}</td>
                  <td className="px-3 text-xs text-muted">{worst.label}：{worst.messages[0] ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
