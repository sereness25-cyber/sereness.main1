import "server-only";
import type { AdminSession } from "@/lib/admin/auth";
import { adminArticles, adminCategories, adminShops } from "@/lib/admin/data";

/** 編集画面で使う選択肢（カテゴリー・店舗・記事カード用の公開済み記事） */
export async function editorOptions(admin: AdminSession | null) {
  const [categories, shops, articles] = await Promise.all([adminCategories(admin), adminShops(admin), adminArticles(admin)]);
  const now = Date.now();
  return {
    categories,
    shops: shops.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
    articles: articles
      .filter((a) => (a.status === "published" || a.status === "scheduled") && a.published_at && new Date(a.published_at).getTime() <= now)
      .map((a) => ({ slug: a.slug, label: a.title })),
  };
}
