import { isDemo } from "@/lib/data";

export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <div className="bg-navy px-4 py-2 text-center text-[0.78rem] leading-6 text-white">
      デモ表示中：記事は<strong>公開前の下書き</strong>、お店は<strong>公開情報をもとに編集部が調べた内容（お店には未確認）</strong>、イベントは<strong>架空のサンプル</strong>です。
    </div>
  );
}
