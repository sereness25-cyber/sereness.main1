/**
 * 写真がまだない記事・店舗に出す仮の写真（イメージ）。
 * public/images/photos のファイルは実在の店舗・人物ではないため、表示時は必ず「イメージ」と明記する。
 * 取材写真が用意できたら、記事のアイキャッチや店舗写真を登録すればそちらが優先される。
 */
export const PHOTOS = {
  street: { src: "/images/photos/street.webp", alt: "提灯が灯る夜の飲み屋街（イメージ）" },
  cocktail: { src: "/images/photos/cocktail.webp", alt: "ピンク色のカクテル（イメージ）" },
  beef: { src: "/images/photos/beef.webp", alt: "肉料理の一皿（イメージ）" },
  river: { src: "/images/photos/river.webp", alt: "夜桜と川沿いの灯り（イメージ）" },
  portrait: { src: "/images/photos/portrait.webp", alt: "カウンターで笑う女性（イメージ）" },
  izakaya: { src: "/images/photos/izakaya.webp", alt: "居酒屋のカウンター（イメージ）" },
  bar: { src: "/images/photos/bar.webp", alt: "BARのカクテル（イメージ）" },
  snack: { src: "/images/photos/snack.webp", alt: "スナックの店内（イメージ）" },
  whisky: { src: "/images/photos/whisky.webp", alt: "ウイスキーのグラス（イメージ）" },
} as const;
export type PhotoKey = keyof typeof PHOTOS;

const BY_CATEGORY: Record<string, PhotoKey> = {
  beginner: "street",
  gourmet: "beef",
  people: "izakaya",
  history: "river",
  enjoy: "cocktail",
  news: "river",
  future: "street",
};

const BY_SHOP: Record<string, PhotoKey> = { izakaya: "izakaya", bar: "bar", snack: "snack", dining: "beef", karaoke: "snack", other: "whisky" };

export const photoForCategory = (slug?: string): PhotoKey => (slug && BY_CATEGORY[slug]) || "street";
export const photoForShop = (category: string): PhotoKey => BY_SHOP[category] ?? "whisky";

const FALLBACK_ORDER: PhotoKey[] = ["cocktail", "beef", "river", "street", "izakaya", "whisky", "bar", "snack"];

/** 並んだ記事で同じ写真が続かないよう、カテゴリーの写真を基本に重複を避けて割り当てる */
export function distinctPhotos(categorySlugs: (string | undefined)[]): PhotoKey[] {
  const used = new Set<PhotoKey>();
  return categorySlugs.map((slug) => {
    let key = photoForCategory(slug);
    if (used.has(key)) key = FALLBACK_ORDER.find((k) => !used.has(k)) ?? key;
    used.add(key);
    return key;
  });
}
