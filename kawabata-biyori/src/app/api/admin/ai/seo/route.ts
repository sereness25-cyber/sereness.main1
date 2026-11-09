import { z } from "zod/v4";
import { aiRoute } from "@/lib/ai/route";
import { generateStructured } from "@/lib/ai/claude";
import { seoSchema } from "@/lib/ai/schemas";
import { stripHtml } from "@/lib/html";

export const maxDuration = 300;

const req = z.object({
  articleId: z.string().uuid().optional(),
  title: z.string().max(200),
  html: z.string().max(400_000),
  keyword: z.string().max(60).default(""),
});

export const POST = aiRoute("seo", (s) => s.text_model, async ({ settings, admin }, body) => {
  const { articleId, title, html, keyword } = req.parse(body);
  // 関連記事の候補は「公開済みの記事」だけ。AIはこの中からしか選べない
  const now = new Date().toISOString();
  const { data: published } = await admin.supabase
    .from("articles")
    .select("id, slug, title, excerpt")
    .in("status", ["published", "scheduled"])
    .lte("published_at", now)
    .order("published_at", { ascending: false })
    .limit(200);
  const candidates = (published ?? []).filter((a) => a.id !== articleId);
  const { data, usage } = await generateStructured({
    settings,
    schema: seoSchema,
    prompt: `次の記事のSEO情報、SNS投稿文、改善提案を作ってください。

タイトル: ${title}
フォーカスキーワード: ${keyword || "（未設定。内容から推測してよい）"}
本文:
${stripHtml(html).slice(0, 20000)}

関連記事の候補（slug｜タイトル）。related_slugs はこの中からだけ選ぶ:
${candidates.map((a) => `${a.slug}｜${a.title}`).join("\n") || "（公開済みの記事はまだありません。related_slugs は空にする）"}`,
  });
  const valid = new Map(candidates.map((a) => [a.slug, a]));
  const related = data.related_slugs.filter((s) => valid.has(s)).slice(0, 3).map((s) => ({ slug: s, title: valid.get(s)!.title }));
  return { result: { ...data, related }, usage };
});
