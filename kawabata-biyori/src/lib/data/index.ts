import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { publicClient } from "@/lib/supabase/public";
import { ARTICLES_PER_PAGE } from "@/lib/constants";
import type { Article, Category, EventItem, Shop, ShopCategory, SiteSettings, Tag } from "@/lib/types";
import { DEMO_CATEGORIES } from "@/lib/demo/categories";
import { DEMO_ARTICLES } from "@/lib/demo/articles";
import { DEMO_SHOPS } from "@/lib/demo/shops";
import { DEMO_EVENTS } from "@/lib/demo/events";

/**
 * 公開サイトのデータ取得。
 * Supabase の接続情報がない場合はデモデータ（下書き記事・架空のサンプル）を返す。
 * 記事数が数千件規模になるまでは、公開データを丸ごと取得してアプリ側で絞り込む。
 */

export const isDemo = () => !isSupabaseConfigured();

// ---------------------------------------------------------------
// 生データの取得
// ---------------------------------------------------------------

type ArticleRow = Omit<Article, "categories" | "tags" | "shop_ids"> & {
  article_categories: { categories: Category | null }[] | null;
  article_tags: { tags: Tag | null }[] | null;
  article_shops: { shop_id: string }[] | null;
};

export const ARTICLE_SELECT =
  "*, article_categories(categories(*)), article_tags(tags(*)), article_shops(shop_id)";

export function mapArticleRow(row: ArticleRow): Article {
  const { article_categories, article_tags, article_shops, ...rest } = row;
  return {
    ...rest,
    categories: (article_categories ?? [])
      .map((x) => x.categories)
      .filter((c): c is Category => !!c)
      .sort((a, b) => a.sort_order - b.sort_order),
    tags: (article_tags ?? []).map((x) => x.tags).filter((t): t is Tag => !!t),
    shop_ids: (article_shops ?? []).map((x) => x.shop_id),
  };
}

const loadArticles = cache(async (): Promise<Article[]> => {
  if (isDemo()) return DEMO_ARTICLES;
  // RLS が「公開済み」または「予約時刻を過ぎた予約記事」だけを返す
  const { data, error } = await publicClient()
    .from("articles")
    .select(ARTICLE_SELECT)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`記事の取得に失敗しました: ${error.message}`);
  return (data as ArticleRow[]).map(mapArticleRow);
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (isDemo()) return DEMO_CATEGORIES;
  const { data, error } = await publicClient().from("categories").select("*").order("sort_order");
  if (error) throw new Error(`カテゴリーの取得に失敗しました: ${error.message}`);
  return data as Category[];
});

export const getTags = cache(async (): Promise<Tag[]> => {
  if (isDemo()) {
    const map = new Map<string, Tag>();
    DEMO_ARTICLES.flatMap((a) => a.tags).forEach((t) => map.set(t.slug, t));
    return [...map.values()];
  }
  const { data, error } = await publicClient().from("tags").select("*").order("name");
  if (error) throw new Error(`タグの取得に失敗しました: ${error.message}`);
  return data as Tag[];
});

const loadShops = cache(async (): Promise<Shop[]> => {
  if (isDemo()) return DEMO_SHOPS;
  const { data, error } = await publicClient().from("shops").select("*").order("name");
  if (error) throw new Error(`店舗の取得に失敗しました: ${error.message}`);
  return data as Shop[];
});

const loadEvents = cache(async (): Promise<EventItem[]> => {
  if (isDemo()) return DEMO_EVENTS;
  const { data, error } = await publicClient().from("events").select("*").order("starts_at");
  if (error) throw new Error(`イベントの取得に失敗しました: ${error.message}`);
  return data as EventItem[];
});

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const empty: SiteSettings = { instagram: "", x: "", facebook: "", youtube: "" };
  if (isDemo()) return empty;
  const { data } = await publicClient().from("site_settings").select("value").eq("key", "site").maybeSingle();
  return { ...empty, ...((data?.value as Partial<SiteSettings>) ?? {}) };
});

// ---------------------------------------------------------------
// 記事
// ---------------------------------------------------------------

export type ArticleQuery = {
  category?: string;
  tag?: string;
  q?: string;
  sort?: "new" | "old" | "recommended";
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
};

function normalize(s: string) {
  return s.normalize("NFKC").toLowerCase();
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, " ");
}

function matchesKeyword(a: Article, q: string) {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  const hay = normalize(
    [a.title, a.excerpt, stripTags(a.content), ...a.tags.map((t) => t.name), ...a.categories.map((c) => c.name)].join(" "),
  );
  return words.every((w) => hay.includes(w));
}

export async function queryArticles(query: ArticleQuery = {}) {
  let items = await loadArticles();
  if (query.category) items = items.filter((a) => a.categories.some((c) => c.slug === query.category));
  if (query.tag) items = items.filter((a) => a.tags.some((t) => t.slug === query.tag));
  if (query.q) items = items.filter((a) => matchesKeyword(a, query.q!));
  if (query.from) items = items.filter((a) => (a.published_at ?? "") >= query.from!);
  if (query.to) items = items.filter((a) => (a.published_at ?? "") <= `${query.to}T23:59:59+09:00`);

  const byDate = (a: Article, b: Article) => (b.published_at ?? b.updated_at).localeCompare(a.published_at ?? a.updated_at);
  items = [...items];
  if (query.sort === "old") items.sort((a, b) => byDate(b, a));
  else if (query.sort === "recommended") items.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || byDate(a, b));
  else items.sort(byDate);

  const perPage = query.perPage ?? ARTICLES_PER_PAGE;
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page ?? 1), pages);
  return { items: items.slice((page - 1) * perPage, page * perPage), total, page, pages };
}

export async function getLatestArticles(limit: number) {
  return (await queryArticles({ perPage: limit })).items;
}

export async function getFeaturedArticles(limit: number) {
  const all = await loadArticles();
  const featured = all.filter((a) => a.is_featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getArticleBySlug(slug: string) {
  return (await loadArticles()).find((a) => a.slug === slug) ?? null;
}

export async function getArticlesByCategory(slug: string, limit: number) {
  return (await queryArticles({ category: slug, perPage: limit })).items;
}

/** カテゴリー・タグの重なりが多い順に関連記事を選ぶ */
export async function getRelatedArticles(article: Article, limit = 3) {
  const all = await loadArticles();
  const cats = new Set(article.categories.map((c) => c.id));
  const tags = new Set(article.tags.map((t) => t.id));
  return all
    .filter((a) => a.id !== article.id)
    .map((a) => ({
      a,
      score:
        a.tags.filter((t) => tags.has(t.id)).length * 2 + a.categories.filter((c) => cats.has(c.id)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);
}

export async function getAllArticleSlugs() {
  return (await loadArticles()).map((a) => ({ slug: a.slug, updated_at: a.updated_at }));
}

export async function getCategoryBySlug(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getTagBySlug(slug: string) {
  return (await getTags()).find((t) => t.slug === slug) ?? null;
}

// ---------------------------------------------------------------
// 店舗
// ---------------------------------------------------------------

export type ShopQuery = {
  q?: string;
  category?: ShopCategory;
  budget?: number;
  beginner?: boolean;
  solo?: boolean;
  nonAlcohol?: boolean;
};

export async function queryShops(query: ShopQuery = {}) {
  let items = await loadShops();
  if (query.q) {
    const q = normalize(query.q);
    items = items.filter((s) => normalize(`${s.name} ${s.description} ${s.address}`).includes(q));
  }
  if (query.category) items = items.filter((s) => s.category === query.category);
  if (query.budget) items = items.filter((s) => s.budget_level !== null && s.budget_level <= query.budget!);
  if (query.beginner) items = items.filter((s) => s.beginner_welcome);
  if (query.solo) items = items.filter((s) => s.solo_ok === true);
  if (query.nonAlcohol) items = items.filter((s) => s.non_alcohol === true);
  return items;
}

export async function getShopBySlug(slug: string) {
  return (await loadShops()).find((s) => s.slug === slug) ?? null;
}

export async function getShopsByIds(ids: string[]) {
  const set = new Set(ids);
  return (await loadShops()).filter((s) => set.has(s.id));
}

export async function getShopsBySlugs(slugs: string[]) {
  const set = new Set(slugs);
  return (await loadShops()).filter((s) => set.has(s.slug));
}

export async function getArticlesForShop(shopId: string, limit = 3) {
  return (await loadArticles()).filter((a) => a.shop_ids.includes(shopId)).slice(0, limit);
}

// ---------------------------------------------------------------
// イベント
// ---------------------------------------------------------------

export function isEventPast(e: EventItem, now = new Date()) {
  return new Date(e.ends_at ?? e.starts_at).getTime() < now.getTime();
}

export async function getUpcomingEvents(limit?: number) {
  const items = (await loadEvents()).filter((e) => !isEventPast(e));
  return limit ? items.slice(0, limit) : items;
}

export async function getPastEvents() {
  return (await loadEvents()).filter((e) => isEventPast(e)).reverse();
}

export async function getEventBySlug(slug: string) {
  return (await loadEvents()).find((e) => e.slug === slug) ?? null;
}

export async function getAllShops() {
  return loadShops();
}

export async function getAllEvents() {
  return loadEvents();
}

// ---------------------------------------------------------------
// サイト内検索（記事・店舗・イベント）
// ---------------------------------------------------------------

export async function searchAll(q: string, scope?: "articles" | "shops" | "events") {
  const keyword = q.trim();
  if (!keyword) return { articles: [], shops: [], events: [] };
  const words = normalize(keyword).split(/\s+/).filter(Boolean);
  const hit = (text: string) => words.every((w) => normalize(text).includes(w));

  const [articles, shops, events] = await Promise.all([
    !scope || scope === "articles" ? queryArticles({ q: keyword, perPage: 50 }).then((r) => r.items) : [],
    !scope || scope === "shops"
      ? loadShops().then((xs) => xs.filter((s) => hit(`${s.name} ${s.description} ${s.address} ${s.price_range}`)))
      : [],
    !scope || scope === "events"
      ? loadEvents().then((xs) => xs.filter((e) => hit(`${e.title} ${stripTags(e.content)} ${e.venue} ${e.organizer}`)))
      : [],
  ]);
  return { articles, shops, events };
}
