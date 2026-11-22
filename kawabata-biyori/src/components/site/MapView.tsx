import Link from "next/link";
import { getAllShops } from "@/lib/data";
import { SHOP_CATEGORIES, shopCategoryLabel } from "@/lib/constants";
import type { ShopCategory } from "@/lib/types";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

import { mapsEmbedUrl as embedUrl, mapsQuery as mapQuery } from "@/lib/maps";

const AREA = "秋田県秋田市大町4丁目";

/** 川反マップの本体。業種ごとのページ（/map/izakaya など）でも使う。
 *  公開ページは静的なファイルなので「?category=」では絞り込めない。業種ごとに別ページにしている */
export async function MapView({ active }: { active?: ShopCategory }) {
  const all = (await getAllShops()).filter((s) => !s.is_sample && Boolean(mapQuery(s)));
  const shops = active ? all.filter((s) => s.category === active) : all;
  const activeLabel = active ? shopCategoryLabel(active) : "";
  return (
    <>
      <PageHeader en="Map" title={active ? `川反マップ（${activeLabel}）` : "川反マップ"} lead="お店の場所をGoogleマップで確認できます。お店の名前をタップすると、地図にそのお店の場所が表示されます。">
        <Breadcrumbs items={active ? [{ name: "川反マップ", href: "/map" }, { name: activeLabel, href: `/map/${active}` }] : [{ name: "川反マップ", href: "/map" }]} />
      </PageHeader>
      <Container className="py-10">
        <nav aria-label="業種で絞り込む" className="mb-3 flex flex-wrap gap-2">
          <Link href="/map" aria-current={!active ? "true" : undefined} className={`rounded-full px-4 py-2 text-sm ${!active ? "bg-navy text-white" : "bg-white text-navy"}`}>すべて</Link>
          {SHOP_CATEGORIES.map((c) => (
            <Link key={c.value} href={`/map/${c.value}`} aria-current={active === c.value ? "true" : undefined} className={`rounded-full px-4 py-2 text-sm ${active === c.value ? "bg-navy text-white" : "bg-white text-navy"}`}>
              {c.label}
            </Link>
          ))}
        </nav>
        <p className="mb-4 text-sm text-muted">{active ? `${activeLabel}：` : ""}{shops.length}件のお店</p>
        {shops.length === 0 ? (
          <EmptyState title={active ? `${activeLabel}のお店はまだ地図にありません` : "地図に表示できるお店がまだありません"}>住所を登録したお店から順に表示されます。</EmptyState>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
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
            <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)]">
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
