import type { Metadata } from "next";
import Link from "next/link";
import { getAllShops } from "@/lib/data";
import { SHOP_CATEGORIES, shopCategoryLabel } from "@/lib/constants";
import type { ShopCategory } from "@/lib/types";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { MapClient } from "@/components/site/MapClient";

export const revalidate = 60;
export const metadata: Metadata = { title: "川反マップ", description: "川反のお店を地図で探せます。", alternates: { canonical: "/map" } };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const all = (await getAllShops()).filter((s) => s.lat !== null && s.lng !== null);
  const active = SHOP_CATEGORIES.some((c) => c.value === category) ? (category as ShopCategory) : undefined;
  const shops = active ? all.filter((s) => s.category === active) : all;
  return (
    <>
      <PageHeader en="Map" title="川反マップ" lead="お店の場所を地図で確認できます。ピンをタップすると詳細と経路へ進めます。">
        <Breadcrumbs items={[{ name: "川反マップ", href: "/map" }]} />
      </PageHeader>
      <Container className="py-10">
        <nav aria-label="業種で絞り込む" className="mb-5 flex flex-wrap gap-2">
          <Link href="/map" aria-current={!active ? "true" : undefined} className={`rounded-full px-4 py-2 text-sm shadow-soft ${!active ? "bg-navy text-white" : "bg-white text-navy"}`}>すべて</Link>
          {SHOP_CATEGORIES.map((c) => (
            <Link key={c.value} href={`/map?category=${c.value}`} aria-current={active === c.value ? "true" : undefined} className={`rounded-full px-4 py-2 text-sm shadow-soft ${active === c.value ? "bg-navy text-white" : "bg-white text-navy"}`}>
              {c.label}
            </Link>
          ))}
        </nav>
        <MapClient
          shops={shops.map((s) => ({ slug: s.slug, name: s.name, category: s.category, categoryLabel: shopCategoryLabel(s.category), lat: s.lat!, lng: s.lng!, isSample: s.is_sample }))}
          height={520}
        />
        {shops.length === 0 && <div className="mt-5"><EmptyState title="地図に表示できるお店がまだありません">位置情報を確認できたお店から順に追加します。</EmptyState></div>}
        {shops.length > 0 && (
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <li key={s.id}>
                <Link href={`/shops/${s.slug}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-soft">
                  <span className="text-navy">{s.name}</span>
                  <span className="text-xs text-muted">{shopCategoryLabel(s.category)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">地図データ：© OpenStreetMap contributors</p>
      </Container>
    </>
  );
}
