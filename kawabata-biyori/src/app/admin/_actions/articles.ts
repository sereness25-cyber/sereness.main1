"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, AdminError } from "@/lib/admin/auth";
import { sanitizeArticleHtml, slugify } from "@/lib/html";

const input = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(200),
  slug: z.string().trim().max(120),
  content: z.string().max(400_000),
  excerpt: z.string().trim().max(400),
  thumbnail: z.string().url().nullable(),
  thumbnail_alt: z.string().trim().max(200),
  thumbnail_is_ai: z.boolean(),
  status: z.enum(["draft", "published", "scheduled", "private"]),
  published_at: z.string().datetime({ offset: true }).nullable(),
  seo_title: z.string().trim().max(120),
  seo_description: z.string().trim().max(300),
  focus_keyword: z.string().trim().max(60),
  is_featured: z.boolean(),
  is_sponsored: z.boolean(),
  category_ids: z.array(z.string().uuid()).max(7),
  tag_names: z.array(z.string().trim().min(1).max(30)).max(20),
  shop_ids: z.array(z.string().uuid()).max(20),
});
export type ArticleInput = z.infer<typeof input>;

/** 日本語のタグ名からも安定したスラッグを作る */
function tagSlug(name: string) {
  const ascii = slugify(name);
  if (!ascii.startsWith("post-")) return ascii;
  let h = 2166136261;
  for (const ch of name.normalize("NFKC")) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return `t-${(h >>> 0).toString(36)}`;
}

export async function saveArticle(raw: ArticleInput) {
  return runAction(async ({ supabase, user }) => {
    const v = input.parse(raw);
    const slug = slugify(v.slug || v.title);
    let published_at = v.published_at;
    if (v.status === "scheduled") {
      if (!published_at) throw new AdminError("予約公開には公開日時を指定してください。", 400);
      if (new Date(published_at).getTime() <= Date.now()) throw new AdminError("予約公開の日時は現在より後にしてください。", 400);
    }
    if (v.status === "published" && !published_at) published_at = new Date().toISOString();
    if ((v.status === "published" || v.status === "scheduled") && !v.title) throw new AdminError("公開するにはタイトルが必要です。", 400);

    const row = {
      title: v.title,
      slug,
      content: sanitizeArticleHtml(v.content),
      excerpt: v.excerpt,
      thumbnail: v.thumbnail,
      thumbnail_alt: v.thumbnail_alt,
      thumbnail_is_ai: v.thumbnail_is_ai,
      status: v.status,
      published_at,
      seo_title: v.seo_title,
      seo_description: v.seo_description,
      focus_keyword: v.focus_keyword,
      is_featured: v.is_featured,
      is_sponsored: v.is_sponsored,
    };

    const { data: dup } = await supabase.from("articles").select("id").eq("slug", slug).neq("id", v.id ?? "00000000-0000-0000-0000-000000000000").maybeSingle();
    if (dup) throw new AdminError(`URLスラッグ「${slug}」は別の記事で使われています。`, 409);

    let id = v.id;
    if (id) {
      const { error } = await supabase.from("articles").update(row).eq("id", id);
      if (error) throw new AdminError(`保存に失敗しました: ${error.message}`, 500);
    } else {
      const { data, error } = await supabase.from("articles").insert({ ...row, author_id: user.id }).select("id").single();
      if (error) throw new AdminError(`保存に失敗しました: ${error.message}`, 500);
      id = data.id as string;
    }

    // カテゴリー・タグ・関連店舗の付け替え
    await supabase.from("article_categories").delete().eq("article_id", id);
    if (v.category_ids.length) await supabase.from("article_categories").insert(v.category_ids.map((category_id) => ({ article_id: id, category_id })));

    const names = [...new Set(v.tag_names)];
    await supabase.from("article_tags").delete().eq("article_id", id);
    if (names.length) {
      const { data: tags, error } = await supabase
        .from("tags")
        .upsert(names.map((name) => ({ name, slug: tagSlug(name) })), { onConflict: "slug" })
        .select("id");
      if (error) throw new AdminError(`タグの保存に失敗しました: ${error.message}`, 500);
      await supabase.from("article_tags").insert(tags.map((t) => ({ article_id: id, tag_id: t.id })));
    }

    await supabase.from("article_shops").delete().eq("article_id", id);
    if (v.shop_ids.length) await supabase.from("article_shops").insert(v.shop_ids.map((shop_id) => ({ article_id: id, shop_id })));

    const { data: saved } = await supabase.from("articles").select("updated_at, slug, status, published_at").eq("id", id).single();
    revalidatePath("/", "layout");
    return { id: id!, ...saved };
  });
}

export async function deleteArticle(id: string) {
  return runAction(async ({ supabase }) => {
    const { error } = await supabase.from("articles").delete().eq("id", z.string().uuid().parse(id));
    if (error) throw new AdminError(`削除に失敗しました: ${error.message}`, 500);
    revalidatePath("/", "layout");
  });
}

export async function setArticleStatus(id: string, status: "draft" | "private") {
  return runAction(async ({ supabase }) => {
    const { error } = await supabase.from("articles").update({ status }).eq("id", z.string().uuid().parse(id));
    if (error) throw new AdminError(`更新に失敗しました: ${error.message}`, 500);
    revalidatePath("/", "layout");
  });
}
