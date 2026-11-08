import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";
import { getAllEvents, getAllShops, getCategories, getTags, isDemo, queryArticles } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const fixed = ["", "/articles", "/shops", "/guide", "/events", "/map", "/about", "/contact", "/company", "/privacy"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  // デモデータ（下書き・架空のサンプル）はサイトマップに載せない
  if (isDemo()) return fixed;
  const [{ items }, categories, tags, shops, events] = await Promise.all([
    queryArticles({ perPage: 50000 }),
    getCategories(),
    getTags(),
    getAllShops(),
    getAllEvents(),
  ]);
  return [
    ...fixed,
    ...items.map((a) => ({ url: `${base}/articles/${a.slug}`, lastModified: a.updated_at, priority: 0.8 })),
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, priority: 0.5 })),
    ...tags.map((t) => ({ url: `${base}/tag/${t.slug}`, priority: 0.3 })),
    ...shops.map((s) => ({ url: `${base}/shops/${s.slug}`, lastModified: s.updated_at, priority: 0.6 })),
    ...events.map((e) => ({ url: `${base}/events/${e.slug}`, lastModified: e.updated_at, priority: 0.5 })),
  ];
}
