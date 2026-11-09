import { z } from "zod/v4";
import { aiRoute } from "@/lib/ai/route";
import { generateStructured } from "@/lib/ai/claude";
import { REWRITE_MODES, rewriteSchema, type RewriteMode } from "@/lib/ai/schemas";
import { sanitizeArticleHtml } from "@/lib/html";

export const maxDuration = 300;

const req = z.object({
  text: z.string().min(1).max(60_000),
  mode: z.enum(Object.keys(REWRITE_MODES) as [RewriteMode, ...RewriteMode[]]),
  keyword: z.string().max(60).default(""),
  isHtml: z.boolean().default(false),
});

export const POST = aiRoute("rewrite", (s) => s.text_model, async ({ settings }, body) => {
  const { text, mode, keyword, isHtml } = req.parse(body);
  const { data, usage } = await generateStructured({
    settings,
    schema: rewriteSchema,
    prompt: `次の${isHtml ? "HTML" : "文章"}を「${REWRITE_MODES[mode]}」方針で書き換えてください。
${mode === "seo" && keyword ? `キーワード: ${keyword}\n` : ""}事実・固有名詞・数字は変えないでください。${isHtml ? "見出しや段落などのHTML構造は保ってください。" : ""}

---
${text}`,
  });
  return { result: { text: isHtml ? sanitizeArticleHtml(data.text) : data.text }, usage };
});
