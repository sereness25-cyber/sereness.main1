import type { Metadata } from "next";
import { getAllEvents, getAllShops, queryArticles, searchAll } from "@/lib/data";
import { IS_STATIC, articleText, eventText, shopText } from "@/lib/static-site";
import { ArticleCard, EventCard, ShopCard } from "@/components/site/Cards";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = { title: "サイト内検索", robots: { index: false, follow: true } };

type SP = Promise<{ q?: string; scope?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const { q = "", scope } = await searchParams;
  const sc = scope === "articles" || scope === "shops" || scope === "events" ? scope : undefined;
  // 静的書き出しでは全部を入れておき、ブラウザでキーワードに合うものだけを出す
  const res = IS_STATIC
    ? { articles: (await queryArticles({ perPage: 10000 })).items, shops: await getAllShops(), events: await getAllEvents() }
    : await searchAll(q, sc);
  const count = res.articles.length + res.shops.length + res.events.length;
  const hide = IS_STATIC; // 検索するまでは何も出さない
  return (
    <>
      <PageHeader en="Search" title="サイト内検索">
        <Breadcrumbs items={[{ name: "サイト内検索", href: "/search" }]} />
      </PageHeader>
      <Container className="py-10">
        <form method="get" role="search" data-kb-filter="search" className="flex flex-col gap-3 border border-navy/15 bg-white p-5 sm:flex-row">
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
          <button type="submit" className="h-12 bg-navy px-8 font-bold text-white">検索</button>
        </form>

        <p className="mt-6 text-sm text-muted" data-kb-count="「{q}」の検索結果：{n}件" hidden={hide || !q}>「{q}」の検索結果：{count}件</p>
        <div className="mt-4" data-kb-empty hidden={hide || !q || count > 0}><EmptyState title="見つかりませんでした">別のことばで検索してみてください。</EmptyState></div>

        {res.articles.length > 0 && (
          <section className="mt-8" data-kb-section="articles" hidden={hide}>
            <h2 className="mb-4 text-lg text-navy" data-kb-heading="記事（{n}）">記事（{res.articles.length}）</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{res.articles.map((a) => <div key={a.id} data-kb-item data-text={articleText(a)}><ArticleCard article={a} /></div>)}</div>
          </section>
        )}
        {res.shops.length > 0 && (
          <section className="mt-10" data-kb-section="shops" hidden={hide}>
            <h2 className="mb-4 text-lg text-navy" data-kb-heading="お店（{n}）">お店（{res.shops.length}）</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{res.shops.map((s) => <div key={s.id} data-kb-item data-text={shopText(s)}><ShopCard shop={s} /></div>)}</div>
          </section>
        )}
        {res.events.length > 0 && (
          <section className="mt-10" data-kb-section="events" hidden={hide}>
            <h2 className="mb-4 text-lg text-navy" data-kb-heading="イベント（{n}）">イベント（{res.events.length}）</h2>
            <div className="grid gap-4 md:grid-cols-2">{res.events.map((e) => <div key={e.id} data-kb-item data-text={eventText(e)}><EventCard event={e} /></div>)}</div>
          </section>
        )}
      </Container>
    </>
  );
}
