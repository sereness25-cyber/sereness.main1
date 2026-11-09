import type { Metadata } from "next";
import { getPastEvents, getUpcomingEvents } from "@/lib/data";
import { EventCard } from "@/components/site/Cards";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const revalidate = 60;
export const metadata: Metadata = { title: "イベント", description: "川反で開かれるイベント情報。", alternates: { canonical: "/events" } };

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);
  return (
    <>
      <PageHeader en="Events" title="イベント" lead="川反で開かれるイベントを、開催日順に紹介します。">
        <Breadcrumbs items={[{ name: "イベント", href: "/events" }]} />
      </PageHeader>
      <Container className="py-10">
        <h2 className="mb-4 text-xl text-navy">開催予定</h2>
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2">{upcoming.map((e) => <EventCard key={e.id} event={e} />)}</div>
        ) : (
          <EmptyState title="開催予定のイベントはまだありません">イベント情報は随時追加していきます。</EmptyState>
        )}
        {past.length > 0 && (
          <>
            <h2 className="mb-4 mt-14 text-xl text-navy">過去のイベント</h2>
            <div className="grid gap-4 opacity-80 md:grid-cols-2">{past.map((e) => <EventCard key={e.id} event={e} />)}</div>
          </>
        )}
      </Container>
    </>
  );
}
