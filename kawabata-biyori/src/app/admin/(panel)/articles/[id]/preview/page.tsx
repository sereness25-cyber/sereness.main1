import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminArticle, adminArticles, adminShops } from "@/lib/admin/data";
import { collectEmbedSlugs } from "@/lib/html";
import { ArticleView } from "@/components/site/ArticleView";

export const metadata = { title: "プレビュー", robots: { index: false } };

export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdminPage();
  const article = await adminArticle(admin, id);
  if (!article) notFound();
  const [shops, articles] = await Promise.all([adminShops(admin), adminArticles(admin)]);
  const shopSlugs = collectEmbedSlugs(article.content, "shop");
  const articleSlugs = collectEmbedSlugs(article.content, "article");
  return (
    <div className="bg-ivory pb-20">
      <p className="sticky top-0 z-20 bg-rose-deep px-4 py-2 text-center text-sm font-bold text-white md:top-0">プレビュー（読者にはまだ表示されていません）</p>
      <ArticleView
        article={article}
        preview
        related={[]}
        shops={shops.filter((s) => article.shop_ids.includes(s.id))}
        embedShops={shops.filter((s) => shopSlugs.includes(s.slug))}
        embedArticles={articles.filter((a) => articleSlugs.includes(a.slug))}
      />
    </div>
  );
}
