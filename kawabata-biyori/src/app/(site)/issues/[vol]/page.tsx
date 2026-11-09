import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getIssueByVol } from "@/lib/data";
import { ArticleCard } from "@/components/site/Cards";
import { Container, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { IssueCover } from "@/components/site/IssueCover";

export const revalidate = 60;
type Props = { params: Promise<{ vol: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const is = await getIssueByVol(Number((await params).vol));
  if (!is) return {};
  return { title: `VOL.${String(is.vol).padStart(2, "0")}（${is.year}年${is.month}月号）`, alternates: { canonical: `/issues/${is.vol}` } };
}

export default async function IssuePage({ params }: Props) {
  const is = await getIssueByVol(Number((await params).vol));
  if (!is) notFound();
  const label = `VOL.${String(is.vol).padStart(2, "0")}`;
  return (
    <>
      <PageHeader en={label} title={`${is.year}年${is.month}月号`} lead={`この号には${is.articles.length}本の記事が載っています。`}>
        <Breadcrumbs items={[{ name: "バックナンバー", href: "/issues" }, { name: label, href: `/issues/${is.vol}` }]} />
      </PageHeader>
      <Container className="grid gap-10 py-10 md:grid-cols-[240px_1fr]">
        <div className="max-w-[240px]"><IssueCover issue={is} large /></div>
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">{is.articles.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
      </Container>
    </>
  );
}
