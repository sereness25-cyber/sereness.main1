import type { Metadata } from "next";
import { queryShops } from "@/lib/data";
import { BUDGET_LABELS, SHOP_CATEGORIES } from "@/lib/constants";
import type { ShopCategory } from "@/lib/types";
import { ShopCard } from "@/components/site/Cards";
import { Container, EmptyState, PageHeader } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { BeginnerMark } from "@/components/site/Badges";
import { IS_STATIC, shopText } from "@/lib/static-site";

export const metadata: Metadata = {
  title: "川反の飲み屋を探す｜秋田市の居酒屋・BAR・スナック",
  description: "秋田市・川反（かわばた）の飲み屋を探すなら。居酒屋、BAR、スナック、ダイニングを、予算や「一人で飲める」「ノンアル対応」で探せます。",
  alternates: { canonical: "/shops" },
};

type SP = Promise<Record<string, string | undefined>>;

export default async function ShopsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const category = SHOP_CATEGORIES.some((c) => c.value === sp.category) ? (sp.category as ShopCategory) : undefined;
  // 静的書き出しでは全部のお店を出して、ブラウザで絞り込む
  const shops = IS_STATIC ? await queryShops({}) : await queryShops({
    q: sp.q || undefined,
    category,
    budget: Number(sp.budget) || undefined,
    beginner: sp.beginner === "1",
    solo: sp.solo === "1",
    nonAlcohol: sp.nonalc === "1",
  });
  const field = "h-11 w-full rounded-xl border border-beige bg-white px-3 text-sm";
  const check = "flex min-h-11 items-center gap-2 rounded-xl bg-ivory px-3 text-sm";

  return (
    <>
      <PageHeader en="Shops" title="お店を探す" lead="気分や予算に合わせて、川反のお店を探してみましょう。">
        <Breadcrumbs items={[{ name: "お店を探す", href: "/shops" }]} />
      </PageHeader>
      <Container className="py-10">
        <form method="get" data-kb-filter="shops" className="grid gap-3 border border-navy/15 bg-white p-5 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-bold text-navy">店名・キーワード</span>
            <input type="search" name="q" defaultValue={sp.q} className={field} placeholder="例：カウンター" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-navy">業種</span>
            <select name="category" defaultValue={category ?? ""} className={field}>
              <option value="">すべて</option>
              {SHOP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-navy">予算（1人あたり）</span>
            <select name="budget" defaultValue={sp.budget ?? ""} className={field}>
              <option value="">指定なし</option>
              {Object.entries(BUDGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}まで</option>)}
            </select>
          </label>
          <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:col-span-3">
            <legend className="sr-only">こだわり条件</legend>
            <label className={check}><input type="checkbox" name="beginner" value="1" defaultChecked={sp.beginner === "1"} className="size-5 accent-rose-deep" /> 初心者歓迎</label>
            <label className={check}><input type="checkbox" name="solo" value="1" defaultChecked={sp.solo === "1"} className="size-5 accent-rose-deep" /> 一人利用OK</label>
            <label className={check}><input type="checkbox" name="nonalc" value="1" defaultChecked={sp.nonalc === "1"} className="size-5 accent-rose-deep" /> ノンアル対応</label>
          </fieldset>
          <div className="flex items-end"><button type="submit" className="h-11 w-full bg-navy text-sm font-bold text-white">この条件で探す</button></div>
        </form>

        <details className="mt-5 rounded-2xl bg-[#fdf6ea] p-4 text-sm">
          <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-bold text-navy"><BeginnerMark /> マークについて</summary>
          <p className="mt-2 leading-7">編集部が次の4点を確認できたお店に表示しています。①料金が明確 ②初めてのお客さまを歓迎 ③料金の説明に対応 ④不明瞭な追加料金がない。</p>
        </details>

        <p className="mt-6 text-xs leading-6 text-muted">お店情報は随時追加していきます。</p>
        <p className="mt-3 text-sm text-muted" data-kb-count="{n}件のお店">{shops.length}件のお店</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-kb-list hidden={!shops.length}>
          {shops.map((s) => (
            <div
              key={s.id}
              data-kb-item
              data-category={s.category}
              data-budget={s.budget_level ?? ""}
              data-beginner={s.beginner_welcome ? "1" : ""}
              data-solo={s.solo_ok === true ? "1" : ""}
              data-nonalc={s.non_alcohol === true ? "1" : ""}
              data-text={shopText(s)}
            >
              <ShopCard shop={s} />
            </div>
          ))}
        </div>
        <div className="mt-4" data-kb-empty hidden={shops.length > 0}><EmptyState title="条件に合うお店が見つかりませんでした">掲載店舗は確認が取れたお店から順次追加しています。</EmptyState></div>
      </Container>
    </>
  );
}
