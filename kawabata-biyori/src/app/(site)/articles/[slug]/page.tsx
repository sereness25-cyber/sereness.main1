import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug, getRelatedArticles, getShopsByIds, getShopsBySlugs, queryArticles } from "@/lib/data";
import { collectEmbedSlugs } from "@/lib/html";
import { articleLd } from "@/lib/jsonld";
import { ArticleView } from "@/components/site/ArticleView";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(decodeURIComponent(slug));
  if (!a) return {};
  const title = a.seo_title || a.title;
  const description = a.seo_description || a.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/articles/${a.slug}` },
    robots: a.is_sample ? { index: false } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: a.published_at ?? undefined,
      modifiedTime: a.updated_at,
      images: a.thumbnail ? [{ url: a.thumbnail, alt: a.thumbnail_alt }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(decodeURIComponent(slug));
  if (!article) notFound();

  const articleSlugs = collectEmbedSlugs(article.content, "article");
  const [related, shops, embedShops, embedArticles] = await Promise.all([
    getRelatedArticles(article, 3),
    getShopsByIds(article.shop_ids),
    getShopsBySlugs(collectEmbedSlugs(article.content, "shop")),
    articleSlugs.length ? queryArticles({ perPage: 1000 }).then((r) => r.items.filter((a) => articleSlugs.includes(a.slug))) : [],
  ]);
  const cat = article.categories[0];

  return (
    <>
      <ArticleView
        article={article}
        related={related}
        shops={shops}
        embedShops={embedShops}
        embedArticles={embedArticles}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { name: "記事", href: "/articles" },
              ...(cat ? [{ name: cat.name, href: `/category/${cat.slug}` }] : []),
              { name: article.title, href: `/articles/${article.slug}` },
            ]}
          />
        }
      />
      {!article.is_sample && <JsonLd data={articleLd(article)} />}
    </>
  );
}
