import Link from "next/link";
import type { Article, EventItem, Shop } from "@/lib/types";
import { BUDGET_LABELS, shopCategoryLabel } from "@/lib/constants";
import { formatDate, formatEventDate } from "@/lib/format";
import { Thumb } from "./Thumb";
import { BeginnerMark, CategoryBadge, DraftBadge, PrBadge, SampleBadge } from "./Badges";

export function ArticleCard({ article, priority = false, showExcerpt = true }: { article: Article; priority?: boolean; showExcerpt?: boolean }) {
  const cat = article.categories[0];
  return (
    <article className="group h-full">
      <Link href={`/articles/${article.slug}`} className="flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
        <Thumb src={article.thumbnail} alt={article.thumbnail_alt} label={cat?.name} seed={article.slug} isAi={article.thumbnail_is_ai} priority={priority} />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {cat && <CategoryBadge name={cat.name} />}
            {article.is_sponsored && <PrBadge />}
            {article.is_sample && <DraftBadge />}
          </div>
          <h3 className="text-[1.05rem] leading-relaxed text-navy group-hover:underline group-hover:decoration-rose group-hover:underline-offset-4">{article.title}</h3>
          {showExcerpt && <p className="line-clamp-2 text-sm leading-7 text-muted">{article.excerpt}</p>}
          <p className="mt-auto pt-1 text-xs text-muted">
            {article.published_at ? <time dateTime={article.published_at}>{formatDate(article.published_at)}</time> : "未公開"}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function ArticleRow({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group flex gap-4 rounded-2xl bg-card p-3 shadow-soft transition hover:shadow-lift">
      <Thumb src={article.thumbnail} alt={article.thumbnail_alt} seed={article.slug} isAi={article.thumbnail_is_ai} className="w-32 shrink-0 rounded-xl sm:w-40" sizes="160px" />
      <div className="min-w-0 py-1">
        <p className="text-xs text-rose-deep">{article.categories[0]?.name}</p>
        <h3 className="mt-1 line-clamp-2 text-[0.95rem] leading-relaxed text-navy group-hover:underline">{article.title}</h3>
      </div>
    </Link>
  );
}

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <article className="group h-full">
      <Link href={`/shops/${shop.slug}`} className="flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
        <Thumb src={shop.image} alt={shop.image_alt || shop.name} label={shopCategoryLabel(shop.category)} seed={shop.slug} />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge name={shopCategoryLabel(shop.category)} />
            {shop.beginner_welcome && <BeginnerMark />}
            {shop.is_sample && <SampleBadge />}
          </div>
          <h3 className="text-[1.05rem] text-navy">{shop.name}</h3>
          <dl className="mt-auto grid grid-cols-[4.5em_1fr] gap-y-1 text-sm text-muted">
            <dt>予算</dt>
            <dd className="text-ink">{shop.price_range || (shop.budget_level ? BUDGET_LABELS[shop.budget_level] : "—")}</dd>
            <dt>一人</dt>
            <dd className="text-ink">{shop.solo_ok === null ? "—" : shop.solo_ok ? "OK" : "グループ向け"}</dd>
          </dl>
          <span className="mt-2 text-sm font-bold text-rose-deep">詳しく見る →</span>
        </div>
      </Link>
    </article>
  );
}

export function EventCard({ event }: { event: EventItem }) {
  const d = new Date(event.starts_at);
  const md = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).format(d);
  const wd = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", weekday: "short" }).format(d);
  return (
    <Link href={`/events/${event.slug}`} className="group flex items-stretch gap-4 rounded-3xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="grid w-20 shrink-0 place-items-center rounded-2xl bg-rose/20 py-3 text-center text-navy">
        <span className="font-en text-2xl font-semibold leading-none">{md}</span>
        <span className="text-xs">（{wd}）</span>
      </div>
      <div className="min-w-0 py-1">
        {event.is_sample && <SampleBadge />}
        <h3 className="mt-1 text-[1rem] leading-relaxed text-navy group-hover:underline">{event.title}</h3>
        <p className="mt-1 text-xs text-muted">{formatEventDate(event.starts_at, event.ends_at)}</p>
        {event.venue && <p className="text-xs text-muted">会場：{event.venue}</p>}
      </div>
    </Link>
  );
}
