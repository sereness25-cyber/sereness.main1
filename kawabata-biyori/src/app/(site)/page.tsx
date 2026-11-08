import Link from "next/link";
import { SITE, SHOP_CATEGORIES } from "@/lib/constants";
import { getFeaturedArticles, getLatestArticles, getArticlesByCategory, getUpcomingEvents } from "@/lib/data";
import { HeroArt } from "@/components/site/HeroArt";
import { ArticleCard, EventCard } from "@/components/site/Cards";
import { Container, EmptyState, SectionTitle } from "@/components/site/Section";

export const revalidate = 60;

const GUIDE_TOPICS = [
  { n: "01", title: "川反ってどんな街？", href: "/guide#step1", icon: "M12 3c-3 0-5 2-5 4v8c0 2 2 4 5 4s5-2 5-4V7c0-2-2-4-5-4ZM7 9h10M7 13h10M12 1v2M12 19v3" },
  { n: "02", title: "初めてのお店選び", href: "/guide#step4", icon: "M4 10h16l-1.5 10h-13ZM7 10l2-6M17 10l-2-6M9 14v3M15 14v3" },
  { n: "03", title: "料金システム", href: "/guide#step3", icon: "M4 6h16v12H4ZM4 10h16M8 15h3" },
  { n: "04", title: "一人飲み", href: "/articles/solo-drinking", icon: "M6 4h12l-1 7a5 5 0 0 1-10 0ZM12 16v4M8 20h8" },
  { n: "05", title: "お酒を飲まない楽しみ方", href: "/articles/without-alcohol", icon: "M5 8h12v5a6 6 0 0 1-12 0ZM17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3" },
];

export default async function HomePage() {
  const [featured, latest, people, events] = await Promise.all([
    getFeaturedArticles(3),
    getLatestArticles(6),
    getArticlesByCategory("people", 3),
    getUpcomingEvents(3),
  ]);

  return (
    <>
      {/* メインビジュアル */}
      <section className="relative isolate overflow-hidden">
        <div className="relative h-[78svh] min-h-[460px] max-h-[720px]">
          <HeroArt />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/5 via-transparent to-navy/50" />
          <Container className="relative flex h-full flex-col justify-end pb-8 md:justify-center md:pb-0">
            <div className="fade-up max-w-xl rounded-[28px] bg-navy/40 p-6 text-white ring-1 ring-white/15 backdrop-blur-md md:p-9">
              <p className="font-en text-sm italic tracking-[0.35em] text-white/90">{SITE.nameEn}</p>
              <h1 className="mt-2 font-maru text-[2.6rem] leading-tight drop-shadow md:text-[3.6rem]">{SITE.name}</h1>
              <p className="mt-4 font-maru text-[1.35rem] font-bold drop-shadow md:text-[1.6rem]">{SITE.catch}</p>
              <p className="mt-3 text-[0.95rem] leading-8 text-white/95 drop-shadow">
                {SITE.sub[0]}
                <br />
                {SITE.sub[1]}
              </p>
              <Link href="/guide" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 py-3 font-maru font-bold text-navy shadow-lift transition hover:-translate-y-0.5">
                川反を知る <span aria-hidden="true" className="text-rose-deep">→</span>
              </Link>
            </div>
          </Container>
        </div>
        <p className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-0.5 text-[0.68rem] text-white">イラスト（写真は準備中）</p>
      </section>

      {/* 注目記事 */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionTitle en="Pick up" ja="注目の記事" lead="編集部のおすすめ" />
          {featured.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((a, i) => <ArticleCard key={a.id} article={a} priority={i === 0} />)}
            </div>
          ) : (
            <EmptyState title="記事を準備しています" />
          )}
        </Container>
      </section>

      {/* はじめての川反 */}
      <section className="bg-white py-14 md:py-20">
        <Container>
          <SectionTitle en="First time" ja="はじめての川反" lead="知っておくと安心。川反デビューの手引き" href="/guide" linkLabel="ガイドを読む" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {GUIDE_TOPICS.map((t) => (
              <li key={t.n} className={t.n === "05" ? "col-span-2 md:col-span-1" : ""}>
                <Link href={t.href} className="flex h-full flex-col gap-2 rounded-3xl bg-ivory p-5 transition hover:-translate-y-1 hover:shadow-soft">
                  <span className="grid size-11 place-items-center rounded-full bg-white text-rose-deep shadow-soft" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
                  </span>
                  <span className="font-en text-sm italic text-rose-deep">{t.n}</span>
                  <span className="font-maru font-bold leading-snug text-navy">{t.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 新着記事 */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionTitle en="New" ja="新着記事" href="/articles" />
          {latest.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          ) : (
            <EmptyState title="記事を準備しています" />
          )}
        </Container>
      </section>

      {/* お店を探す */}
      <section className="bg-beige/60 py-14 md:py-20">
        <Container>
          <SectionTitle en="Find a shop" ja="お店を探す" lead="気分に合わせて、今夜の一軒を。" href="/shops" linkLabel="すべてのお店" />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SHOP_CATEGORIES.map((c) => (
              <li key={c.value}>
                <Link href={`/shops?category=${c.value}`} className="flex flex-col items-center gap-1 rounded-3xl bg-white px-3 py-6 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
                  <span className="font-en text-xs italic tracking-widest text-rose-deep">{c.en}</span>
                  <span className="font-maru text-lg font-bold text-navy">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/shops?beginner=1" className="rounded-full bg-white px-4 py-2 text-sm text-navy shadow-soft">初心者歓迎のお店</Link>
            <Link href="/shops?solo=1" className="rounded-full bg-white px-4 py-2 text-sm text-navy shadow-soft">一人で入りやすいお店</Link>
            <Link href="/shops?nonalc=1" className="rounded-full bg-white px-4 py-2 text-sm text-navy shadow-soft">ノンアル対応のお店</Link>
            <Link href="/map" className="rounded-full bg-navy px-4 py-2 text-sm text-white shadow-soft">地図で探す</Link>
          </div>
        </Container>
      </section>

      {/* 川反の人々 */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionTitle en="People" ja="川反の人々" lead="この街で働く人の、それぞれの物語。" href="/category/people" />
          {people.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          ) : (
            <EmptyState title="インタビュー記事を準備しています" />
          )}
        </Container>
      </section>

      {/* イベント */}
      <section className="bg-white py-14 md:py-20">
        <Container>
          <SectionTitle en="Events" ja="イベント情報" href="/events" />
          {events.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {events.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          ) : (
            <EmptyState title="開催予定のイベントはまだありません">イベント情報は随時追加していきます。</EmptyState>
          )}
        </Container>
      </section>
    </>
  );
}
