import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod/v4";
import { AdminError } from "@/lib/admin/auth";
import type { AiSettings } from "@/lib/types";

let client: Anthropic | null = null;

export function claudeConfigured() {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function getClient() {
  if (!claudeConfigured()) throw new AdminError("ANTHROPIC_API_KEY が設定されていないため、AI文章生成は使えません。", 503);
  client ??= new Anthropic();
  return client;
}

/** かわばた日和の編集方針。すべての文章生成に共通で渡す */
export const EDITORIAL_SYSTEM = `あなたは秋田市の繁華街「川反（かわばた）」を紹介する地域Webマガジン「かわばた日和」の編集アシスタントです。

文体と方針:
- 親しみやすく、大人かわいい、温かみのある日本語で書く。です・ます調。
- 若い世代、女性、川反がはじめての人、お酒を飲まない人も読者に含める。
- 特定のお店に偏らず、川反全体の魅力を伝える。

事実についての厳守事項:
- 実在しない店舗、人物、イベント、統計、引用を作らない。
- 店名・住所・料金・営業時間などの具体的な情報は、入力の「参考情報」にあるものだけを使う。ないときは一般的な説明にとどめるか、「【要確認：〇〇】」と書いて編集者に確認を促す。
- 歴史や伝承は断定せず、確かでないものは「〜と言われています」と書く。
- 生成した内容は編集者が事実確認してから公開する前提で書く。`;

export async function generateStructured<S extends z.ZodType>(opts: {
  settings: AiSettings;
  schema: S;
  prompt: string;
  maxTokens?: number;
}): Promise<{ data: z.infer<S>; usage: { input_tokens: number; output_tokens: number } }> {
  const anthropic = getClient();
  try {
    const res = await anthropic.beta.messages.parse({
      model: opts.settings.text_model,
      max_tokens: opts.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: opts.settings.effort, format: betaZodOutputFormat(opts.schema) },
      system: EDITORIAL_SYSTEM,
      messages: [{ role: "user", content: opts.prompt }],
    });
    if (res.stop_reason === "refusal") throw new AdminError("AIがこの依頼への回答を控えました。テーマや表現を変えてお試しください。", 422);
    if (res.stop_reason === "max_tokens") throw new AdminError("生成が長くなりすぎて途中で止まりました。文字数を減らしてお試しください。", 422);
    if (!res.parsed_output) throw new AdminError("AIの出力を読み取れませんでした。もう一度お試しください。", 502);
    return {
      data: res.parsed_output as z.infer<S>,
      usage: { input_tokens: res.usage.input_tokens, output_tokens: res.usage.output_tokens },
    };
  } catch (e) {
    if (e instanceof AdminError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AdminError("AIのAPIキーが無効です。環境変数を確認してください。", 502);
    if (e instanceof Anthropic.RateLimitError) throw new AdminError("AIの利用が集中しています。少し時間をおいてお試しください。", 429);
    if (e instanceof Anthropic.BadRequestError) throw new AdminError(`AIへのリクエストが不正です: ${e.message}`, 400);
    if (e instanceof Anthropic.APIError) throw new AdminError(`AIの呼び出しでエラーが発生しました（${e.status}）。`, 502);
    throw e;
  }
}
