import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticlesForShop, getShopBySlug } from "@/lib/data";
import { BUDGET_LABELS, shopCategoryLabel } from "@/lib/constants";
import { shopLd } from "@/lib/jsonld";
import { Thumb } from "@/components/site/Thumb";
import { BeginnerMark, CategoryBadge, SampleBadge } from "@/components/site/Badges";
import { ArticleCard } from "@/components/site/Cards";
import { Container } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { mapsDirectionsUrl, mapsEmbedUrl, mapsOpenUrl, mapsQuery } from "@/lib/maps";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getShopBySlug((await params).slug);
  if (!s) return {};
  return {
    title: `${s.name}｜秋田・川反の${shopCategoryLabel(s.category)}`,
    description: (s.description || `秋田市・川反（かわばた）の${shopCategoryLabel(s.category)}「${s.name}」。場所・営業時間・料金を紹介します。`).slice(0, 120),
    alternates: { canonical: `/shops/${s.slug}` },
    robots: s.is_sample ? { index: false } : undefined,
  };
}

/** 電話をかけるリンク用（数字と + だけにする） */
const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

export default async function ShopPage({ params }: Props) {
  const shop = await getShopBySlug((await params).slug);
  if (!shop) notFound();
  const articles = await getArticlesForShop(shop.id, 3);
  const sns = Object.entries(shop.sns).filter(([, v]) => v) as [string, string][];
  // 地図は Googleマップ（APIキー不要の埋め込み）。「店名 + 住所」で探して、そのお店のページを出す
  const mapQuery = mapsQuery(shop);
  const showMap = Boolean(mapQuery) && !shop.is_sample;
  const mapsSearch = mapsOpenUrl(shop);
  const rows: [string, React.ReactNode][] = [
    ["業種", shopCategoryLabel(shop.category)],
    [
      "住所",
      shop.address ? (
        showMap ? (
          <a href={mapsSearch} target="_blank" rel="noopener noreferrer" className="text-navy underline underline-offset-4">
            {shop.address}
          </a>
        ) : (
          shop.address
        )
      ) : (
        "—"
      ),
    ],
    [
      "電話番号",
      shop.phone ? (
        <a href={telHref(shop.phone)} className="font-bold text-navy underline underline-offset-4">
          {shop.phone}
        </a>
      ) : (
        "—"
      ),
    ],
    ["営業時間", shop.business_hours || "—"],
    ["定休日", shop.closed_days || "—"],
    ["料金", shop.price_range || (shop.budget_level ? BUDGET_LABELS[shop.budget_level] : "—")],
    ["支払方法", shop.payment_methods || "—"],
    ["席数", shop.seats || "—"],
  ];

  return (
    <>
      <Container className="max-w-[960px] pt-6 md:pt-10">
        <Breadcrumbs items={[{ name: "お店を探す", href: "/shops" }, { name: shop.name, href: `/shops/${shop.slug}` }]} />
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge name={shopCategoryLabel(shop.category)} />
          {shop.beginner_welcome && <BeginnerMark size="lg" />}
          {shop.is_sample && <SampleBadge />}
        </div>
        <h1 className="mt-3 text-[1.7rem] text-navy md:text-[2.2rem]">{shop.name}</h1>
        {shop.is_sample && (
          <p className="mt-3 rounded-xl bg-navy/5 px-4 py-3 text-sm">これは画面確認用の<strong>架空の店舗</strong>です。実在するお店ではありません。</p>
        )}
        <Thumb src={shop.image} alt={shop.image_alt || shop.name} label={shopCategoryLabel(shop.category)} seed={shop.slug} priority className="mt-6 rounded-3xl" sizes="(min-width: 960px) 960px, 100vw" />
        {shop.phone && (
          <a href={telHref(shop.phone)} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-blush px-6 font-mincho font-bold tracking-[0.12em] text-white transition hover:brightness-110">
            <span aria-hidden="true">📞</span> 電話をかける<span className="sr-only">（{shop.phone}）</span>
          </a>
        )}
        <p className="mt-8 whitespace-pre-line text-[1.02rem] leading-9">{shop.description}</p>

        {shop.gallery && shop.gallery.length > 0 && (
          <section className="mt-10" aria-label="写真">
            <h2 className="mb-4 text-xl text-navy">写真</h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {shop.gallery.map((g, i) => (
                <li key={g.url + i}>
                  <figure>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-beige">
                      <Image src={g.url} alt={g.caption || `${shop.name}の写真`} fill sizes="(min-width: 960px) 300px, 50vw" className="object-cover" />
                    </div>
                    {g.caption && <figcaption className="mt-1.5 text-xs leading-6 text-muted">{g.caption}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 border border-navy/15 bg-white p-6 md:p-8">
          <h2 className="text-xl text-navy">店舗情報</h2>
          <dl className="mt-4 divide-y divide-beige">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7em_1fr] gap-3 py-3 text-[0.95rem]">
                <dt className="font-bold text-navy">{k}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
            {(shop.website || sns.length > 0) && (
              <div className="grid grid-cols-[7em_1fr] gap-3 py-3 text-[0.95rem]">
                <dt className="font-bold text-navy">リンク</dt>
                <dd className="flex flex-wrap gap-2">
                  {shop.website && <a href={shop.website} target="_blank" rel="noopener noreferrer" className="underline">公式サイト</a>}
                  {sns.map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="underline">{k === "x" ? "X" : k[0].toUpperCase() + k.slice(1)}</a>)}
                </dd>
              </div>
            )}
          </dl>
          {shop.sources.length > 0 && (
            <div className="mt-4 text-xs text-muted">
              <p className="font-bold">出典</p>
              <ul className="mt-1 space-y-0.5">
                {shop.sources.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a></li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {showMap && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl text-navy">地図</h2>
            <iframe
              title={`${shop.name}の地図`}
              src={mapsEmbedUrl(mapQuery)}
              className="h-[340px] w-full overflow-hidden rounded-3xl border-0 bg-beige shadow-soft"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={mapsSearch} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center border border-navy px-5 text-sm font-bold text-navy">
                Googleマップで開く
              </a>
              <a href={mapsDirectionsUrl(shop)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center bg-navy px-5 text-sm font-bold text-white">
                Googleマップで経路を見る
              </a>
            </div>
          </section>
        )}
      </Container>
      {articles.length > 0 && (
        <Container className="mt-14">
          <h2 className="mb-5 text-xl text-navy">このお店が登場する記事</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{articles.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        </Container>
      )}
      <JsonLd data={shopLd(shop)} />
    </>
  );
}
