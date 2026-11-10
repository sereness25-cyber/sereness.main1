import type { Shop } from "./types";
import { shopCategoryLabel } from "./constants";
import { PHOTOS, photoForShop, type PhotoKey } from "./photos";

/* 写真のないお店が並んだとき、同じ写真ばかりにならないよう、ジャンルごとに数枚から選ぶ */
const POOL: Record<string, PhotoKey[]> = {
  bar: ["bar", "cocktail", "whisky"],
  izakaya: ["izakaya", "beef", "street"],
  dining: ["beef", "izakaya"],
  snack: ["snack", "whisky"],
  karaoke: ["snack", "cocktail"],
};
export type TodayShop = {
  slug: string;
  name: string;
  category: string;
  cat: string;
  img: string;
  hours: Shop["hours"];
  specials: NonNullable<Shop["specials"]>;
  features: string[];
  solo: boolean | null;
  nonalc: boolean | null;
  lat: number | null;
  lng: number | null;
  address: string;
};

export function hasHours(s: Shop): boolean {
  return !!s.hours && typeof s.hours === "object" && Object.keys(s.hours).length > 0;
}

export function toTodayShops(shops: Shop[]): TodayShop[] {
  const used: Record<string, number> = {};
  // ジャンルごとに順番に違う写真を割り当てる
  const fallback = (category: string): string => {
    const pool = POOL[category] ?? [photoForShop(category)];
    const i = used[category] ?? 0;
    used[category] = i + 1;
    return PHOTOS[pool[i % pool.length]].src;
  };
  return shops
    .filter((s) => s.is_published && !s.is_sample && hasHours(s))
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      category: s.category,
      cat: shopCategoryLabel(s.category),
      img: (s.photo_permission && s.image) || fallback(s.category),
      hours: s.hours ?? null,
      specials: (s.specials ?? []).slice(0, 60),
      features: s.features ?? [],
      solo: s.solo_ok,
      nonalc: s.non_alcohol,
      lat: s.lat,
      lng: s.lng,
      address: s.address,
    }));
}
