import Link from "next/link";
import type { Article, Shop } from "@/lib/types";
import { sanitizeArticleHtml, splitEmbeds, withHeadingIds, readingMinutes } from "@/lib/html";
import { formatDate } from "@/lib/format";
import { siteUrl } from "@/lib/constants";
import { Thumb } from "./Thumb";
import { ArticleCard, ShopCard } from "./Cards";
import { CategoryBadge, DraftBadge, PrBadge } from "./Badges";
import { ShareButtons } from "./ShareButtons";
import { Container } from "./Section";

type Props = {
  article: Article;
  related: Article[];
  shops: Shop[];
  embedShops: Shop[];
  embedArticles: Article[];
  breadcrumbs?: React.ReactNode;
  preview?: boolean;
};

export function ArticleView({ article, related, shops, embedShops, embedArticles, breadcrumbs, preview }: Props) {
  const { html, toc } = withHeadingIds(sanitizeArticleHtml(article.content));
  const segments = splitEmbeds(html);
  const shopBySlug = new Map(embedShops.map((s) => [s.slug, s]));
  const articleBySlug = new Map(embedArticles.map((a) => [a.slug, a]));
  const url = `${siteUrl()}/articles/${article.slug}`;
  const updated = article.published_at && article.updated_at.slice(0, 10) !== article.published_at.slice(0, 10);

  return (
    <article>
      <Container className="max-w-[860px] pt-6 md:pt-10">
        {breadcrumbs}
        <div className="flex flex-wrap items-center gap-1.5">
          {article.categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`}><CategoryBadge name={c.name} /></Link>
          ))}
          {article.is_sponsored && <PrBadge />}
          {(article.is_sample || preview) && <DraftBadge />}
        </div>
        <h1 className="mt-3 text-[1.6rem] leading-snug text-navy md:text-[2.1rem]">{article.title}</h1>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {article.published_at ? (
            <span>公開日 <time dateTime={article.published_at}>{formatDate(article.published_at)}</time></span>
          ) : (
            <span>未公開</span>
          )}
          {updated && <span>更新日 <time dateTime={article.updated_at}>{formatDate(article.updated_at)}</time></span>}
          <span>約{readingMinutes(article.content)}分で読めます</span>
        </p>
        {article.is_sponsored && (
          <p className="mt-3 rounded-xl bg-beige px-4 py-2 text-sm">この記事は広告（タイアップ記事）です。</p>
        )}
      </Container>

      <Container className="mt-6 max-w-[960px]">
        <Thumb src={article.thumbnail} alt={article.thumbnail_alt} label={article.categories[0]?.name} seed={article.slug} isAi={article.thumbnail_is_ai} priority className="rounded-3xl" sizes="(min-width: 960px) 960px, 100vw" />
      </Container>

      <Container className="mt-8 max-w-[760px]">
        <p className="text-[1.05rem] leading-9 text-ink">{article.excerpt}</p>

        {toc.length > 2 && (
          <nav aria-label="目次" className="my-8 rounded-3xl bg-white p-6 shadow-soft">
            <p className="font-maru font-bold text-navy">目次</p>
            <ol className="mt-3 space-y-1.5 text-[0.95rem]">
              {toc.map((t) => (
                <li key={t.id} className={t.level === 3 ? "pl-5 text-sm" : ""}>
                  <a href={`#${t.id}`} className="text-navy underline-offset-4 hover:underline">
                    {t.level === 3 ? "・" : ""}{t.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="article-body">
          {segments.map((seg, i) => {
            if (seg.type === "html") return <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />;
            if (seg.type === "shop") {
              const s = shopBySlug.get(seg.slug);
              return s ? <div key={i} className="my-8 max-w-sm"><ShopCard shop={s} /></div> : null;
            }
            const a = articleBySlug.get(seg.slug);
            return a ? <div key={i} className="my-8 max-w-sm"><ArticleCard article={a} showExcerpt={false} /></div> : null;
          })}
        </div>

        {article.tags.length > 0 && (
          <ul className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <li key={t.id}>
                <Link href={`/tag/${t.slug}`} className="inline-block rounded-full border border-navy/15 bg-white px-3 py-1 text-sm text-navy hover:bg-beige">#{t.name}</Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 border-t border-beige pt-6">
          <ShareButtons url={url} title={article.title} />
        </div>
      </Container>

      {shops.length > 0 && (
        <Container className="mt-14">
          <h2 className="mb-5 text-xl text-navy">この記事で紹介したお店</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{shops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>
        </Container>
      )}

      {related.length > 0 && (
        <Container className="mt-14">
          <h2 className="mb-5 text-xl text-navy">関連記事</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        </Container>
      )}
    </article>
  );
}
