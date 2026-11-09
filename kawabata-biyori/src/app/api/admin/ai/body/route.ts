import { z } from "zod/v4";
import { aiRoute } from "@/lib/ai/route";
import { generateStructured } from "@/lib/ai/claude";
import { bodySchema, briefSchema, outlineSchema } from "@/lib/ai/schemas";
import { AdminError } from "@/lib/admin/auth";
import { sanitizeArticleHtml, slugify } from "@/lib/html";

export const maxDuration = 300;

const req = z.object({
  brief: briefSchema,
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(120),
  outline: outlineSchema.shape.sections,
});

export const POST = aiRoute("body", (s) => s.text_model, async ({ settings, admin }, body) => {
  const { brief, title, slug, outline } = req.parse(body);
  const { data, usage } = await generateStructured({
    settings,
    schema: bodySchema,
    maxTokens: 32000,
    prompt: `次の構成で記事本文を書いてください。

タイトル: ${title}
想定読者: ${brief.target || "川反がはじめての20〜40代"}
文章の雰囲気: ${brief.tone}
目標文字数: 約${brief.length}文字（導入・まとめを含む）
SEOキーワード: ${brief.keyword || "なし"}（不自然に繰り返さない）

構成:
${outline.map((s) => `## ${s.h2}\n${s.h3.map((h) => `### ${h}`).join("\n")}\nメモ: ${s.memo}`).join("\n\n")}

参考情報（具体的な店名・数字・日付はここにあるものだけを使う）:
${brief.notes || "（なし）"}

確かでない情報は「【要確認：〇〇】」と本文中に書き、fact_check にも挙げてください。`,
  });

  // 生成内容は必ず「下書き」として保存する（自動公開はしない）
  const factNote = data.fact_check.length
    ? `<div class="callout" data-callout=""><p><strong>公開前の事実確認メモ</strong>（AI生成。確認後に削除）</p><ul>${data.fact_check.map((f) => `<li>${f.replace(/[<>&]/g, "")}</li>`).join("")}</ul></div>`
    : "";
  const content = sanitizeArticleHtml(`${factNote}${data.body_html}${data.summary_html}`);
  let finalSlug = slugify(slug || title);
  const { data: dup } = await admin.supabase.from("articles").select("id").eq("slug", finalSlug).maybeSingle();
  if (dup) finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
  const { data: saved, error } = await admin.supabase
    .from("articles")
    .insert({ title, slug: finalSlug, content, excerpt: data.excerpt, status: "draft", focus_keyword: brief.keyword, author_id: admin.user.id })
    .select("id, slug")
    .single();
  if (error) throw new AdminError(`下書きの保存に失敗しました: ${error.message}`, 500);
  if (brief.category) {
    const { data: cat } = await admin.supabase.from("categories").select("id").eq("name", brief.category).maybeSingle();
    if (cat) await admin.supabase.from("article_categories").insert({ article_id: saved.id, category_id: cat.id });
  }
  return { result: { ...data, content, articleId: saved.id, slug: saved.slug }, usage };
});
