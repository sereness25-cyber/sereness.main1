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

export const BUDGET_LABELS: Record<number, string> = {
  1: "〜3,000円",
  2: "3,000〜5,000円",
  3: "5,000〜8,000円",
  4: "8,000円〜",
};

export const NAV = [
  { href: "/", label: "ホーム" },
  { href: "/articles", label: "記事を読む" },
  { href: "/shops", label: "お店を探す" },
  { href: "/guide", label: "はじめての川反" },
  { href: "/events", label: "イベント" },
  { href: "/map", label: "川反マップ" },
] as const;

/** 川反通り周辺（秋田市大町・旭川沿い）のおおよその中心。地図の初期表示にだけ使う */
export const KAWABATA_CENTER: [number, number] = [39.7195, 140.1155];

export const ARTICLES_PER_PAGE = 12;
