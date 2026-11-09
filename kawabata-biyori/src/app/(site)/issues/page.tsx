import type { Metadata } from "next";
import Link from "next/link";
import { getIssues } from "@/lib/data";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { IssueCover } from "@/components/site/IssueCover";

export const revalidate = 60;
export const metadata: Metadata = { title: "バックナンバー", description: "かわばた日和の月ごとのバックナンバー。", alternates: { canonical: "/issues" } };

export default async function IssuesPage() {
  const issues = await getIssues();
  return (
    <>
      <PageHeader en="Back Number" title="バックナンバー" lead="公開した月ごとに、記事を1冊の号としてまとめています。">
        <Breadcrumbs items={[{ name: "バックナンバー", href: "/issues" }]} />
      </PageHeader>
      <Container className="py-10">
        {issues.length ? (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {issues.map((is) => (
              <li key={is.key}>
                <Link href={`/issues/${is.vol}`} className="group block">
                  <IssueCover issue={is} large />
                  <p className="mt-3 font-en text-lg italic text-ink">VOL.{String(is.vol).padStart(2, "0")}<span className="ml-2 text-sm text-muted">{is.year}年{is.month}月号</span></p>
                  <p className="headline mt-1 text-[0.95rem] text-ink group-hover:text-blush">{is.cover.title}</p>
                  <p className="mt-1 text-xs text-muted">{is.articles.length}本の記事</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="まだ号がありません" />
        )}
      </Container>
    </>
  );
}
