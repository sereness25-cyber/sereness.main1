import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug, isEventPast } from "@/lib/data";
import { formatEventDate } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/html";
import { eventLd } from "@/lib/jsonld";
import { Thumb } from "@/components/site/Thumb";
import { SampleBadge } from "@/components/site/Badges";
import { Container } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getEventBySlug((await params).slug);
  if (!e) return {};
  return { title: e.title, alternates: { canonical: `/events/${e.slug}` }, robots: e.is_sample ? { index: false } : undefined };
}

export default async function EventPage({ params }: Props) {
  const e = await getEventBySlug((await params).slug);
  if (!e) notFound();
  const past = isEventPast(e);
  const rows: [string, string][] = [
    ["日時", formatEventDate(e.starts_at, e.ends_at)],
    ["会場", e.venue || "—"],
    ["参加料金", e.fee || "—"],
    ["主催", e.organizer || "—"],
    ["申込方法", e.how_to_apply || "—"],
  ];
  return (
    <Container className="max-w-[860px] pt-6 md:pt-10">
      <Breadcrumbs items={[{ name: "イベント", href: "/events" }, { name: e.title, href: `/events/${e.slug}` }]} />
      <div className="flex flex-wrap gap-1.5">
        {past && <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-white">終了しました</span>}
        {e.is_sample && <SampleBadge />}
      </div>
      <h1 className="mt-3 text-[1.6rem] text-navy md:text-[2rem]">{e.title}</h1>
      <Thumb src={e.image} alt={e.image_alt || e.title} label="EVENT" seed={e.slug} priority className="mt-6 rounded-3xl" />
      <dl className="mt-8 divide-y divide-beige rounded-3xl bg-white p-6 shadow-soft">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[6em_1fr] gap-3 py-3"><dt className="font-bold text-navy">{k}</dt><dd className="whitespace-pre-line">{v}</dd></div>
        ))}
      </dl>
      <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(e.content) }} />
      <JsonLd data={eventLd(e)} />
    </Container>
  );
}
