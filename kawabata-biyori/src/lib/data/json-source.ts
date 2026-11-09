import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Article, Category, EventItem, Shop, SiteSettings, Tag } from "@/lib/types";

/**
 * GitHub 版の管理ページ（kawabata-admin）が保存する JSON を読む。
 * リポジトリ直下の kawabata-data/ にある articles.json / shops.json / events.json / categories.json。
 * 公開ページの書き出し（GitHub Actions）のときに使う。
 */

export type JsonArticle = Omit<Article, "categories" | "tags" | "shop_ids"> & {
  category_slugs: string[];
  tags: Tag[];
  shop_slugs: string[];
};

export function jsonDataDir() {
  return process.env.KAWABATA_DATA_DIR ?? path.join(process.cwd(), "..", "kawabata-data");
}

export function isJsonSource() {
  return fs.existsSync(path.join(jsonDataDir(), "articles.json"));
}

function read<T>(file: string, key: string): T[] {
  const p = path.join(jsonDataDir(), file);
  if (!fs.existsSync(p)) return [];
  const json = JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, T[]>;
  return json[key] ?? [];
}

export function jsonCategories(): Category[] {
  return read<Category>("categories.json", "categories").sort((a, b) => a.sort_order - b.sort_order);
}

export function jsonShops(): Shop[] {
  return read<Shop>("shops.json", "shops")
    .filter((s) => s.is_published)
    .map((s) => ({
      ...s,
      sources: s.sources ?? [],
      shop_confirmed: !!s.shop_confirmed,
      // 写真の使用許可がないお店は、追加の写真も出さない
      gallery: s.photo_permission && Array.isArray(s.gallery) ? s.gallery.filter((g) => g && /^https:\/\//.test(g.url)) : [],
    }));
}

export function jsonEvents(): EventItem[] {
  return read<EventItem>("events.json", "events")
    .filter((e) => e.is_published)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

/** 公開済み、または予約時刻を過ぎた予約記事だけを返す（下書き・非公開は出さない） */
export function jsonArticles(): Article[] {
  const cats = new Map(jsonCategories().map((c) => [c.slug, c]));
  const shopIds = new Map(read<Shop>("shops.json", "shops").map((s) => [s.slug, s.id]));
  const now = Date.now();
  return read<JsonArticle>("articles.json", "articles")
    .filter((a) => (a.status === "published" || a.status === "scheduled") && a.published_at && new Date(a.published_at).getTime() <= now)
    .map(({ category_slugs, shop_slugs, ...a }) => ({
      ...a,
      categories: category_slugs.map((s) => cats.get(s)).filter((c): c is Category => !!c),
      shop_ids: shop_slugs.map((s) => shopIds.get(s)).filter((x): x is string => !!x),
    }))
    .sort((x, y) => (y.published_at ?? "").localeCompare(x.published_at ?? ""));
}

export function jsonSettings(): Partial<SiteSettings> {
  const p = path.join(jsonDataDir(), "settings.json");
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as Partial<SiteSettings>) : {};
}
