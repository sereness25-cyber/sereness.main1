import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, queryArticles } from "@/lib/data";
import { ArticleCard } from "@/components/site/Cards";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Pagination } from "@/components/site/Pagination";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  if (!c) return {};
  return { title: c.name, description: c.description, alternates: { canonical: `/category/${c.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const c = await getCategoryBySlug((await params).slug);
  if (!c) notFound();
  const { items, page, pages, total } = await queryArticles({ category: c.slug, page: Number((await searchParams).page) || 1 });
  return (
    <>
      <PageHeader en={`Category / ${c.slug}`} title={c.name} lead={c.description}>
        <Breadcrumbs items={[{ name: "記事", href: "/articles" }, { name: c.name, href: `/category/${c.slug}` }]} />
      </PageHeader>
      <Container className="py-10">
        <p className="text-sm text-muted">{total}件の記事</p>
        {items.length ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        ) : (
          <div className="mt-4"><EmptyState title="このカテゴリーの記事を準備しています" /></div>
        )}
        <Pagination page={page} pages={pages} makeHref={(p) => `/category/${c.slug}?page=${p}`} />
      </Container>
    </>
  );
}
