import "server-only";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { AdminError } from "@/lib/admin/auth";

export type ImageAspect = "16:9" | "1:1" | "9:16";
export type ImageStyle = "photo" | "kawaii" | "watercolor" | "magazine" | "auto";

export const STYLE_PROMPTS: Record<ImageStyle, string> = {
  photo: "photorealistic, natural soft lighting, editorial photography",
  kawaii: "stylish and cute illustration for adult women, soft pastel dusty pink and navy palette, clean lines",
  watercolor: "soft watercolor illustration, gentle bleeding colors, warm and nostalgic",
  magazine: "lifestyle magazine cover style composition, refined, airy, generous negative space",
  auto: "warm, clean, inviting atmosphere matching a local lifestyle web magazine",
};

const GEN_SIZE: Record<ImageAspect, "1536x1024" | "1024x1024" | "1024x1536"> = {
  "16:9": "1536x1024",
  "1:1": "1024x1024",
  "9:16": "1024x1536",
};
const OUT_SIZE: Record<ImageAspect, [number, number]> = {
  "16:9": [1600, 900],
  "1:1": [1080, 1080],
  "9:16": [1080, 1920],
};

export function imageConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

function getClient() {
  if (!imageConfigured()) throw new AdminError("OPENAI_API_KEY が設定されていないため、AI画像生成は使えません。", 503);
  return new OpenAI();
}

/** 生成サイズ（3:2など）から指定の比率に中央で切り出し、WebPにする */
async function toAspect(buf: Buffer, aspect: ImageAspect) {
  const [w, h] = OUT_SIZE[aspect];
  const out = await sharp(buf).resize(w, h, { fit: "cover", position: "centre" }).webp({ quality: 86 }).toBuffer();
  return { buffer: out, width: w, height: h, mime: "image/webp" };
}

function buildPrompt(prompt: string, style: ImageStyle) {
  return [
    prompt,
    `Style: ${STYLE_PROMPTS[style]}.`,
    "Do not include any text, letters, logos, or signage with readable words. Do not depict real identifiable people or real shop facades.",
  ].join("\n");
}

function handle(e: unknown): never {
  if (e instanceof AdminError) throw e;
  if (e instanceof OpenAI.AuthenticationError) throw new AdminError("画像生成のAPIキーが無効です。", 502);
  if (e instanceof OpenAI.RateLimitError) throw new AdminError("画像生成の利用が集中しています。時間をおいてお試しください。", 429);
  if (e instanceof OpenAI.BadRequestError) throw new AdminError(`画像生成のリクエストが受け付けられませんでした: ${e.message}`, 400);
  if (e instanceof OpenAI.APIError) throw new AdminError(`画像生成でエラーが発生しました（${e.status}）。`, 502);
  throw e;
}

export async function generateImage(opts: { model: string; prompt: string; style: ImageStyle; aspect: ImageAspect }) {
  try {
    const res = await getClient().images.generate({ model: opts.model, prompt: buildPrompt(opts.prompt, opts.style), size: GEN_SIZE[opts.aspect], n: 1 });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new AdminError("画像を受け取れませんでした。もう一度お試しください。", 502);
    return toAspect(Buffer.from(b64, "base64"), opts.aspect);
  } catch (e) {
    handle(e);
  }
}

export async function editImage(opts: { model: string; source: Buffer; instruction: string; aspect: ImageAspect }) {
  try {
    const png = await sharp(opts.source).png().toBuffer();
    const res = await getClient().images.edit({
      model: opts.model,
      image: await toFile(png, "source.png", { type: "image/png" }),
      prompt: `${opts.instruction}\nKeep the overall composition. Do not add text or logos.`,
      size: GEN_SIZE[opts.aspect],
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new AdminError("編集後の画像を受け取れませんでした。", 502);
    return toAspect(Buffer.from(b64, "base64"), opts.aspect);
  } catch (e) {
    handle(e);
  }
}
