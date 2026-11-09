import { aiRoute } from "@/lib/ai/route";
import { generateStructured } from "@/lib/ai/claude";
import { briefSchema, outlineSchema } from "@/lib/ai/schemas";

export const maxDuration = 300;

export const POST = aiRoute("outline", (s) => s.text_model, async ({ settings }, body) => {
  const brief = briefSchema.parse(body);
  const { data, usage } = await generateStructured({
    settings,
    schema: outlineSchema,
    prompt: `次の条件で「かわばた日和」の記事の構成案を作ってください。

テーマ: ${brief.theme}
カテゴリー: ${brief.category || "おまかせ"}
想定読者: ${brief.target || "川反がはじめての20〜40代"}
文章の雰囲気: ${brief.tone}
目標文字数: 約${brief.length}文字
SEOキーワード: ${brief.keyword || "なし"}
参考情報（取材メモなど。具体的な店名・数字はここにあるものだけを使う）:
${brief.notes || "（なし）"}`,
  });
  return { result: data, usage };
});
