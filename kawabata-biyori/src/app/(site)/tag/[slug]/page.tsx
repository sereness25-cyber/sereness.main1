import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug, queryArticles } from "@/lib/data";
import { ArticleCard } from "@/components/site/Cards";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Pagination } from "@/components/site/Pagination";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTagBySlug(decodeURIComponent((await params).slug));
  if (!t) return {};
  return { title: `#${t.name}の記事`, alternates: { canonical: `/tag/${t.slug}` } };
}

export default async function TagPage({ params, searchParams }: Props) {
  const t = await getTagBySlug(decodeURIComponent((await params).slug));
  if (!t) notFound();
  const { items, page, pages, total } = await queryArticles({ tag: t.slug, page: Number((await searchParams).page) || 1 });
  return (
    <>
      <PageHeader en="Tag" title={`#${t.name}`}>
        <Breadcrumbs items={[{ name: "記事", href: "/articles" }, { name: `#${t.name}`, href: `/tag/${t.slug}` }]} />
      </PageHeader>
      <Container className="py-10">
        <p className="text-sm text-muted">{total}件の記事</p>
        {items.length ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        ) : (
          <div className="mt-4"><EmptyState title="このタグの記事はまだありません" /></div>
        )}
        <Pagination page={page} pages={pages} makeHref={(p) => `/tag/${t.slug}?page=${p}`} />
      </Container>
    </>
  );
}
