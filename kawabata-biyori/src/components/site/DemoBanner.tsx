import { isDemo } from "@/lib/data";

export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <div className="bg-navy px-4 py-2 text-center text-[0.78rem] leading-6 text-white">
      デモ表示中：データベース未接続のため、<strong>公開前の下書き記事</strong>と<strong>架空のサンプル店舗・イベント</strong>を表示しています。
    </div>
  );
}
