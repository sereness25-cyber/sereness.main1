import type { Metadata } from "next";
import { getAllFeatured } from "@/lib/data";
import { ArticleCard } from "@/components/site/Cards";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const revalidate = 60;
export const metadata: Metadata = { title: "特集", description: "かわばた日和の特集記事。", alternates: { canonical: "/features" } };

export default async function FeaturesPage() {
  const items = await getAllFeatured();
  const [first, ...rest] = items;
  return (
    <>
      <PageHeader en="Features" title="特集" lead="編集部がいま届けたい、川反の話。">
        <Breadcrumbs items={[{ name: "特集", href: "/features" }]} />
      </PageHeader>
      <Container className="py-10">
        {first ? (
          <>
            <ArticleCard article={first} size="lg" priority />
            {rest.length > 0 && <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{rest.map((a) => <ArticleCard key={a.id} article={a} />)}</div>}
          </>
        ) : (
          <EmptyState title="特集記事を準備しています" />
        )}
      </Container>
    </>
  );
}
