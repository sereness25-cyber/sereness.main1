import Link from "next/link";
import { KAWABATA_API } from "@/lib/constants";
import type { TodayShop } from "@/lib/today";

/**
 * トップページ「本日営業のお店」。カードの中身は public/js/kawabata-today.js が、
 * 日本時間の営業状態に合わせて並べる（営業中 → 営業予定。同じ状態の中はランダム）。
 */
export function TodayShops({ shops }: { shops: TodayShop[] }) {
  return (
    <section className="kb-today pt-10 md:pt-14" aria-labelledby="today-title" data-kb-today="carousel" data-api={KAWABATA_API} data-shops={JSON.stringify(shops)}>
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-en text-[1.9rem] italic leading-none text-blush md:text-[2.6rem]">TODAY’S KAWABATA</p>
            <h2 id="today-title" className="mt-2 font-mincho text-lg font-bold tracking-[0.12em] text-navy md:text-xl">本日営業のお店</h2>
            <p className="mt-1 font-mincho text-sm tracking-[0.08em] text-ink/80">今夜の川反、どこに行く？</p>
          </div>
          <div className="kb-arrows">
            <button type="button" data-prev aria-label="前のお店へ" className="kb-arrow">‹</button>
            <button type="button" data-next aria-label="次のお店へ" className="kb-arrow">›</button>
          </div>
        </div>
      </div>
      <div className="kb-track-wrap">
        <div className="kb-track" data-track tabIndex={0} aria-label="本日営業のお店（横にスクロールできます）">
          <p className="kb-empty">営業情報を読み込んでいます…</p>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="kb-dots" data-dots aria-live="polite" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Link href="/shops/today" className="inline-flex min-h-11 items-center gap-3 font-mincho text-sm font-bold tracking-[0.12em] text-navy underline-offset-4 hover:underline">
            本日営業のお店をすべて見る <span aria-hidden="true" className="text-blush">→</span>
          </Link>
          <p className="text-[0.7rem] text-muted">※登録された営業時間にもとづく表示です。実際の営業状況はお店にご確認ください。</p>
        </div>
      </div>
    </section>
  );
}
