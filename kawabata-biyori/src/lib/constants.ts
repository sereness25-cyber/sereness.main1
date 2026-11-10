import type { ShopCategory } from "./types";

export const SITE = {
  name: "かわばた日和",
  nameEn: "KAWABATA BIYORI",
  catch: "今日もちょっと、川反へ。",
  sub: ["いつもの川反も、はじめての川反も。", "知れば知るほど、好きになる。"],
  description:
    "秋田市・川反（かわばた）の飲食店、歴史、人、イベントを紹介する地域Webマガジン。はじめての川反も、いつもの川反も、もっと楽しく。",
  operator: "Café & Bar Sereness",
} as const;

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export const SHOP_CATEGORIES: { value: ShopCategory; label: string; en: string }[] = [
  { value: "izakaya", label: "居酒屋", en: "IZAKAYA" },
  { value: "bar", label: "BAR", en: "BAR" },
  { value: "snack", label: "スナック", en: "SNACK" },
  { value: "dining", label: "ダイニング", en: "DINING" },
  { value: "karaoke", label: "カラオケ", en: "KARAOKE" },
  { value: "other", label: "その他", en: "OTHERS" },
];

export function shopCategoryLabel(c: ShopCategory): string {
  return SHOP_CATEGORIES.find((x) => x.value === c)?.label ?? "その他";
}

/** 管理ページの保存先（Apps Script）。公開ページは、ここから最新の営業時間を読む */
export const KAWABATA_API = "https://script.google.com/macros/s/AKfycbwOwYiigmue3tHoj_PnGPtxaWktpb4mGLaULf9qzeyGix7q_voD_mq0vqL2iq-URQym/exec";

/** お店の設備・サービス（絞り込みに使う） */
export const SHOP_FEATURES: { value: string; label: string }[] = [
  { value: "karaoke", label: "カラオケあり" },
  { value: "darts", label: "ダーツあり" },
  { value: "card", label: "カード払い可" },
  { value: "smoke_free", label: "禁煙" },
];

export const BUDGET_LABELS: Record<number, string> = {
  1: "〜3,000円",
  2: "3,000〜5,000円",
  3: "5,000〜8,000円",
  4: "8,000円〜",
};

/** ヘッダーの雑誌風ナビ */
export const NAV = [
  { href: "/features", label: "特集" },
  { href: "/series", label: "連載" },
  { href: "/shops", label: "お店ガイド" },
  { href: "/events", label: "イベント" },
  { href: "/issues", label: "バックナンバー" },
] as const;

/** メニュー（ハンバーガー）にだけ出す項目 */
export const MENU_EXTRA = [
  { href: "/", label: "ホーム" },
  { href: "/guide", label: "はじめての川反" },
  { href: "/articles", label: "記事をすべて見る" },
  { href: "/map", label: "川反マップ" },
  { href: "/search", label: "サイト内検索" },
] as const;

/** 連載記事に付けるタグ */
export const SERIES_TAG = "rensai";

/** 川反通り周辺（秋田市大町・旭川沿い）のおおよその中心。地図の初期表示にだけ使う */
export const KAWABATA_CENTER: [number, number] = [39.7195, 140.1155];

export const ARTICLES_PER_PAGE = 12;
