import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticlesForShop, getShopBySlug } from "@/lib/data";
import { BUDGET_LABELS, shopCategoryLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { shopLd } from "@/lib/jsonld";
import { Thumb } from "@/components/site/Thumb";
import { BeginnerMark, CategoryBadge, SampleBadge } from "@/components/site/Badges";
import { ArticleCard } from "@/components/site/Cards";
import { Container } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { MapClient } from "@/components/site/MapClient";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getShopBySlug((await params).slug);
  if (!s) return {};
  return {
    title: `${s.name}（${shopCategoryLabel(s.category)}）`,
    description: s.description.slice(0, 120),
    alternates: { canonical: `/shops/${s.slug}` },
    robots: s.is_sample ? { index: false } : undefined,
  };
}

const yesNo = (v: boolean | null, yes: string, no: string) => (v === null ? "未確認" : v ? yes : no);

export default async function ShopPage({ params }: Props) {
  const shop = await getShopBySlug((await params).slug);
  if (!shop) notFound();
  const articles = await getArticlesForShop(shop.id, 3);
  const sns = Object.entries(shop.sns).filter(([, v]) => v) as [string, string][];
  const rows: [string, React.ReactNode][] = [
    ["業種", shopCategoryLabel(shop.category)],
    ["住所", shop.address || "—"],
    ["営業時間", shop.business_hours || "—"],
    ["定休日", shop.closed_days || "—"],
    ["料金", shop.price_range || (shop.budget_level ? BUDGET_LABELS[shop.budget_level] : "—")],
    ["支払方法", shop.payment_methods || "—"],
    ["席数", shop.seats || "—"],
    ["一人での利用", yesNo(shop.solo_ok, "OK", "グループ向け")],
    ["ノンアル対応", yesNo(shop.non_alcohol, "あり", "なし")],
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
          {!shop.shop_confirmed && !shop.is_sample && (
            <p className="mt-4 border-l-2 border-blush bg-[#fbf3f3] px-4 py-3 text-sm leading-7">
              この情報は、公開されている情報をもとに編集部が調べたものです。<strong>お店にはまだ確認していません。</strong>閉店・移転・営業時間の変更があるかもしれません。
            </p>
          )}
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
          <p className="mt-4 text-xs text-muted">
            {shop.verified_at ? `${shop.shop_confirmed ? "情報の最終確認日" : "公開情報を調べた日"}：${formatDate(shop.verified_at)}。` : "情報の確認日：未確認。"}
            営業時間や料金は変わることがあります。お出かけ前にお店へご確認ください。
          </p>
        </section>

        {(shop.lat === null || shop.lng === null) && shop.address && !shop.is_sample && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.address}`)}`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-11 items-center bg-navy px-5 text-sm font-bold text-white">
            Googleマップで場所を見る
          </a>
        )}
        {shop.lat !== null && shop.lng !== null && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl text-navy">地図</h2>
            <MapClient shops={[{ slug: shop.slug, name: shop.name, category: shop.category, categoryLabel: shopCategoryLabel(shop.category), lat: shop.lat, lng: shop.lng, isSample: shop.is_sample }]} height={340} />
            {!shop.is_sample && (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center bg-navy px-5 text-sm font-bold text-white">
                Googleマップで経路を見る
              </a>
            )}
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
