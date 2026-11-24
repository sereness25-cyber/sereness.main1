import type { Metadata } from "next";
import { getCategories, getTags, queryArticles, type ArticleQuery } from "@/lib/data";
import { ArticleCard } from "@/components/site/Cards";
import { ArticleFilters } from "@/components/site/ArticleFilters";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Pagination } from "@/components/site/Pagination";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { IS_STATIC, articleText } from "@/lib/static-site";

export const metadata: Metadata = {
  title: "記事を読む",
  description: "川反のお店、歴史、人、楽しみ方。かわばた日和の記事一覧です。",
  alternates: { canonical: "/articles" },
};

type SP = Promise<Record<string, string | undefined>>;

export default async function ArticlesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const query: ArticleQuery = {
    q: sp.q || undefined,
    category: sp.category || undefined,
    tag: sp.tag || undefined,
    sort: (["new", "old", "recommended"].includes(sp.sort ?? "") ? sp.sort : "new") as ArticleQuery["sort"],
    from: sp.from || undefined,
    to: sp.to || undefined,
    page: Number(sp.page) || 1,
    // 静的書き出しでは全部の記事を1ページに出して、ブラウザで絞り込む・並べ替える
    ...(IS_STATIC ? { perPage: 10000, page: 1 } : {}),
  };
  const [{ items, total, page, pages }, categories, tags] = await Promise.all([queryArticles(query), getCategories(), getTags()]);
  const makeHref = (p: number) => {
    const u = new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `/articles?${u.toString()}`;
  };

  return (
    <>
      <PageHeader en="Articles" title="記事を読む" lead="川反のお店、歴史、人、楽しみ方。気になる記事から読んでみてください。">
        <Breadcrumbs items={[{ name: "記事", href: "/articles" }]} />
      </PageHeader>
      <Container className="py-10">
        <ArticleFilters categories={categories} tags={tags} values={sp} />
        <p className="mt-6 text-sm text-muted" data-kb-count="{n}件の記事">{total}件の記事</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-kb-list hidden={!items.length}>
          {items.map((a, i) => (
            <div
              key={a.id}
              data-kb-item
              data-categories={a.categories.map((c) => c.slug).join(" ")}
              data-tags={a.tags.map((t) => t.slug).join(" ")}
              data-date={a.published_at ?? a.updated_at}
              data-featured={a.is_featured ? "1" : ""}
              data-text={articleText(a)}
            >
              <ArticleCard article={a} priority={i < 2} />
            </div>
          ))}
        </div>
        <div className="mt-4" data-kb-empty hidden={items.length > 0}><EmptyState title="条件に合う記事が見つかりませんでした">キーワードや条件を変えて、もう一度お試しください。</EmptyState></div>
        {!IS_STATIC && <Pagination page={page} pages={pages} makeHref={makeHref} />}
      </Container>
    </>
  );
}
