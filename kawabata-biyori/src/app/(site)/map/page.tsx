import type { Metadata } from "next";
import Link from "next/link";
import { getAllShops } from "@/lib/data";
import { SHOP_CATEGORIES, shopCategoryLabel } from "@/lib/constants";
import type { ShopCategory } from "@/lib/types";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const revalidate = 60;
/** Googleマップの埋め込みURL（APIキー不要）。緯度・経度があればその位置、なければ住所にピンを立てる */
const mapQuery = (s: { lat: number | null; lng: number | null; address: string }) =>
  s.lat !== null && s.lng !== null ? `${s.lat},${s.lng}` : s.address;
const embedUrl = (q: string, zoom = 17) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;
const AREA = "秋田県秋田市大町4丁目";

export const metadata: Metadata = { title: "川反マップ", description: "川反のお店を地図で探せます。", alternates: { canonical: "/map" } };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const all = (await getAllShops()).filter((s) => !s.is_sample && Boolean(mapQuery(s)));
  const active = SHOP_CATEGORIES.some((c) => c.value === category) ? (category as ShopCategory) : undefined;
  const shops = active ? all.filter((s) => s.category === active) : all;
  return (
    <>
      <PageHeader en="Map" title="川反マップ" lead="お店の場所をGoogleマップで確認できます。お店の名前をタップすると、地図にそのお店の場所が表示されます。">
        <Breadcrumbs items={[{ name: "川反マップ", href: "/map" }]} />
      </PageHeader>
      <Container className="py-10">
        <nav aria-label="業種で絞り込む" className="mb-5 flex flex-wrap gap-2">
          <Link href="/map" aria-current={!active ? "true" : undefined} className={`rounded-full px-4 py-2 text-sm ${!active ? "bg-navy text-white" : "bg-white text-navy"}`}>すべて</Link>
          {SHOP_CATEGORIES.map((c) => (
            <Link key={c.value} href={`/map?category=${c.value}`} aria-current={active === c.value ? "true" : undefined} className={`rounded-full px-4 py-2 text-sm ${active === c.value ? "bg-navy text-white" : "bg-white text-navy"}`}>
              {c.label}
            </Link>
          ))}
        </nav>
        {shops.length === 0 ? (
          <EmptyState title="地図に表示できるお店がまだありません">住所を登録したお店から順に表示されます。</EmptyState>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* 地図：スマホでは上に固定して、下の一覧をスクロールしながら選べるようにする */}
            <div className="sticky top-[52px] z-10 bg-ivory pb-2 lg:top-[64px] lg:pb-0">
              <iframe
                name="kb-map"
                title="川反マップ"
                src={embedUrl(AREA, 16)}
                className="h-[42vh] min-h-[260px] w-full overflow-hidden rounded-3xl border-0 bg-beige shadow-soft lg:h-[560px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {shops.map((s) => (
                <li key={s.id} className="flex items-stretch border border-navy/15 bg-white text-sm">
                  <a href={embedUrl(mapQuery(s))} target="kb-map" className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3">
                    <span aria-hidden="true">📍</span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-navy">{s.name}</span>
                      <span className="block text-xs text-muted">{shopCategoryLabel(s.category)}</span>
                    </span>
                  </a>
                  <Link href={`/shops/${s.slug}`} className="flex shrink-0 items-center border-l border-navy/10 px-3 text-xs text-navy underline underline-offset-4">
                    詳しく
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-4 text-xs text-muted">地図：Googleマップ</p>
      </Container>
    </>
  );
}
