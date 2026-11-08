import type { Metadata } from "next";
import { searchAll } from "@/lib/data";
import { ArticleCard, EventCard, ShopCard } from "@/components/site/Cards";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = { title: "サイト内検索", robots: { index: false, follow: true } };

type SP = Promise<{ q?: string; scope?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const { q = "", scope } = await searchParams;
  const sc = scope === "articles" || scope === "shops" || scope === "events" ? scope : undefined;
  const res = await searchAll(q, sc);
  const count = res.articles.length + res.shops.length + res.events.length;
  return (
    <>
      <PageHeader en="Search" title="サイト内検索">
        <Breadcrumbs items={[{ name: "サイト内検索", href: "/search" }]} />
      </PageHeader>
      <Container className="py-10">
        <form method="get" role="search" className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-soft sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">キーワード</span>
            <input type="search" name="q" defaultValue={q} placeholder="記事・お店・イベントを検索" className="h-12 w-full rounded-xl border border-beige px-4" />
          </label>
          <label>
            <span className="sr-only">検索対象</span>
            <select name="scope" defaultValue={sc ?? ""} className="h-12 w-full rounded-xl border border-beige px-3 sm:w-40">
              <option value="">すべて</option>
              <option value="articles">記事</option>
              <option value="shops">お店</option>
              <option value="events">イベント</option>
            </select>
          </label>
          <button type="submit" className="h-12 rounded-full bg-navy px-8 font-bold text-white">検索</button>
        </form>

        {q && <p className="mt-6 text-sm text-muted">「{q}」の検索結果：{count}件</p>}
        {q && count === 0 && <div className="mt-4"><EmptyState title="見つかりませんでした">別のことばで検索してみてください。</EmptyState></div>}

        {res.articles.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg text-navy">記事（{res.articles.length}）</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{res.articles.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          </section>
        )}
        {res.shops.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg text-navy">お店（{res.shops.length}）</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{res.shops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>
          </section>
        )}
        {res.events.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg text-navy">イベント（{res.events.length}）</h2>
            <div className="grid gap-4 md:grid-cols-2">{res.events.map((e) => <EventCard key={e.id} event={e} />)}</div>
          </section>
        )}
      </Container>
    </>
  );
}
