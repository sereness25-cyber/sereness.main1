import type { Metadata } from "next";
import { getSeriesArticles } from "@/lib/data";
import { ArticleCard } from "@/components/site/Cards";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const revalidate = 60;
export const metadata: Metadata = { title: "連載", description: "かわばた日和の連載記事。", alternates: { canonical: "/series" } };

export default async function SeriesPage() {
  const items = await getSeriesArticles();
  return (
    <>
      <PageHeader en="Series" title="連載" lead="続けて追いかける、川反の物語。記事に「連載」タグを付けるとここに並びます。">
        <Breadcrumbs items={[{ name: "連載", href: "/series" }]} />
      </PageHeader>
      <Container className="py-10">
        {items.length ? (
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{items.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        ) : (
          <EmptyState title="連載を準備しています" />
        )}
      </Container>
    </>
  );
}
