import type { Metadata } from "next";
import { getAllShops } from "@/lib/data";
import { KAWABATA_API, SHOP_CATEGORIES, SHOP_FEATURES } from "@/lib/constants";
import { hasHours, toTodayShops } from "@/lib/today";
import { Container, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import Link from "next/link";

export const metadata: Metadata = {
  title: "本日営業のお店",
  description: "川反で今日営業しているお店。営業中・これから営業のお店を、カード・リスト・地図で探せます。",
  alternates: { canonical: "/shops/today" },
};

const chip = "kb-chip";

export default async function TodayPage() {
  const all = await getAllShops();
  const shops = toTodayShops(all);
  const unregistered = all.filter((s) => s.is_published && !s.is_sample && !hasHours(s));
  const genres = SHOP_CATEGORIES.filter((c) => shops.some((s) => s.category === c.value));
  const features = SHOP_FEATURES.filter((f) => shops.some((s) => s.features.includes(f.value)));

  return (
    <>
      <PageHeader en="Today’s Kawabata" title="本日営業のお店" lead="今夜の川反、どこに行く？ 営業中のお店から順に並べています。">
        <Breadcrumbs items={[{ name: "お店を探す", href: "/shops" }, { name: "本日営業のお店", href: "/shops/today" }]} />
      </PageHeader>
      <Container className="py-8">
        <div data-kb-today="page" data-api={KAWABATA_API} data-shops={JSON.stringify(shops)}>
          <div className="kb-filters" role="group" aria-label="絞り込み">
            <div className="kb-chips">
              <button type="button" className={chip} data-status="open" aria-pressed="false">🟢 営業中</button>
              <button type="button" className={chip} data-status="soon" aria-pressed="false">🕒 本日営業予定</button>
              <button type="button" className={chip} data-feature="late" aria-pressed="false">🌙 深夜営業</button>
              <button type="button" className={chip} data-feature="solo" aria-pressed="false">一人飲み歓迎</button>
              <button type="button" className={chip} data-feature="nonalc" aria-pressed="false">ノンアル対応</button>
              {features.map((f) => (
                <button key={f.value} type="button" className={chip} data-feature={f.value} aria-pressed="false">{f.label}</button>
              ))}
            </div>
            {genres.length > 1 && (
              <div className="kb-chips">
                {genres.map((g) => (
                  <button key={g.value} type="button" className={chip} data-genre={g.value} aria-pressed="false">{g.label}</button>
                ))}
                <button type="button" className="kb-chip kb-chip--reset" data-reset>条件をクリア</button>
              </div>
            )}
          </div>
          <div className="kb-toolbar">
            <p className="text-sm text-muted" data-count aria-live="polite" />
            <div className="kb-views" role="group" aria-label="表示の切り替え">
              <button type="button" data-view="card" aria-pressed="true">カード</button>
              <button type="button" data-view="list" aria-pressed="false">リスト</button>
              <button type="button" data-view="map" aria-pressed="false">マップ</button>
            </div>
          </div>
          <div data-results>
            <p className="kb-empty">営業情報を読み込んでいます…</p>
          </div>
          <div data-map hidden className="kb-map" />
          <div data-nopos hidden />
        </div>

        <p className="mt-8 text-xs leading-6 text-muted">
          ※登録された営業時間にもとづく表示です。臨時の休業や混雑など、実際の営業状況はお店にご確認ください。
        </p>

        {unregistered.length > 0 && (
          <section className="mt-10 border-t border-navy/15 pt-6">
            <h2 className="font-mincho text-base font-bold text-navy">営業時間がまだ登録されていないお店</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {unregistered.map((s) => (
                <li key={s.id}>
                  <Link href={`/shops/${s.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-beige bg-white px-4 text-sm text-navy hover:border-blush">{s.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
