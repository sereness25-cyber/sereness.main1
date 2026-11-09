import Image from "next/image";
import Link from "next/link";
import { SHOP_CATEGORIES } from "@/lib/constants";
import { getFeaturedArticles, getIssues, getLatestArticles, getArticlesByCategory, getSeriesArticles, getUpcomingEvents } from "@/lib/data";
import { PHOTOS, distinctPhotos, photoForShop, type PhotoKey } from "@/lib/photos";
import type { Article } from "@/lib/types";
import { ArticleCard, EventCard } from "@/components/site/Cards";
import { Container, EmptyState, SectionTitle } from "@/components/site/Section";
import { Thumb } from "@/components/site/Thumb";
import { IssueCover } from "@/components/site/IssueCover";

export const revalidate = 60;

const GUIDE_STEPS = [
  { title: "川反ってどんな街？", body: "旭川沿いに広がる、秋田いちばんの繁華街。", href: "/guide#step1" },
  { title: "お店の種類を知ろう", body: "居酒屋、BAR、スナック。それぞれの楽しみ方。", href: "/guide#step2" },
  { title: "料金システムを知ろう", body: "チャージ、セット料金。注文の前に知っておくと安心。", href: "/guide#step3" },
  { title: "自分に合うお店を探そう", body: "一人飲みも、お酒を飲まない夜も。", href: "/guide#step4" },
  { title: "川反を楽しもう", body: "早めの一軒目から、帰り道まで気持ちよく。", href: "/guide#step5" },
];

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 12" className={`h-3 w-6 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M0 6h22M17 1l5 5-5 5" />
    </svg>
  );
}

function HeadingScript({ ja, en }: { ja: string; en: string }) {
  return (
    <div className="mb-4 flex items-end gap-3 border-b border-blush/50 pb-2">
      <h2 className="font-mincho text-[1.35rem] font-medium tracking-[0.12em] text-blush md:text-[1.8rem]">{ja}</h2>
      <span className="pb-1 font-en text-sm italic text-ink">{en}</span>
    </div>
  );
}

function PickCard({ article, photo }: { article: Article; photo: PhotoKey }) {
  const cat = article.categories[0];
  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col">
      <div className="relative">
        <Thumb src={article.thumbnail} alt={article.thumbnail_alt} seed={article.slug} isAi={article.thumbnail_is_ai} photo={photo} className="aspect-[4/3] md:aspect-[16/9]" sizes="(min-width:768px) 380px, 33vw" />
        {cat && <span className="absolute bottom-0 left-2 bg-ivory px-2 pt-0.5 font-mincho text-[0.68rem] font-bold tracking-wider text-blush md:left-3 md:px-3 md:text-sm">{cat.name}</span>}
      </div>
      <div className="flex flex-1 items-end gap-1 border-r border-navy/10 px-1.5 pb-1 pt-2 md:px-3 md:pt-3">
        <h3 className="headline flex-1 text-[0.78rem] leading-[1.6] text-ink group-hover:text-blush md:text-[1.05rem]">{article.title}</h3>
        <Arrow className="mb-1.5 text-blush transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [featured, latest, people, series, events, issues] = await Promise.all([
    getFeaturedArticles(4),
    getLatestArticles(6),
    getArticlesByCategory("people", 1),
    getSeriesArticles(2),
    getUpcomingEvents(3),
    getIssues(),
  ]);
  const cover = featured[0];
  const picks = featured.slice(0, 3);
  const person = people[0];
  const pickPhotos = distinctPhotos(picks.map((a) => a.categories[0]?.slug));
  const latestPhotos = distinctPhotos(latest.map((a) => a.categories[0]?.slug));

  return (
    <>
      {/* 巻頭特集 */}
      <section className="mx-auto max-w-[1200px] md:px-6 md:pt-4">
        <div className="relative min-h-[440px] overflow-hidden bg-cocoa md:min-h-[540px]">
          <div className="absolute inset-y-0 right-0 w-full md:w-[62%]">
            <Image src={PHOTOS.street.src} alt="" fill priority sizes="(min-width:1200px) 750px, 100vw" className="object-cover object-right" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#2a1a19]/90 via-[#2a1a19]/55 to-transparent md:from-cocoa md:from-40% md:via-cocoa/70 md:via-55%" />
          <span className="absolute bottom-2 right-2 bg-black/50 px-2 py-0.5 text-[0.65rem] tracking-wider text-white">写真はイメージです</span>
          <div className="relative flex min-h-[440px] flex-col justify-center px-6 py-10 text-white md:min-h-[540px] md:px-14">
            <p className="w-fit border border-white/80 px-3 py-1 font-mincho text-sm tracking-[0.2em]">巻頭特集</p>
            <h1 className="mt-5 font-mincho text-[2.6rem] font-medium leading-[1.2] tracking-[0.04em] drop-shadow md:text-[4rem]">
              今夜、
              <br />
              川反に
              <br />
              行きたくなる。
            </h1>
            <p className="mt-4 font-mincho text-[0.95rem] leading-[1.9] tracking-[0.12em] text-white/95 md:text-[1.05rem]">
              お酒、食、そして人。
              <br />
              この街が愛される理由を、
              <br />
              編集部がたどります。
            </p>
            {cover && (
              <Link href={`/articles/${cover.slug}`} className="mt-6 inline-flex min-h-12 w-fit items-center gap-6 bg-blush px-8 font-mincho font-bold tracking-[0.2em] text-white transition hover:brightness-110">
                特集を読む <Arrow />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Editor's Pick */}
      <section className="pt-10 md:pt-14">
        <Container>
          <div className="mb-4 flex items-baseline gap-4">
            <h2 className="font-en text-[2.1rem] italic leading-none text-blush md:text-[2.8rem]">Editor’s Pick</h2>
            <span className="font-mincho text-sm tracking-[0.2em] text-ink">編集部のおすすめ</span>
          </div>
          {picks.length ? (
            <div className="grid grid-cols-3 gap-2 md:gap-6">{picks.map((a, i) => <PickCard key={a.id} article={a} photo={pickPhotos[i]} />)}</div>
          ) : (
            <EmptyState title="記事を準備しています" />
          )}
        </Container>
      </section>

      {/* 特集インタビュー */}
      {person && (
        <section className="pt-10 md:pt-14">
          <Container>
            <Link href={`/articles/${person.slug}`} className="group relative grid grid-cols-[1.3fr_1fr] overflow-hidden bg-cocoa text-white md:grid-cols-[1.15fr_1fr]">
              <div className="relative z-10 min-w-0 px-4 py-6 md:px-10 md:py-12">
                <p className="flex flex-wrap items-center gap-3">
                  <span className="bg-blush/90 px-2 py-0.5 font-mincho text-[0.7rem] font-bold tracking-wider md:px-3 md:py-1 md:text-sm">特集インタビュー</span>
                  <span className="font-mincho text-sm tracking-[0.15em] md:text-lg">川反の人々</span>
                </p>
                <h2 className="mt-3 font-mincho text-[1.1rem] font-medium leading-[1.6] tracking-[0.06em] md:mt-5 md:text-[2rem]">{person.title}</h2>
                <p className="mt-2 line-clamp-3 max-w-md font-mincho text-[0.7rem] leading-6 text-white/85 md:mt-3 md:line-clamp-none md:text-sm md:leading-7">{person.excerpt}</p>
                <span className="mt-4 inline-flex min-h-10 items-center gap-4 bg-blush px-4 font-mincho text-[0.75rem] font-bold tracking-[0.12em] transition group-hover:brightness-110 md:mt-6 md:min-h-11 md:gap-6 md:px-6 md:text-sm">
                  記事を読む <Arrow />
                </span>
              </div>
              <div className="relative">
                <Image src={PHOTOS.portrait.src} alt="" fill sizes="(min-width:768px) 520px, 100vw" className="object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-r from-cocoa via-transparent to-transparent" />
                <span className="absolute bottom-2 right-2 bg-black/50 px-2 py-0.5 text-[0.65rem] tracking-wider text-white">写真はイメージです</span>
              </div>
            </Link>
          </Container>
        </section>
      )}

      {/* お店ガイド・連載 */}
      <section className="pt-10 md:pt-14">
        <Container className="grid grid-cols-1 gap-8 md:grid-cols-[1.9fr_1fr] md:gap-0">
          <div className="min-w-0 md:border-r md:border-navy/15 md:pr-8">
            <HeadingScript ja="お店ガイド" en="Shop Guide" />
            <ul className="grid grid-cols-3 gap-2 md:gap-4">
              {SHOP_CATEGORIES.filter((c) => ["izakaya", "bar", "snack"].includes(c.value)).map((c) => (
                <li key={c.value}>
                  <Link href={`/shops?category=${c.value}`} className="group relative block">
                    <Thumb src={null} alt={`${c.label}のお店`} photo={photoForShop(c.value)} className="aspect-[16/10]" sizes="(min-width:768px) 240px, 33vw" />
                    <span className="absolute bottom-0 left-2 bg-[#f6dfe3] px-2 pt-0.5 font-mincho text-[0.75rem] font-bold text-ink group-hover:text-blush md:text-sm">{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/shops" className="mt-4 inline-flex items-center gap-3 font-mincho text-sm text-ink hover:text-blush">すべてのお店を見る <Arrow className="text-blush" /></Link>
          </div>
          <div className="min-w-0 md:pl-8">
            <HeadingScript ja="連載" en="Series" />
            {series.length ? (
              <ul className="space-y-4">
                {series.map((a) => (
                  <li key={a.id}>
                    <Link href={`/articles/${a.slug}`} className="group grid grid-cols-[96px_1fr] items-center gap-3">
                      <Thumb src={a.thumbnail} alt={a.thumbnail_alt} seed={a.slug} photo="whisky" className="aspect-[4/3]" sizes="96px" />
                      <span className="flex items-end gap-2">
                        <span className="headline flex-1 text-[0.95rem] text-ink group-hover:text-blush">{a.title}</span>
                        <Arrow className="mb-1 text-blush" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">連載を準備しています。</p>
            )}
          </div>
        </Container>
      </section>

      {/* バックナンバー */}
      <section className="pt-10 md:pt-14">
        <Container>
          <HeadingScript ja="バックナンバー" en="Back Number" />
          <ul className="grid grid-cols-3 gap-3 md:gap-8">
            {issues.slice(0, 3).map((is) => (
              <li key={is.key} className="min-w-0">
                <Link href={`/issues/${is.vol}`} className="group grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,110px)_1fr] sm:items-center">
                  <IssueCover issue={is} />
                  <span className="min-w-0">
                    <span className="block font-en text-[1rem] italic text-ink">VOL.<span className="text-[1.3em]">{String(is.vol).padStart(2, "0")}</span></span>
                    <span className="headline mt-0.5 block text-[0.8rem] text-ink group-hover:text-blush md:text-[0.95rem]">{is.cover.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/issues" className="mt-5 inline-flex items-center gap-3 font-mincho text-sm text-ink hover:text-blush">バックナンバーをすべて見る <Arrow className="text-blush" /></Link>
        </Container>
      </section>

      {/* はじめての川反 */}
      <section className="mt-14 bg-navy py-14 text-white md:mt-20 md:py-20">
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
          </div>
        </Container>
      </section>

      {/* 新着 */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionTitle en="Latest" ja="新着記事" href="/articles" />
          {latest.length ? (
            <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{latest.map((a, i) => <ArticleCard key={a.id} article={a} photo={latestPhotos[i]} />)}</div>
          ) : (
            <EmptyState title="記事を準備しています" />
          )}
        </Container>
      </section>

      {/* イベント */}
      <section className="pb-6 md:pb-10">
        <Container>
          <SectionTitle en="Events" ja="イベント情報" href="/events" />
          {events.length ? (
            <div className="grid gap-x-12 md:grid-cols-3">{events.map((e) => <EventCard key={e.id} event={e} />)}</div>
          ) : (
            <EmptyState title="開催予定のイベントはまだありません">イベント情報は随時追加していきます。</EmptyState>
          )}
        </Container>
      </section>
    </>
  );
}
