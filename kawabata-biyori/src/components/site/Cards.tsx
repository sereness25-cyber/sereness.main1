import Link from "next/link";
import type { Article, EventItem, Shop } from "@/lib/types";
import { BUDGET_LABELS, shopCategoryLabel } from "@/lib/constants";
import { formatDate, formatEventDate } from "@/lib/format";
import { Thumb } from "./Thumb";
import { photoForCategory, photoForShop, type PhotoKey } from "@/lib/photos";
import { BeginnerMark, DraftBadge, PrBadge, SampleBadge } from "./Badges";

function Meta({ article }: { article: Article }) {
  const cat = article.categories[0];
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] tracking-wider">
      {cat && <span className="font-bold text-rose-deep">{cat.name}</span>}
      {article.is_sponsored && <PrBadge />}
      {article.is_sample && <DraftBadge />}
    </p>
  );
}

/** 雑誌の記事カード。size="lg" は特集用の大きな組み */
export function ArticleCard({ article, priority = false, showExcerpt = true, size = "md", photo }: { article: Article; priority?: boolean; showExcerpt?: boolean; size?: "md" | "lg"; photo?: PhotoKey }) {
  const lg = size === "lg";
  return (
    <article className="group h-full">
      <Link href={`/articles/${article.slug}`} className="flex h-full flex-col gap-4">
        <div className="overflow-hidden">
          <Thumb
            src={article.thumbnail}
            alt={article.thumbnail_alt}
            label={article.categories[0]?.name}
            seed={article.slug}
            isAi={article.thumbnail_is_ai}
            priority={priority}
            photo={photo ?? photoForCategory(article.categories[0]?.slug)}
            className={lg ? "aspect-[3/2]" : ""}
            sizes={lg ? "(min-width:1024px) 720px, 100vw" : undefined}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Meta article={article} />
          <h3 className={`headline text-navy decoration-rose decoration-1 underline-offset-[6px] group-hover:underline ${lg ? "text-[1.6rem] md:text-[2rem]" : "text-[1.12rem]"}`}>{article.title}</h3>
          {showExcerpt && <p className={`text-muted ${lg ? "text-[0.98rem] leading-8" : "line-clamp-2 text-sm leading-7"}`}>{article.excerpt}</p>}
          <p className="mt-auto pt-1 font-en text-sm italic text-muted">
            {article.published_at ? <time dateTime={article.published_at}>{formatDate(article.published_at)}</time> : "Coming soon"}
          </p>
        </div>
      </Link>
    </article>
  );
}

/** 目次・サイドバー用の文字だけの行 */
export function ArticleRow({ article, index }: { article: Article; index?: number }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group flex items-baseline gap-4 border-b border-navy/15 py-4">
      {index !== undefined && <span className="w-8 shrink-0 font-en text-2xl italic text-rose-deep">{String(index).padStart(2, "0")}</span>}
      <span className="min-w-0">
        <span className="block text-[0.72rem] font-bold tracking-wider text-rose-deep">{article.categories[0]?.name}</span>
        <span className="headline mt-0.5 block text-[1rem] text-navy group-hover:underline">{article.title}</span>
      </span>
    </Link>
  );
}

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <article className="group h-full">
      <Link href={`/shops/${shop.slug}`} className="flex h-full flex-col gap-4">
        <Thumb src={shop.image} alt={shop.image_alt || shop.name} label={shopCategoryLabel(shop.category)} seed={shop.slug} photo={photoForShop(shop.category)} />
        <div className="flex flex-1 flex-col gap-2">
          <p className="flex flex-wrap items-center gap-2 text-[0.72rem] tracking-wider">
            <span className="font-bold text-rose-deep">{shopCategoryLabel(shop.category)}</span>
            {shop.beginner_welcome && <BeginnerMark />}
            {shop.is_sample && <SampleBadge />}
          </p>
          <h3 className="headline text-[1.15rem] text-navy group-hover:underline">{shop.name}</h3>
          <dl className="mt-auto grid grid-cols-[4.5em_1fr] gap-y-1 border-t border-navy/15 pt-3 text-sm text-muted">
            <dt>予算</dt>
            <dd className="text-ink">{shop.price_range || (shop.budget_level ? BUDGET_LABELS[shop.budget_level] : "—")}</dd>
            <dt>一人</dt>
            <dd className="text-ink">{shop.solo_ok === null ? "—" : shop.solo_ok ? "OK" : "グループ向け"}</dd>
          </dl>
        </div>
      </Link>
    </article>
  );
}

export function EventCard({ event }: { event: EventItem }) {
  const d = new Date(event.starts_at);
  const m = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", month: "short" }).format(d);
  const day = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", day: "numeric" }).format(d).replace("日", "");
  const wd = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", weekday: "short" }).format(d);
  return (
    <Link href={`/events/${event.slug}`} className="group flex items-start gap-5 border-b border-navy/15 py-5">
      <div className="w-16 shrink-0 text-center text-navy">
        <span className="block font-en text-sm uppercase italic tracking-widest text-rose-deep">{m}</span>
        <span className="block font-en text-[2.6rem] font-semibold leading-none">{day}</span>
        <span className="text-xs">{wd}</span>
      </div>
      <div className="min-w-0 pt-1">
        {event.is_sample && <SampleBadge />}
        <h3 className="headline mt-1 text-[1.05rem] text-navy group-hover:underline">{event.title}</h3>
        <p className="mt-1 text-xs text-muted">{formatEventDate(event.starts_at, event.ends_at)}</p>
        {event.venue && <p className="text-xs text-muted">会場：{event.venue}</p>}
      </div>
    </Link>
  );
}
