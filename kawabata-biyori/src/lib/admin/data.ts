import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ARTICLE_SELECT, mapArticleRow } from "@/lib/data";
import type { Article, Category, EventItem, Media, Shop, Tag } from "@/lib/types";
import { DEMO_ARTICLES } from "@/lib/demo/articles";
import { DEMO_CATEGORIES } from "@/lib/demo/categories";
import { DEMO_SHOPS } from "@/lib/demo/shops";
import { DEMO_EVENTS } from "@/lib/demo/events";
import type { AdminSession } from "./auth";

/** 管理画面のデータ取得。admin が null（デモモード）のときはデモデータを返す */

type Sb = SupabaseClient;
const must = <T,>(r: { data: T | null; error: { message: string } | null }, what: string): T => {
  if (r.error) throw new Error(`${what}の取得に失敗しました: ${r.error.message}`);
  return r.data as T;
};

export async function adminArticles(admin: AdminSession | null): Promise<Article[]> {
  if (!admin) return DEMO_ARTICLES;
  const r = await admin.supabase.from("articles").select(ARTICLE_SELECT).order("updated_at", { ascending: false });
  return must(r, "記事").map((x) => mapArticleRow(x as Parameters<typeof mapArticleRow>[0]));
}

export async function adminArticle(admin: AdminSession | null, id: string): Promise<Article | null> {
  if (!admin) return DEMO_ARTICLES.find((a) => a.id === id) ?? null;
  const r = await admin.supabase.from("articles").select(ARTICLE_SELECT).eq("id", id).maybeSingle();
  const row = must(r, "記事");
  return row ? mapArticleRow(row as Parameters<typeof mapArticleRow>[0]) : null;
}

export async function adminCategories(admin: AdminSession | null): Promise<Category[]> {
  if (!admin) return DEMO_CATEGORIES;
  return must(await admin.supabase.from("categories").select("*").order("sort_order"), "カテゴリー");
}

export async function adminTags(admin: AdminSession | null): Promise<(Tag & { count: number })[]> {
  if (!admin) {
    const m = new Map<string, Tag & { count: number }>();
    DEMO_ARTICLES.flatMap((a) => a.tags).forEach((t) => m.set(t.slug, { ...t, count: (m.get(t.slug)?.count ?? 0) + 1 }));
    return [...m.values()];
  }
  const rows = must(await admin.supabase.from("tags").select("*, article_tags(count)").order("name"), "タグ") as (Tag & { article_tags: { count: number }[] })[];
  return rows.map(({ article_tags, ...t }) => ({ ...t, count: article_tags?.[0]?.count ?? 0 }));
}

export async function adminShops(admin: AdminSession | null): Promise<Shop[]> {
  if (!admin) return DEMO_SHOPS;
  return must(await admin.supabase.from("shops").select("*").order("updated_at", { ascending: false }), "店舗");
}

export async function adminShop(admin: AdminSession | null, id: string): Promise<Shop | null> {
  if (!admin) return DEMO_SHOPS.find((s) => s.id === id) ?? null;
  return must(await admin.supabase.from("shops").select("*").eq("id", id).maybeSingle(), "店舗");
}

export async function adminEvents(admin: AdminSession | null): Promise<EventItem[]> {
  if (!admin) return DEMO_EVENTS;
  return must(await admin.supabase.from("events").select("*").order("starts_at", { ascending: false }), "イベント");
}

export async function adminEvent(admin: AdminSession | null, id: string): Promise<EventItem | null> {
  if (!admin) return DEMO_EVENTS.find((e) => e.id === id) ?? null;
  return must(await admin.supabase.from("events").select("*").eq("id", id).maybeSingle(), "イベント");
}

export async function adminMedia(admin: AdminSession | null, limit = 200): Promise<Media[]> {
  if (!admin) return [];
  return must(await admin.supabase.from("media").select("*").order("created_at", { ascending: false }).limit(limit), "画像");
}

export async function dashboardStats(sb: Sb | null) {
  if (!sb) {
    return { published: 0, draft: DEMO_ARTICLES.length, scheduled: 0, shops: DEMO_SHOPS.length, upcoming: DEMO_EVENTS.length, aiToday: 0 };
  }
  const now = new Date().toISOString();
  const c = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const head = { count: "exact" as const, head: true };
  const [published, draft, scheduled, shops, upcoming, aiToday] = await Promise.all([
    c(sb.from("articles").select("id", head).eq("status", "published")),
    c(sb.from("articles").select("id", head).eq("status", "draft")),
    c(sb.from("articles").select("id", head).eq("status", "scheduled").gt("published_at", now)),
    c(sb.from("shops").select("id", head)),
    c(sb.from("events").select("id", head).gte("starts_at", now)),
    c(sb.from("ai_generation_logs").select("id", head).gte("created_at", new Date(Date.now() - 86400000).toISOString())),
  ]);
  return { published, draft, scheduled, shops, upcoming, aiToday };
}
