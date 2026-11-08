import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { Container, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = { title: "運営者情報", alternates: { canonical: "/company" } };

// 【要記入】の項目は公開前に正しい情報へ書き換えてください
const ROWS: [string, string][] = [
  ["メディア名", `${SITE.name}（${SITE.nameEn}）`],
  ["運営", SITE.operator],
  ["所在地", "【要記入】"],
  ["代表者", "【要記入】"],
  ["お問い合わせ", "お問い合わせフォームよりご連絡ください"],
  ["事業内容", "地域Webメディアの運営"],
];

export default function CompanyPage() {
  return (
    <>
      <PageHeader en="Company" title="運営者情報">
        <Breadcrumbs items={[{ name: "運営者情報", href: "/company" }]} />
      </PageHeader>
      <Container className="max-w-[760px] py-10">
        <dl className="divide-y divide-beige rounded-3xl bg-white p-6 shadow-soft">
          {ROWS.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[8em_1fr] gap-3 py-3">
              <dt className="font-bold text-navy">{k}</dt>
              <dd className={v.startsWith("【") ? "text-rose-deep" : ""}>{v}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </>
  );
}
