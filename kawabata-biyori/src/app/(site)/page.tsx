import Link from "next/link";
import { SITE, SHOP_CATEGORIES } from "@/lib/constants";
import { getFeaturedArticles, getLatestArticles, getArticlesByCategory, getUpcomingEvents } from "@/lib/data";
import { HeroArt } from "@/components/site/HeroArt";
import { ArticleCard, ArticleRow, EventCard } from "@/components/site/Cards";
import { Container, EmptyState, SectionTitle } from "@/components/site/Section";
import { Thumb } from "@/components/site/Thumb";

export const revalidate = 60;

const GUIDE_STEPS = [
  { title: "川反ってどんな街？", body: "旭川沿いに広がる、秋田いちばんの繁華街。", href: "/guide#step1" },
  { title: "お店の種類を知ろう", body: "居酒屋、BAR、スナック。それぞれの楽しみ方。", href: "/guide#step2" },
  { title: "料金システムを知ろう", body: "チャージ、セット料金。注文の前に知っておくと安心。", href: "/guide#step3" },
  { title: "自分に合うお店を探そう", body: "一人飲みも、お酒を飲まない夜も。", href: "/guide#step4" },
  { title: "川反を楽しもう", body: "早めの一軒目から、帰り道まで気持ちよく。", href: "/guide#step5" },
];

export default async function HomePage() {
  const [featured, latest, people, events] = await Promise.all([
    getFeaturedArticles(3),
    getLatestArticles(6),
    getArticlesByCategory("people", 1),
    getUpcomingEvents(3),
  ]);
  const [cover, ...subs] = featured;
  const now = new Date();
  const issue = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  const person = people[0];

  return (
    <>
      {/* 表紙 */}
      <section className="grain">
        <Container className="grid gap-8 pb-14 pt-8 md:pt-12 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0">
          <div className="order-1 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <p className="flex items-center justify-between border-b border-navy pb-2 font-en text-sm italic tracking-[0.2em] text-navy">
              <span>Akita Kawabata Web Magazine</span>
              <span>No. {issue}</span>
            </p>
            <h1 className="mt-5 font-en text-[3.4rem] font-semibold leading-[0.92] tracking-tight text-navy md:text-[5rem] lg:text-[4.6rem]">
              KAWABATA
              <br />
              BIYORI
            </h1>
            <p className="headline mt-4 text-[1.9rem] text-navy md:text-[2.2rem]">{SITE.name}</p>
            <p className="mt-4 text-[0.95rem] leading-8 text-ink">
              {SITE.sub[0]}
              <br />
              {SITE.sub[1]}
            </p>
            <Link href="/guide" className="mt-6 inline-flex min-h-12 w-fit items-center gap-3 border border-navy bg-navy px-7 font-mincho font-bold tracking-widest text-white transition hover:bg-ivory hover:text-navy">
              川反を知る <span aria-hidden="true">→</span>
            </Link>
          </div>

          <nav aria-label="今号の目次" className="order-3 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:self-end">
            <p className="rule-double pt-3 font-en text-lg italic tracking-[0.2em] text-navy">In this issue</p>
            <ol>
              {featured.map((a, i) => <li key={a.id}><ArticleRow article={a} index={i + 1} /></li>)}
            </ol>
          </nav>

          <div className="relative order-2 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/4] lg:aspect-[4/5]">
              <HeroArt />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
              <p className="tate headline absolute right-5 top-6 text-[1.7rem] text-white drop-shadow md:right-8 md:text-[2.2rem]">{SITE.catch}</p>
              <p className="absolute bottom-4 left-5 font-en text-sm italic tracking-[0.2em] text-white/90">Cover — 川反の夜、旭川のほとり</p>
            </div>
            <p className="mt-2 text-right text-[0.7rem] text-muted">表紙はイラストです（写真は準備中）</p>
          </div>
        </Container>
      </section>

      {/* 特集 */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionTitle en="Feature" ja="特集" lead="編集部がいま届けたい、川反の話。" href="/articles" linkLabel="記事をすべて見る" />
          {cover ? (
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <ArticleCard article={cover} size="lg" priority />
              </div>
              <div className="grid content-start gap-10 lg:col-span-4 lg:border-l lg:border-navy/15 lg:pl-10">
                {subs.map((a) => <ArticleCard key={a.id} article={a} />)}
              </div>
            </div>
          ) : (
            <EmptyState title="記事を準備しています" />
          )}
        </Container>
      </section>

      {/* はじめての川反（特別編） */}
      <section className="bg-navy py-14 text-white md:py-20">
        <Container className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="flex items-start gap-6 md:flex-col">
            <p className="font-en text-lg italic tracking-[0.25em] text-rose">Special</p>
            <h2 className="headline text-[2rem] md:tate md:text-[2.6rem]">はじめての川反</h2>
          </div>
          <div>
            <p className="max-w-xl leading-8 text-white/85">料金のこと、お店の種類、一人でも入れるか。はじめての人がつまずきやすいところを、5つのステップにまとめました。</p>
            <ol className="mt-8 border-t border-white/25">
              {GUIDE_STEPS.map((s, i) => (
                <li key={s.title}>
                  <Link href={s.href} className="group grid grid-cols-[3.2rem_1fr_auto] items-baseline gap-3 border-b border-white/25 py-5">
                    <span className="font-en text-[2rem] italic leading-none text-rose">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className="headline block text-[1.2rem] group-hover:underline">{s.title}</span>
                      <span className="mt-1 block text-sm text-white/70">{s.body}</span>
                    </span>
                    <span aria-hidden="true" className="text-rose">→</span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href="/guide" className="mt-8 inline-flex min-h-12 items-center gap-3 border border-white px-7 font-mincho font-bold tracking-widest transition hover:bg-white hover:text-navy">
              ガイドを読む <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* 新着 */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionTitle en="Latest" ja="新着記事" href="/articles" />
          {latest.length ? (
            <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          ) : (
            <EmptyState title="記事を準備しています" />
          )}
        </Container>
      </section>

      {/* お店の索引 */}
      <section className="bg-beige/60 py-14 md:py-20">
        <Container>
          <SectionTitle en="Directory" ja="お店を探す" lead="気分に合わせて、今夜の一軒を。" href="/shops" linkLabel="すべてのお店" />
          <ul className="grid gap-x-12 md:grid-cols-2">
            {SHOP_CATEGORIES.map((c) => (
              <li key={c.value}>
                <Link href={`/shops?category=${c.value}`} className="group flex items-baseline gap-3 border-b border-navy/20 py-4">
                  <span className="headline text-[1.25rem] text-navy">{c.label}</span>
                  <span className="font-en text-sm italic tracking-widest text-rose-deep">{c.en}</span>
                  <span aria-hidden="true" className="mb-1 flex-1 border-b border-dotted border-navy/30" />
                  <span aria-hidden="true" className="text-navy transition group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link href="/shops?beginner=1" className="border-b border-navy text-navy hover:text-rose-deep">初心者歓迎のお店</Link>
            <Link href="/shops?solo=1" className="border-b border-navy text-navy hover:text-rose-deep">一人で入りやすいお店</Link>
            <Link href="/shops?nonalc=1" className="border-b border-navy text-navy hover:text-rose-deep">ノンアル対応のお店</Link>
            <Link href="/map" className="border-b border-navy text-navy hover:text-rose-deep">地図で探す</Link>
          </div>
        </Container>
      </section>

      {/* 川反の人々 */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionTitle en="People" ja="川反の人々" lead="この街で働く人の、それぞれの物語。" href="/category/people" />
          {person ? (
            <Link href={`/articles/${person.slug}`} className="group grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <Thumb src={person.thumbnail} alt={person.thumbnail_alt} label="Interview" seed={person.slug} isAi={person.thumbnail_is_ai} className="aspect-[4/3]" />
              <div>
                <p className="kicker">Interview</p>
                <p aria-hidden="true" className="mt-4 font-mincho text-[4rem] leading-none text-rose">“</p>
                <h3 className="headline -mt-4 text-[1.5rem] text-navy group-hover:underline md:text-[1.9rem]">{person.title}</h3>
                <p className="mt-4 leading-8 text-muted">{person.excerpt}</p>
                <span className="mt-6 inline-block border-b border-navy pb-0.5 text-sm text-navy">続きを読む →</span>
              </div>
            </Link>
          ) : (
            <EmptyState title="インタビュー記事を準備しています" />
          )}
        </Container>
      </section>

      {/* イベント */}
      <section className="pb-6 pt-4 md:pb-10">
        <Container>
          <SectionTitle en="Calendar" ja="イベント情報" href="/events" />
          {events.length ? (
            <div className="grid gap-x-12 md:grid-cols-3">
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
